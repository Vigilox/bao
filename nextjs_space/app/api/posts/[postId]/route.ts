/**
 * Single Post API - Get, Update, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const session = await getServerSession(authOptions);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { username: true, displayName: true, avatarUrl: true, isVerified: true },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check visibility
    if (!post.isPublic && post.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    // Check if user liked/saved
    let isLiked = false;
    let isSaved = false;
    if (session?.user?.id) {
      const [like, save] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId: session.user.id, postId } },
        }),
        prisma.savedPost.findUnique({
          where: { userId_postId: { userId: session.user.id, postId } },
        }),
      ]);
      isLiked = !!like;
      isSaved = !!save;
    }

    return NextResponse.json({
      post: {
        ...post,
        isLiked,
        isSaved,
        isOwner: session?.user?.id === post.userId,
      },
    });
  } catch (error) {
    console.error('Post fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// PATCH - Update post
export async function PATCH(
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
    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    const body = await request.json();
    const { title, caption, tags, isPublic } = body;

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        caption,
        tags,
        isPublic,
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - Delete post
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
