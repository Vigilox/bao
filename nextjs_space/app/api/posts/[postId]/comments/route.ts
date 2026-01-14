/**
 * Comments API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null }, // Top-level comments only
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
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
        replies: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { username: true, displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    let nextCursor: string | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ comments, nextCursor });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST - Create a comment
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

    const body = await request.json();
    const { content, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        postId,
        content: content.trim(),
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Create notification for post owner (if not self-comment)
    if (post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          actorId: session.user.id,
          type: 'comment',
          postId,
          message: content.trim().slice(0, 100),
        },
      });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Comment create error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
