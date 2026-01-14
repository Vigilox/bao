/**
 * Profile API - Get/Update current user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, displayName, bio, avatarUrl, bannerUrl, website, location, socialLinks } = body;

    // Check if username is taken by someone else
    if (username) {
      const existing = await prisma.creatorProfile.findUnique({
        where: { username },
      });
      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const profile = await prisma.creatorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        username: username || undefined,
        displayName,
        bio,
        avatarUrl,
        bannerUrl,
        website,
        location,
        socialLinks,
      },
      create: {
        userId: session.user.id,
        username: username || `user_${session.user.id.slice(0, 8)}`,
        displayName: displayName || session.user.name,
        bio,
        avatarUrl,
        bannerUrl,
        website,
        location,
        socialLinks,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
