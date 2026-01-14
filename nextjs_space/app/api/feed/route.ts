/**
 * Content Feed API - Discover and personalized feed
 * 
 * Trending Algorithm:
 * Score = (likes * 3 + comments * 5 + views * 0.1) / (hours_since_posted ^ 1.5)
 * This balances engagement with recency (newer posts get boosted)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Calculate trending score
function calculateTrendingScore(
  likes: number,
  comments: number,
  views: number,
  createdAt: Date
): number {
  const hoursSincePosted = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  const engagement = (likes * 3) + (comments * 5) + (views * 0.1);
  return engagement / Math.pow(hoursSincePosted, 1.5);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'discover'; // 'discover', 'following', 'trending', 'featured'
    const mediaType = searchParams.get('mediaType'); // 'image', 'video'
    const model = searchParams.get('model'); // Filter by AI model
    const tag = searchParams.get('tag'); // Filter by tag slug
    const tagId = searchParams.get('tagId'); // Filter by tag ID
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

    // Filter by tag (using PostTag relation)
    if (tag) {
      // First find the tag by slug
      const tagRecord = await prisma.tag.findUnique({ where: { slug: tag } });
      if (tagRecord) {
        where.postTags = { some: { tagId: tagRecord.id } };
      } else {
        // Fall back to legacy string array
        where.tags = { has: tag };
      }
    } else if (tagId) {
      where.postTags = { some: { tagId } };
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

    // Featured feed - only featured posts
    if (type === 'featured') {
      where.isFeatured = true;
      orderBy = { featuredAt: 'desc' };
    }

    // Trending feed - sort by trending score
    if (type === 'trending') {
      // Get posts from last 14 days for trending calculation
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      where.createdAt = { gte: fourteenDaysAgo };
      orderBy = { trendingScore: 'desc' };
    }

    // Discover feed - featured first, then recent
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
        postTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
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

// Update trending scores - can be called periodically
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all posts from last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: fourteenDaysAgo },
      },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Update trending scores
    const updates = posts.map(post => {
      const score = calculateTrendingScore(
        post._count.likes,
        post._count.comments,
        post.viewCount,
        post.createdAt
      );
      return prisma.post.update({
        where: { id: post.id },
        data: { trendingScore: score },
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ 
      success: true, 
      updatedCount: posts.length,
      message: `Updated trending scores for ${posts.length} posts`,
    });
  } catch (error) {
    console.error('Error updating trending scores:', error);
    return NextResponse.json({ error: 'Failed to update trending scores' }, { status: 500 });
  }
}
