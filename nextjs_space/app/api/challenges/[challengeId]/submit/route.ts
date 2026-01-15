import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Verify challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

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

    // Check if already submitted
    const existingSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId,
        userId: session.user.id as string,
        postId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'Already submitted this post' }, { status: 400 });
    }

    // Check max submissions limit
    if (challenge.maxSubmissions) {
      const userSubmissions = await prisma.challengeSubmission.count({
        where: {
          challengeId,
          userId: session.user.id as string,
        },
      });

      if (userSubmissions >= challenge.maxSubmissions) {
        return NextResponse.json(
          { error: `Maximum ${challenge.maxSubmissions} submissions allowed` },
          { status: 400 }
        );
      }
    }

    // Create submission
    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId,
        userId: session.user.id as string,
        postId,
      },
    });

    // Update challenge stats
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        totalSubmissions: { increment: 1 },
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('[CHALLENGE_SUBMIT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}