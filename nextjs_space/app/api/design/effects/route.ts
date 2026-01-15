import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch effects for an artboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const artboardId = searchParams.get('artboardId');

    if (!artboardId) {
      return NextResponse.json({ error: 'artboardId is required' }, { status: 400 });
    }

    const effects = await prisma.designEffect.findMany({
      where: { artboardId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ effects });
  } catch (error) {
    console.error('[DESIGN_EFFECTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new effect
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artboardId, objectId, effectType, properties } = await request.json();

    if (!artboardId || !objectId || !effectType || !properties) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify artboard belongs to user's project
    const artboard = await prisma.artboard.findFirst({
      where: {
        id: artboardId,
        project: {
          userId: session.user.id as string,
        },
      },
    });

    if (!artboard) {
      return NextResponse.json({ error: 'Artboard not found' }, { status: 404 });
    }

    // Get the next order number
    const lastEffect = await prisma.designEffect.findFirst({
      where: { artboardId, objectId },
      orderBy: { order: 'desc' },
    });

    const effect = await prisma.designEffect.create({
      data: {
        artboardId,
        objectId,
        effectType,
        properties,
        order: lastEffect ? lastEffect.order + 1 : 0,
      },
    });

    return NextResponse.json({ effect });
  } catch (error) {
    console.error('[DESIGN_EFFECTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update effect
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { effectId, properties, isEnabled } = await request.json();

    if (!effectId) {
      return NextResponse.json({ error: 'effectId is required' }, { status: 400 });
    }

    const effect = await prisma.designEffect.update({
      where: { id: effectId },
      data: {
        ...(properties && { properties }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
    });

    return NextResponse.json({ effect });
  } catch (error) {
    console.error('[DESIGN_EFFECTS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove effect
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const effectId = searchParams.get('effectId');

    if (!effectId) {
      return NextResponse.json({ error: 'effectId is required' }, { status: 400 });
    }

    await prisma.designEffect.delete({
      where: { id: effectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DESIGN_EFFECTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}