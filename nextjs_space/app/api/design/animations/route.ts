import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch animations for an artboard
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

    const animations = await prisma.designAnimation.findMany({
      where: { artboardId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ animations });
  } catch (error) {
    console.error('[DESIGN_ANIMATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new animation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      artboardId,
      objectId,
      name,
      animationType,
      duration,
      delay,
      easing,
      iterations,
      keyframes,
    } = await request.json();

    if (!artboardId || !objectId || !name || !animationType || !keyframes) {
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

    const animation = await prisma.designAnimation.create({
      data: {
        artboardId,
        objectId,
        name,
        animationType,
        duration: duration || 1000,
        delay: delay || 0,
        easing: easing || 'ease-in-out',
        iterations: iterations || 1,
        keyframes,
      },
    });

    return NextResponse.json({ animation });
  } catch (error) {
    console.error('[DESIGN_ANIMATIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update animation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animationId, ...updates } = await request.json();

    if (!animationId) {
      return NextResponse.json({ error: 'animationId is required' }, { status: 400 });
    }

    const animation = await prisma.designAnimation.update({
      where: { id: animationId },
      data: updates,
    });

    return NextResponse.json({ animation });
  } catch (error) {
    console.error('[DESIGN_ANIMATIONS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove animation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const animationId = searchParams.get('animationId');

    if (!animationId) {
      return NextResponse.json({ error: 'animationId is required' }, { status: 400 });
    }

    await prisma.designAnimation.delete({
      where: { id: animationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DESIGN_ANIMATIONS_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}