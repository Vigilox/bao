import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/artboards - List artboards for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const artboards = await prisma.artboard.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { snapshots: true },
        },
      },
    })

    return NextResponse.json({ artboards })
  } catch (error) {
    console.error('Error fetching artboards:', error)
    return NextResponse.json({ error: 'Failed to fetch artboards' }, { status: 500 })
  }
}

// POST /api/artboards - Create new artboard
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, name, description, widthPx = 800, heightPx = 600, data = [] } = body

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and name required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const artboard = await prisma.artboard.create({
      data: {
        projectId,
        name,
        description,
        widthPx,
        heightPx,
        data,
      },
    })

    return NextResponse.json({ artboard }, { status: 201 })
  } catch (error) {
    console.error('Error creating artboard:', error)
    return NextResponse.json({ error: 'Failed to create artboard' }, { status: 500 })
  }
}
