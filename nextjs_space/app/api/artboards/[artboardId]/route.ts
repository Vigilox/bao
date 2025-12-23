import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ artboardId: string }>
}

// GET /api/artboards/[artboardId] - Get artboard by ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { artboardId } = params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const artboard = await prisma.artboard.findFirst({
      where: {
        id: artboardId,
        project: {
          userId: user.id,
        },
      },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!artboard) {
      return NextResponse.json({ error: 'Artboard not found' }, { status: 404 })
    }

    return NextResponse.json({ artboard })
  } catch (error) {
    console.error('Error fetching artboard:', error)
    return NextResponse.json({ error: 'Failed to fetch artboard' }, { status: 500 })
  }
}

// PATCH /api/artboards/[artboardId] - Update artboard
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { artboardId } = params
    const body = await req.json()
    const { name, description, data } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

    const updated = await prisma.artboard.update({
      where: { id: artboardId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(data && { data }),
      },
    })

    return NextResponse.json({ artboard: updated })
  } catch (error) {
    console.error('Error updating artboard:', error)
    return NextResponse.json({ error: 'Failed to update artboard' }, { status: 500 })
  }
}

// DELETE /api/artboards/[artboardId] - Delete artboard
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { artboardId } = params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

    await prisma.artboard.delete({
      where: { id: artboardId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting artboard:', error)
    return NextResponse.json({ error: 'Failed to delete artboard' }, { status: 500 })
  }
}
