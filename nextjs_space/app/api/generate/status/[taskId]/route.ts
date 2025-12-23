/**
 * Check Generation Task Status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { kieAIClient } from '@/lib/kie-ai-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task from database
    const dbTask = await prisma.generationTask.findFirst({
      where: {
        id: params?.taskId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
    });

    if (!dbTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check status with Kie.AI
    const status = await kieAIClient.checkTaskStatus(dbTask?.taskId);

    // Update database
    const updated = await prisma.generationTask.update({
      where: { id: params?.taskId },
      data: {
        status: status?.status,
        resultUrl: status?.resultUrl || null,
        errorMsg: status?.error || null,
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error: any) {
    console.error('Error checking task status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
