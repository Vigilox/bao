/**
 * Content Feed API - Discover and personalized feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'discover'; // 'discover', 'following', 'trending'
    const mediaType = searchParams.get('mediaType'); // 'image', 'video'
    const model = searchParams.get('model'); // Filter by AI model
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let where: any = { isPublic: true };
    let orderBy: any = { createdAt: 'desc' };

    // Filter by media type
    if (mediaType) {
      where.mediaType = mediaType;
    }

    // Filter by AI model
    if (model) {
      where.modelUsed = model;
    }

    // Filter by tag
    if (tag) {
      where.tags = { has: tag };
    }

    // Search in caption/title/prompt
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
        { prompt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Following feed - only posts from followed users
    if (type === 'following' && session?.user?.id) {
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });
      where.userId = { in: following.map(f => f.followingId) };
    }

    // Trending feed - sort by engagement
    if (type === 'trending') {
      // Get posts with most engagement in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
      // We'll sort by view count as a proxy for trending
      orderBy = { viewCount: 'desc' };
    }

    // Featured posts first if on discover
    if (type === 'discover') {
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                isVerified: true,
              },
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
    console.error('Feed fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
