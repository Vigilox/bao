/**
 * Assets API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// Get assets for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('assetType');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    const where: any = { projectId };
    if (assetType) {
      where.assetType = assetType;
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Generate signed URLs for private assets
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        const url = await getFileUrl(asset?.cloudStoragePath, asset?.isPublic);
        return {
          ...asset,
          url,
        };
      })
    );

    return NextResponse.json({ assets: assetsWithUrls });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      filename,
      assetType,
      cloudStoragePath,
      isPublic,
      prompt,
      modelUsed,
      metadata,
      tags,
    } = body;

    if (!projectId || !filename || !assetType || !cloudStoragePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate URL
    const url = await getFileUrl(cloudStoragePath, isPublic || false);

    const asset = await prisma.asset.create({
      data: {
        projectId,
        filename,
        assetType,
        cloudStoragePath,
        isPublic: isPublic || false,
        url,
        prompt: prompt || null,
        modelUsed: modelUsed || null,
        metadata: metadata || null,
        tags: tags || [],
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
