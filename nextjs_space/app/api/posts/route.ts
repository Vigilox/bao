/**
 * Posts API - Create and list posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List user's posts or all public posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    let where: any = { isPublic: true };

    if (userId) {
      where.userId = userId;
    } else if (username) {
      const profile = await prisma.creatorProfile.findUnique({
        where: { username },
        select: { userId: true },
      });
      if (profile) {
        where.userId = profile.userId;
      }
    }

    // If viewing own posts, include private ones
    if (session?.user?.id && where.userId === session.user.id) {
      delete where.isPublic;
    }

    const posts = await prisma.post.findMany({
      where,
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
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    // Add like/save status for current user
    let postsWithStatus = posts;
    if (session?.user?.id) {
      const postIds = posts.map(p => p.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({
          where: { userId: session.user.id, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.savedPost.findMany({
          where: { userId: session.user.id, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      const likedIds = new Set(likes.map(l => l.postId));
      const savedIds = new Set(saves.map(s => s.postId));
      postsWithStatus = posts.map(post => ({
        ...post,
        isLiked: likedIds.has(post.id),
        isSaved: savedIds.has(post.id),
      }));
    }

    return NextResponse.json({ posts: postsWithStatus, nextCursor });
  } catch (error) {
    console.error('Posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      caption,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      cloudStoragePath,
      prompt,
      modelUsed,
      aspectRatio,
      duration,
      tags,
      isPublic = true,
    } = body;

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ error: 'Media URL and type are required' }, { status: 400 });
    }

    // Ensure user has a profile
    let profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      profile = await prisma.creatorProfile.create({
        data: {
          userId: session.user.id,
          username: `user_${session.user.id.slice(0, 8)}`,
          displayName: session.user.name,
        },
      });
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        title,
        caption,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        cloudStoragePath,
        prompt,
        modelUsed,
        aspectRatio,
        duration,
        tags: tags || [],
        isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true, displayName: true, avatarUrl: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Post create error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
