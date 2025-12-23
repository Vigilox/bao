/**
 * Single Scene API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get single scene with shots
export async function GET(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scene = await prisma.scene.findFirst({
      where: {
        id: params?.sceneId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
      include: {
        shots: {
          orderBy: { order: 'asc' },
        },
        project: true,
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json({ scene });
  } catch (error: any) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update scene
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, order } = body;

    // Verify ownership
    const scene = await prisma.scene.findFirst({
      where: {
        id: params?.sceneId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const updated = await prisma.scene.update({
      where: { id: params?.sceneId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ scene: updated });
  } catch (error: any) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete scene
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const scene = await prisma.scene.findFirst({
      where: {
        id: params?.sceneId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    await prisma.scene.delete({
      where: { id: params?.sceneId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
