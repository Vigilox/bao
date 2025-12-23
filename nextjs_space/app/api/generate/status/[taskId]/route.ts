/**
 * Task Status Polling API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { kieAIClient } from '@/lib/kie-ai-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    // Get task from database
    const task = await prisma.generationTask.findFirst({
      where: {
        id: taskId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If task is already completed or failed, return cached result
    if (task.status === 'completed' || task.status === 'failed') {
      return NextResponse.json({ task }, { status: 200 });
    }

    // Poll Kie.AI for status update
    const statusResult = await kieAIClient.checkTaskStatus(task.taskId);

    // Update task in database
    const updatedTask = await prisma.generationTask.update({
      where: { id: taskId },
      data: {
        status: statusResult.status,
        resultUrl: statusResult.resultUrl || task.resultUrl,
        errorMsg: statusResult.error || task.errorMsg,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error: any) {
    console.error('Error checking task status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
