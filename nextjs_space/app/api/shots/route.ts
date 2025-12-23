/**
 * Shots API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get shots for a scene
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Scene ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the scene
    const scene = await prisma.scene.findFirst({
      where: {
        id: sceneId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const shots = await prisma.shot.findMany({
      where: { sceneId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ shots });
  } catch (error: any) {
    console.error('Error fetching shots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new shot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sceneId, prompt, assetUrl, assetType, modelUsed, metadata } = body;

    if (!sceneId || !prompt) {
      return NextResponse.json(
        { error: 'Scene ID and prompt are required' },
        { status: 400 }
      );
    }

    // Verify user owns the scene
    const scene = await prisma.scene.findFirst({
      where: {
        id: sceneId,
        project: {
          userId: (session.user as any)?.id,
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Get the max order
    const maxOrder = await prisma.shot.findFirst({
      where: { sceneId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const shot = await prisma.shot.create({
      data: {
        sceneId,
        prompt,
        assetUrl: assetUrl || null,
        assetType: assetType || null,
        modelUsed: modelUsed || null,
        metadata: metadata || null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ shot }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
