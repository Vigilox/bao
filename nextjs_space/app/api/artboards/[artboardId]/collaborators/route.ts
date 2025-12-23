import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/artboards/[artboardId]/collaborators - Get active collaborators
export async function GET(
  req: NextRequest,
  { params }: { params: { artboardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get collaborators updated in the last 30 seconds (considered active)
    const thirtySecondsAgo = new Date(Date.now() - 30000);

    const collaborators = await prisma.artboardCollaborator.findMany({
      where: {
        artboardId: params.artboardId,
        lastActive: {
          gte: thirtySecondsAgo,
        },
      },
      orderBy: { lastActive: 'desc' },
    });

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/artboards/[artboardId]/collaborators - Update collaborator presence
export async function POST(
  req: NextRequest,
  { params }: { params: { artboardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { cursorX, cursorY } = body;

    // Generate a consistent color for the user
    const colors = ['#2B5FD9', '#E63946', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const colorIndex = user.id.charCodeAt(0) % colors.length;
    const userColor = colors[colorIndex];

    // Upsert collaborator
    const collaborator = await prisma.artboardCollaborator.upsert({
      where: {
        artboardId_userId: {
          artboardId: params.artboardId,
          userId: user.id,
        },
      },
      update: {
        cursorX,
        cursorY,
        lastActive: new Date(),
      },
      create: {
        artboardId: params.artboardId,
        userId: user.id,
        userName: user.name || 'Anonymous',
        userEmail: user.email,
        color: userColor,
        cursorX,
        cursorY,
      },
    });

    return NextResponse.json({ collaborator });
  } catch (error: any) {
    console.error('Error updating collaborator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/artboards/[artboardId]/collaborators - Remove collaborator (on disconnect)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { artboardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.artboardCollaborator.deleteMany({
      where: {
        artboardId: params.artboardId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
