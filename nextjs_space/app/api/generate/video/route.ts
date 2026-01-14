/**
 * Video Generation API Route
 * Supports both Veo 3.1 and Sora 2 models
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { kieAIClient, Sora2AspectRatio, Sora2Duration, Sora2Quality } from '@/lib/kie-ai-client';

// Helper to convert standard aspect ratio to Sora 2 format
function toSora2AspectRatio(ratio: string): Sora2AspectRatio {
  const portraitRatios = ['9:16', '3:4'];
  return portraitRatios.includes(ratio) ? 'Portrait' : 'Landscape';
}

// Helper to convert duration number to Sora 2 format
function toSora2Duration(seconds: number): Sora2Duration {
  if (seconds <= 10) return '10s';
  if (seconds <= 15) return '15s';
  return '25s';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      projectId, 
      shotId, 
      prompt, 
      aspectRatio, 
      imageUrl, 
      duration,
      // New Sora 2 parameters
      videoModel = 'veo3', // 'veo3' | 'sora2' | 'sora2-pro'
      quality,             // 'Standard' | 'High' (Sora 2 only)
      removeWatermark,     // boolean (Sora 2 only)
    } = body;

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

    let result;
    let modelName: string;

    // Route to appropriate generation method based on videoModel
    if (videoModel === 'sora2' || videoModel === 'sora2-pro') {
      // Use Sora 2
      const sora2Quality: Sora2Quality = videoModel === 'sora2-pro' ? 'High' : (quality || 'Standard');
      
      result = await kieAIClient.generateVideoSora2({
        prompt,
        aspectRatio: toSora2AspectRatio(aspectRatio || '16:9'),
        duration: toSora2Duration(duration || 10),
        quality: sora2Quality,
        removeWatermark: removeWatermark ?? false,
        imageUrl: imageUrl || undefined,
      });
      
      modelName = videoModel === 'sora2-pro' ? 'sora2-pro' : 'sora2';
    } else {
      // Default to Veo 3.1
      result = await kieAIClient.generateVideo({
        prompt,
        aspectRatio: aspectRatio || '16:9',
        imageUrl: imageUrl || undefined,
        duration: duration || 5,
      });
      
      modelName = 'veo3-fast';
    }

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
        model: modelName,
        taskType: 'video',
        parameters: { 
          prompt, 
          aspectRatio, 
          imageUrl, 
          duration,
          videoModel,
          quality: videoModel?.startsWith('sora2') ? quality : undefined,
          removeWatermark: videoModel?.startsWith('sora2') ? removeWatermark : undefined,
        },
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
