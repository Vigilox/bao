import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify thread exists and is not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 400 });
    }

    // Create reply
    const reply = await prisma.forumReply.create({
      data: {
        threadId,
        authorId: session.user.id as string,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Update thread stats
    await prisma.forumThread.update({
      where: { id: threadId },
      data: {
        totalReplies: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[FORUM_REPLY_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}