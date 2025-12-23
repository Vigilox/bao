/**
 * Chat API Route with Streaming
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { retrieveRelevantChunks } from '@/lib/rag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
          controller.enqueue(encoder.encode('data: {"error": "Unauthorized"}\n\n'));
          controller.close();
          return;
        }

        const body = await request.json();
        const { projectId, message, history } = body;

        if (!projectId || !message) {
          controller.enqueue(encoder.encode('data: {"error": "projectId and message are required"}\n\n'));
          controller.close();
          return;
        }

        // Verify user owns the project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            userId: (session.user as any)?.id,
          },
          include: {
            scenes: {
              include: {
                shots: true,
              },
            },
          },
        });

        if (!project) {
          controller.enqueue(encoder.encode('data: {"error": "Project not found"}\n\n'));
          controller.close();
          return;
        }

        // Save user message
        await prisma.chatMessage.create({
          data: {
            projectId,
            role: 'user',
            content: message,
          },
        });

        // Retrieve relevant context from documents (RAG)
        const relevantChunks = await retrieveRelevantChunks(projectId, message, {
          limit: 3,
          threshold: 0.7,
        });

        // Build system prompt with context
        const contextText = relevantChunks?.length > 0
          ? `\n\nRelevant context from uploaded documents:\n${relevantChunks.map(c => c?.content).join('\n\n')}`
          : '';

        const systemPrompt = `You are an AI creative assistant helping users produce cinema-grade stories and campaigns. You help with:
- Planning creative projects and story structure
- Suggesting shot lists and scene breakdowns
- Generating storyboards from scripts
- Refining and iterating on generated content
- Navigating project structure

Current project: ${project?.name}
Project description: ${project?.description || 'No description'}
Scenes: ${project?.scenes?.length || 0}
${contextText}

Be concise, creative, and helpful. Focus on actionable suggestions.`;

        // Prepare messages for LLM
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(history || []),
          { role: 'user', content: message },
        ];

        // Call LLM API with streaming
        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages,
            stream: true,
            max_tokens: 2000,
          }),
        });

        if (!response?.ok) {
          controller.enqueue(encoder.encode('data: {"error": "LLM API request failed"}\n\n'));
          controller.close();
          return;
        }

        const reader = response?.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode('data: {"error": "No response body"}\n\n'));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed?.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Save assistant message
        if (fullResponse) {
          await prisma.chatMessage.create({
            data: {
              projectId,
              role: 'assistant',
              content: fullResponse,
            },
          });
        }

        controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
        controller.close();
      } catch (error: any) {
        console.error('Chat error:', error);
        controller.enqueue(encoder.encode(`data: {"error": "${error?.message || 'Internal server error'}"}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
