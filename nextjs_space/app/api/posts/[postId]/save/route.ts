/**
 * Save/Unsave Post API (Bookmarks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Save a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.savedPost.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ saved: true });
    }
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
  }
}

// DELETE - Unsave a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error('Unsave error:', error);
    return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 });
  }
}
