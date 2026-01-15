import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get creator profile
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Get analytics for the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.creatorAnalytics.findMany({
      where: {
        creatorProfileId: profile.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Get summary statistics
    const totalFollowers = await prisma.follow.count({
      where: { followingId: session.user.id as string },
    });

    const totalPosts = await prisma.post.count({
      where: { userId: session.user.id as string },
    });

    const totalLikes = await prisma.like.count({
      where: {
        post: { userId: session.user.id as string },
      },
    });

    const totalComments = await prisma.comment.count({
      where: {
        post: { userId: session.user.id as string },
      },
    });

    // Get top posts
    const topPosts = await prisma.post.findMany({
      where: { userId: session.user.id as string },
      orderBy: { viewCount: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      analytics,
      summary: {
        totalFollowers,
        totalPosts,
        totalLikes,
        totalComments,
        topPosts,
      },
    });
  } catch (error) {
    console.error('[CREATOR_ANALYTICS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update daily analytics (should be called by a cron job or on-demand)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: session.user.id as string },
    });

    // Get new followers today
    const newFollowers = await prisma.follow.count({
      where: {
        followingId: session.user.id as string,
        createdAt: { gte: today },
      },
    });

    // Get total posts
    const totalPosts = await prisma.post.count({
      where: { userId: session.user.id as string },
    });

    // Get total likes and comments
    const totalLikes = await prisma.like.count({
      where: {
        post: { userId: session.user.id as string },
      },
    });

    const totalComments = await prisma.comment.count({
      where: {
        post: { userId: session.user.id as string },
      },
    });

    // Get video and image views
    const posts = await prisma.post.findMany({
      where: { userId: session.user.id as string },
      select: { mediaType: true, viewCount: true },
    });

    const videoViews = posts
      .filter((p: any) => p.mediaType === 'video')
      .reduce((sum: number, p: any) => sum + p.viewCount, 0);

    const imageViews = posts
      .filter((p: any) => p.mediaType === 'image')
      .reduce((sum: number, p: any) => sum + p.viewCount, 0);

    // Calculate engagement rate
    const totalViews = videoViews + imageViews;
    const engagementRate = totalViews > 0
      ? ((totalLikes + totalComments) / totalViews) * 100
      : 0;

    // Upsert today's analytics
    const analytics = await prisma.creatorAnalytics.upsert({
      where: {
        creatorProfileId_date: {
          creatorProfileId: profile.id,
          date: today,
        },
      },
      update: {
        profileViews: profile.totalViews,
        newFollowers,
        totalFollowers: followerCount,
        totalLikes,
        totalComments,
        totalPosts,
        totalVideoViews: videoViews,
        totalImageViews: imageViews,
        engagementRate,
      },
      create: {
        creatorProfileId: profile.id,
        date: today,
        profileViews: profile.totalViews,
        newFollowers,
        totalFollowers: followerCount,
        totalLikes,
        totalComments,
        totalPosts,
        totalVideoViews: videoViews,
        totalImageViews: imageViews,
        engagementRate,
      },
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('[CREATOR_ANALYTICS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}