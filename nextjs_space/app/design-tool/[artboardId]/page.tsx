import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import DesignToolClient from './_components/design-tool-client'

interface PageProps {
  params: Promise<{ artboardId: string }>
}

export default async function DesignToolPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const { artboardId } = await params

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  const artboard = await prisma.artboard.findFirst({
    where: {
      id: artboardId,
      project: {
        userId: user.id,
      },
    },
    include: {
      project: true,
    },
  })

  if (!artboard) {
    redirect('/dashboard')
  }

  return (
    <DesignToolClient
      artboard={{
        id: artboard.id,
        name: artboard.name,
        description: artboard.description || undefined,
        widthPx: artboard.widthPx,
        heightPx: artboard.heightPx,
        data: artboard.data as any[],
        projectId: artboard.projectId,
        projectName: artboard.project.name,
      }}
    />
  )
}
