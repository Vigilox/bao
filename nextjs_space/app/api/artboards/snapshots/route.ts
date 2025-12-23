import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/artboards/snapshots - List snapshots for an artboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const artboardId = searchParams.get('artboardId')

    if (!artboardId) {
      return NextResponse.json({ error: 'Artboard ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify artboard ownership
    const artboard = await prisma.artboard.findFirst({
      where: {
        id: artboardId,
        project: {
          userId: user.id,
        },
      },
    })

    if (!artboard) {
      return NextResponse.json({ error: 'Artboard not found' }, { status: 404 })
    }

    const snapshots = await prisma.artboardSnapshot.findMany({
      where: { artboardId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}

// POST /api/artboards/snapshots - Create new snapshot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { artboardId, projectId, name, data } = body

    if (!artboardId || !projectId || !name || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify artboard ownership
    const artboard = await prisma.artboard.findFirst({
      where: {
        id: artboardId,
        project: {
          userId: user.id,
        },
      },
    })

    if (!artboard) {
      return NextResponse.json({ error: 'Artboard not found' }, { status: 404 })
    }

    const snapshot = await prisma.artboardSnapshot.create({
      data: {
        artboardId,
        projectId,
        name,
        data,
      },
    })

    return NextResponse.json({ snapshot }, { status: 201 })
  } catch (error) {
    console.error('Error creating snapshot:', error)
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
  }
}
