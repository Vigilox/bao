/**
 * Public Creator Profile API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const session = await getServerSession(authOptions);

    const profile = await prisma.creatorProfile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: { where: { isPublic: true } },
              },
            },
          },
        },
      },
    });

    if (!profile || !profile.isPublic) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if current user is following this creator
    let isFollowing = false;
    if (session?.user?.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: profile.userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    // Increment view count
    await prisma.creatorProfile.update({
      where: { id: profile.id },
      data: { totalViews: { increment: 1 } },
    });

    return NextResponse.json({
      profile: {
        ...profile,
        isFollowing,
        isOwnProfile: session?.user?.id === profile.userId,
      },
    });
  } catch (error) {
    console.error('Creator fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch creator' }, { status: 500 });
  }
}
