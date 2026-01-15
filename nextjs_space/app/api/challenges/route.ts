import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'ARCHIVED' | null;

    const where = status ? { status } : {};

    const challenges = await prisma.challenge.findMany({
      where,
      orderBy: { startDate: 'desc' },
      take: 50,
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('[CHALLENGES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a challenge (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      title,
      description,
      coverImageUrl,
      rules,
      prize,
      startDate,
      endDate,
      maxSubmissions,
      tags,
    } = await request.json();

    if (!title || !description || !rules || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
    if (now < start) {
      status = 'UPCOMING';
    } else if (now >= start && now <= end) {
      status = 'ACTIVE';
    } else {
      status = 'ENDED';
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        coverImageUrl,
        rules,
        prize,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        maxSubmissions,
        tags: tags || [],
        createdBy: session.user.id as string,
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('[CHALLENGES_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}