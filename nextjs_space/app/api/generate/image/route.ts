/**
 * Image Generation API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { kieAIClient } from '@/lib/kie-ai-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, shotId, prompt, aspectRatio, model } = body;

    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: 'projectId and prompt are required' },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: (session.user as any)?.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate image using Kie.AI
    const result = await kieAIClient.generateImage({
      prompt,
      aspectRatio: aspectRatio || '16:9',
      model: model || 'google/nano-banana',
    });

    if (result?.status === 'failed') {
      return NextResponse.json(
        { error: result?.error || 'Generation failed' },
        { status: 500 }
      );
    }

    // Save generation task
    const task = await prisma.generationTask.create({
      data: {
        projectId,
        shotId: shotId || null,
        taskId: result?.taskId,
        status: 'pending',
        model: model || 'google/nano-banana',
        taskType: 'image',
        parameters: { prompt, aspectRatio },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
