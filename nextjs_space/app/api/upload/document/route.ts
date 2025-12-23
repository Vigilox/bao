/**
 * Upload Document for RAG Processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFileBuffer } from '@/lib/s3';
import { extractTextFromFile, processDocument } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const contentType = formData.get('contentType') as string || 'reference';

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and projectId are required' },
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from document
    const extractedText = await extractTextFromFile(buffer, file.name);

    // Upload to S3
    const cloud_storage_path = await uploadFileBuffer(
      buffer,
      file.name,
      file.type,
      false // Private
    );

    // Save document record
    const document = await prisma.document.create({
      data: {
        projectId,
        filename: file.name,
        cloudStoragePath: cloud_storage_path,
        isPublic: false,
        contentType,
        extractedText,
      },
    });

    // Process document for RAG (async, don't wait)
    if (extractedText) {
      processDocument(document.id).catch(err => {
        console.error('Error processing document for RAG:', err);
      });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
