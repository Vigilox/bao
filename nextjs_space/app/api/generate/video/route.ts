/**
 * Video Generation API Route
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
    const { projectId, shotId, prompt, aspectRatio, imageUrl, duration } = body;

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

    // Generate video using Kie.AI
    const result = await kieAIClient.generateVideo({
      prompt,
      aspectRatio: aspectRatio || '16:9',
      imageUrl: imageUrl || undefined,
      duration: duration || 5,
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
        model: 'veo3-fast',
        taskType: 'video',
        parameters: { prompt, aspectRatio, imageUrl, duration },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
