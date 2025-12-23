/**
 * Complete File Upload and Save to Database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, cloud_storage_path, isPublic, assetType, filename, metadata } = body;

    if (!projectId || !cloud_storage_path) {
      return NextResponse.json(
        { error: 'projectId and cloud_storage_path are required' },
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

    // Get file URL
    const url = await getFileUrl(cloud_storage_path, isPublic || false);

    // Save asset to database
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filename: filename || cloud_storage_path.split('/').pop() || 'file',
        assetType: assetType || 'image',
        cloudStoragePath: cloud_storage_path,
        isPublic: isPublic || false,
        url,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ asset, url });
  } catch (error: any) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
