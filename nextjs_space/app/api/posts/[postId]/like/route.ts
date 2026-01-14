/**
 * Like/Unlike Post API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Like a post
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create like
    await prisma.like.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    // Create notification for post owner (if not self-like)
    if (post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          actorId: session.user.id,
          type: 'like',
          postId,
        },
      });
    }

    const likeCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ liked: true, likeCount });
  } catch (error: any) {
    // If already liked, return success
    if (error?.code === 'P2002') {
      const likeCount = await prisma.like.count({ where: { postId: params.postId } });
      return NextResponse.json({ liked: true, likeCount });
    }
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

// DELETE - Unlike a post
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

    await prisma.like.delete({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    const likeCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ liked: false, likeCount });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
