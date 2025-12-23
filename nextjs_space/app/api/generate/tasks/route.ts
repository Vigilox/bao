/**
 * Generation Tasks List API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskType = searchParams.get('taskType'); // 'image', 'video', or undefined for all

    const whereClause: any = {
      project: {
        userId: (session.user as any)?.id,
      },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (taskType) {
      whereClause.taskType = taskType;
    }

    const tasks = await prisma.generationTask.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent tasks
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
