'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Loader2, Palette, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Artboard {
  id: string
  name: string
  description?: string
  widthPx: number
  heightPx: number
  updatedAt: string
  _count: {
    snapshots: number
  }
}

interface ArtboardsListProps {
  projectId: string
}

export function ArtboardsList({ projectId }: ArtboardsListProps) {
  const router = useRouter()
  const [artboards, setArtboards] = useState<Artboard[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchArtboards()
  }, [projectId])

  const fetchArtboards = async () => {
    try {
      const res = await fetch(`/api/artboards?projectId=${projectId}`)
      if (res?.ok) {
        const data = await res.json()
        setArtboards(data?.artboards || [])
      }
    } catch (error) {
      console.error('Error fetching artboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const createArtboard = async () => {
    const name = prompt('Enter artboard name:')
    if (!name) return

    setCreating(true)
    try {
      const res = await fetch('/api/artboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name }),
      })

      if (res?.ok) {
        const data = await res.json()
        router.push(`/design-tool/${data?.artboard?.id}`)
      }
    } catch (error) {
      console.error('Error creating artboard:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteArtboard = async (artboardId: string) => {
    if (!confirm('Are you sure you want to delete this artboard?')) return

    try {
      const res = await fetch(`/api/artboards/${artboardId}`, {
        method: 'DELETE',
      })

      if (res?.ok) {
        setArtboards(prev => prev.filter(a => a.id !== artboardId))
      }
    } catch (error) {
      console.error('Error deleting artboard:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Artboards</h3>
          <p className="text-sm text-muted-foreground">Design canvases for your project</p>
        </div>
        <Button
          onClick={createArtboard}
          disabled={creating}
          className="flex items-center gap-2"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Artboard
        </Button>
      </div>

      {artboards.length === 0 ? (
        <Card className="p-12 text-center">
          <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No artboards yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first design canvas to get started
          </p>
          <Button onClick={createArtboard} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />
            Create Artboard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artboards.map((artboard, index) => (
            <motion.div
              key={artboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className="group cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all border-border hover:border-primary/50"
                onClick={() => router.push(`/design-tool/${artboard.id}`)}
              >
                <div className="aspect-[4/3] bg-secondary/50 rounded-t-xl flex items-center justify-center">
                  <Palette className="h-12 w-12 text-primary" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition">
                      {artboard.name}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteArtboard(artboard.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {artboard.widthPx} × {artboard.heightPx}px
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{artboard._count.snapshots} snapshots</span>
                    <span>{new Date(artboard.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
