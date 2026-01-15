import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;

    // Verify post belongs to user
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: session.user.id as string,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get or create analytics
    let analytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    });

    if (!analytics) {
      analytics = await prisma.postAnalytics.create({
        data: { postId },
      });
    }

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('[POST_ANALYTICS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update analytics (for tracking views, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { views, uniqueViews, likes, comments, shares, avgWatchTime } = await request.json();

    // Upsert analytics
    const analytics = await prisma.postAnalytics.upsert({
      where: { postId },
      update: {
        ...(views !== undefined && { views }),
        ...(uniqueViews !== undefined && { uniqueViews }),
        ...(likes !== undefined && { likes }),
        ...(comments !== undefined && { comments }),
        ...(shares !== undefined && { shares }),
        ...(avgWatchTime !== undefined && { avgWatchTime }),
      },
      create: {
        postId,
        views: views || 0,
        uniqueViews: uniqueViews || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        avgWatchTime: avgWatchTime || null,
      },
    });

    // Calculate engagement rate
    const engagementRate = analytics.views > 0
      ? ((analytics.likes + analytics.comments + analytics.shares) / analytics.views) * 100
      : 0;

    await prisma.postAnalytics.update({
      where: { postId },
      data: { engagementRate },
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('[POST_ANALYTICS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}