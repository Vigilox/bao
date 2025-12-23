/**
 * Single Shot API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Update shot
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, assetUrl, assetType, modelUsed, metadata, order } = body;

    // Verify ownership
    const shot = await prisma.shot.findFirst({
      where: {
        id: params?.shotId,
        scene: {
          project: {
            userId: (session.user as any)?.id,
          },
        },
      },
    });

    if (!shot) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 });
    }

    const updated = await prisma.shot.update({
      where: { id: params?.shotId },
      data: {
        ...(prompt && { prompt }),
        ...(assetUrl !== undefined && { assetUrl }),
        ...(assetType !== undefined && { assetType }),
        ...(modelUsed !== undefined && { modelUsed }),
        ...(metadata !== undefined && { metadata }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ shot: updated });
  } catch (error: any) {
    console.error('Error updating shot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete shot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const shot = await prisma.shot.findFirst({
      where: {
        id: params?.shotId,
        scene: {
          project: {
            userId: (session.user as any)?.id,
          },
        },
      },
    });

    if (!shot) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 });
    }

    await prisma.shot.delete({
      where: { id: params?.shotId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
