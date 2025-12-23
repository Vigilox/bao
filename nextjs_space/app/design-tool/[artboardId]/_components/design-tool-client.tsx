'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Save,
  MousePointer,
  Type,
  Square,
  Circle,
  Loader2,
  Grid3X3,
  Magnet,
  Sparkles,
} from 'lucide-react'
import DesignCanvas from '@/components/design-tool/design-canvas'
import HistoryControls from '@/components/design-tool/history-controls'
import ZoomControls from '@/components/design-tool/zoom-controls'
import AlignmentControls from '@/components/design-tool/alignment-controls'
import GridOverlay from '@/components/design-tool/grid-overlay'
import SmartGuidesOverlay from '@/components/design-tool/smart-guides-overlay'
import GuideLines from '@/components/design-tool/guide-lines'
import Ruler from '@/components/design-tool/ruler'
import LayerPanel from '@/components/design-tool/layer-panel'
import ExportControls from '@/components/design-tool/export-controls'
import CollaboratorsPanel from '@/components/design-tool/collaborators-panel'
import CollaborationCursors from '@/components/design-tool/collaboration-cursors'
import AISuggestionsPanel from '@/components/design-tool/ai-suggestions-panel'
import { useToast } from '@/hooks/use-toast'
import { Canvas } from 'fabric'
import { useSession } from 'next-auth/react'

interface Artboard {
  id: string
  name: string
  description?: string
  widthPx: number
  heightPx: number
  data: any[]
  projectId: string
  projectName: string
}

interface DesignCanvasRef {
  getCanvas: () => Canvas | null
  addImage: (url: string) => Promise<void>
  deleteSelected: () => void
  setZoom: (zoom: number) => void
  getZoom: () => number
  zoomToFit: () => void
  pan: (dx: number, dy: number) => void
  resetView: () => void
  align: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  distribute: (mode: 'horizontal' | 'vertical') => void
  groupSelected: () => string | null
  ungroupSelected: () => boolean
}

interface CanvasObject {
  id: string
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'image'
  x: number
  y: number
  fill: string
  stroke: string
  strokeWidth: number
  selected: boolean
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  scaleX?: number
  scaleY?: number
  angle?: number
  opacity?: number
  imageUrl?: string
  src?: string
}

interface DesignToolClientProps {
  artboard: Artboard
}

export default function DesignToolClient({ artboard }: DesignToolClientProps) {
  const { data: session } = useSession() || {}
  const canvasRef = useRef<DesignCanvasRef>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [selectedTool, setSelectedTool] = useState('select')
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(null)
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>(artboard.data || [])
  const [saving, setSaving] = useState(false)
  const [layers, setLayers] = useState<any[]>([])
  const [zoom, setZoom] = useState(1)
  const [gridVisible, setGridVisible] = useState(true)
  const [snappingEnabled, setSnappingEnabled] = useState(true)
  const [smartGuides, setSmartGuides] = useState<{ x: number[], y: number[] }>({ x: [], y: [] })
  const [guides, setGuides] = useState<{ id: string, orientation: 'horizontal' | 'vertical', position: number }[]>([])
  const [historyStack, setHistoryStack] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const { toast } = useToast()
  const userId = session?.user?.email || undefined

  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
  ]

  // Auto-save
  useEffect(() => {
    if (canvasObjects.length === 0 && artboard.data.length === 0) return
    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/artboards/${artboard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: canvasObjects }),
        })
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setSaving(false)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [canvasObjects, artboard.id, artboard.data.length])

  const updateLayersFromCanvas = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const objects = canvas.getObjects()
    const layerData = objects.map((obj: any) => ({
      id: obj.id || crypto.randomUUID(),
      name: obj.name || obj.type || 'Object',
      type: obj.type,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      selected: obj === canvas.getActiveObject(),
    }))
    setLayers(layerData)
  }, [])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON())
    setHistoryStack(prev => {
      const newStack = prev.slice(0, historyIndex + 1)
      newStack.push(json)
      if (newStack.length > 50) newStack.shift()
      return newStack
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const prevState = historyStack[historyIndex - 1]
    canvas.loadFromJSON(JSON.parse(prevState), () => {
      canvas.renderAll()
      setHistoryIndex(prev => prev - 1)
      updateLayersFromCanvas()
    })
  }, [historyStack, historyIndex, updateLayersFromCanvas])

  const handleRedo = useCallback(() => {
    if (historyIndex >= historyStack.length - 1) return
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const nextState = historyStack[historyIndex + 1]
    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll()
      setHistoryIndex(prev => prev + 1)
      updateLayersFromCanvas()
    })
  }, [historyStack, historyIndex, updateLayersFromCanvas])

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const handleCanvasChange = () => {
      updateLayersFromCanvas()
      saveToHistory()
    }
    canvas.on('object:added', handleCanvasChange)
    canvas.on('object:removed', handleCanvasChange)
    canvas.on('object:modified', handleCanvasChange)
    canvas.on('selection:created', updateLayersFromCanvas)
    canvas.on('selection:updated', updateLayersFromCanvas)
    canvas.on('selection:cleared', updateLayersFromCanvas)
    return () => {
      canvas.off('object:added', handleCanvasChange)
      canvas.off('object:removed', handleCanvasChange)
      canvas.off('object:modified', handleCanvasChange)
      canvas.off('selection:created', updateLayersFromCanvas)
      canvas.off('selection:updated', updateLayersFromCanvas)
      canvas.off('selection:cleared', updateLayersFromCanvas)
    }
  }, [updateLayersFromCanvas, saveToHistory])

  const handleZoomIn = () => {
    const currentZoom = canvasRef.current?.getZoom() ?? 1
    const newZoom = Math.min(currentZoom * 1.2, 10)
    canvasRef.current?.setZoom(newZoom)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const currentZoom = canvasRef.current?.getZoom() ?? 1
    const newZoom = Math.max(currentZoom / 1.2, 0.1)
    canvasRef.current?.setZoom(newZoom)
    setZoom(newZoom)
  }

  const handleZoomToFit = () => {
    canvasRef.current?.zoomToFit()
    const newZoom = canvasRef.current?.getZoom() ?? 1
    setZoom(newZoom)
  }

  const handleResetView = () => {
    canvasRef.current?.resetView()
    setZoom(1)
  }

  const handleAlign = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    canvasRef.current?.align(mode)
  }

  const handleDistribute = (mode: 'horizontal' | 'vertical') => {
    canvasRef.current?.distribute(mode)
  }

  const handleCreateHorizontalGuide = (position: number) => {
    const newGuide = {
      id: `guide-${Date.now()}-${Math.random()}`,
      orientation: 'horizontal' as const,
      position,
    }
    setGuides(prev => [...prev, newGuide])
  }

  const handleCreateVerticalGuide = (position: number) => {
    const newGuide = {
      id: `guide-${Date.now()}-${Math.random()}`,
      orientation: 'vertical' as const,
      position,
    }
    setGuides(prev => [...prev, newGuide])
  }

  const handleRemoveGuide = (id: string) => {
    setGuides(prev => prev.filter(guide => guide.id !== id))
  }

  const selectedObjectCount = (() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return 0
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return 0
    if (activeObject.type === 'activeSelection') {
      return (activeObject as any).getObjects?.()?.length ?? 0
    }
    return 1
  })()

  // Track cursor position for collaboration
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const updateCursorPosition = async (e: MouseEvent) => {
      const rect = canvasContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      try {
        await fetch(`/api/artboards/${artboard.id}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cursorX, cursorY }),
        })
      } catch (error) {
        // Silently fail - collaboration is not critical
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e)
    }

    canvasContainerRef.current.addEventListener('mousemove', handleMouseMove)

    return () => {
      canvasContainerRef.current?.removeEventListener('mousemove', handleMouseMove)
    }
  }, [artboard.id])

  // Cleanup collaborator on unmount
  useEffect(() => {
    return () => {
      fetch(`/api/artboards/${artboard.id}/collaborators`, { method: 'DELETE' }).catch(() => {})
    }
  }, [artboard.id])

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Layers */}
      <div className="w-64 bg-white border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Layers</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <LayerPanel
            objects={layers}
            onLayerSelect={(layerId) => {
              const canvas = canvasRef.current?.getCanvas()
              if (!canvas) return
              const obj = canvas.getObjects().find((o: any) => o.id === layerId)
              if (obj) {
                canvas.setActiveObject(obj)
                canvas.renderAll()
              }
            }}
            onLayerVisibilityToggle={(layerId) => {
              const canvas = canvasRef.current?.getCanvas()
              if (!canvas) return
              const obj = canvas.getObjects().find((o: any) => o.id === layerId)
              if (obj) {
                obj.set('visible', !obj.visible)
                canvas.renderAll()
                updateLayersFromCanvas()
              }
            }}
            onLayerLockToggle={(layerId) => {
              const canvas = canvasRef.current?.getCanvas()
              if (!canvas) return
              const obj = canvas.getObjects().find((o: any) => o.id === layerId)
              if (obj) {
                obj.set('selectable', !obj.selectable)
                canvas.renderAll()
                updateLayersFromCanvas()
              }
            }}
            onLayerDelete={(layerId) => {
              const canvas = canvasRef.current?.getCanvas()
              if (!canvas) return
              const obj = canvas.getObjects().find((o: any) => o.id === layerId)
              if (obj) {
                canvas.remove(obj)
                canvas.renderAll()
                updateLayersFromCanvas()
              }
            }}
            onLayerDuplicate={async (layerId) => {
              const canvas = canvasRef.current?.getCanvas()
              if (!canvas) return
              const obj = canvas.getObjects().find((o: any) => o.id === layerId)
              if (obj) {
                const cloned = await obj.clone()
                cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
                canvas.add(cloned)
                canvas.renderAll()
                updateLayersFromCanvas()
              }
            }}
            onLayerReorder={() => {}}
            onLayerRename={() => {}}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/project/${artboard.projectId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <Image src="/logo.png" alt="BAO Logo" fill className="object-contain" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{artboard.name}</div>
                  <div className="text-xs text-muted-foreground">{artboard.projectName}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CollaboratorsPanel artboardId={artboard.id} currentUserId={userId} />
              <ExportControls canvas={canvasRef.current?.getCanvas()} artboardName={artboard.name} />
              <Button
                variant={showAIPanel ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </Button>
              <div className="text-xs text-muted-foreground">
                {saving ? 'Saving...' : 'Saved'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <HistoryControls
                canUndo={historyIndex > 0}
                canRedo={historyIndex < historyStack.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                undoCount={historyIndex}
                redoCount={historyStack.length - historyIndex - 1}
              />

              <Separator orientation="vertical" className="h-6" />

              <ZoomControls
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomToFit={handleZoomToFit}
                onResetView={handleResetView}
              />

              <Separator orientation="vertical" className="h-6" />

              <AlignmentControls
                selectedCount={selectedObjectCount}
                onAlign={handleAlign}
                onDistribute={handleDistribute}
                compact={true}
              />

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                <Button
                  variant={gridVisible ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridVisible(!gridVisible)}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={snappingEnabled ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSnappingEnabled(!snappingEnabled)}
                  className="h-8 w-8 p-0"
                >
                  <Magnet className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTool(tool.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center p-8 bg-background overflow-auto"
        >
          <div className="relative flex">
            <Ruler
              orientation="vertical"
              length={artboard.heightPx}
              zoom={zoom}
              onCreateGuide={handleCreateHorizontalGuide}
            />
            <div className="flex flex-col">
              <Ruler
                orientation="horizontal"
                length={artboard.widthPx}
                zoom={zoom}
                onCreateGuide={handleCreateVerticalGuide}
              />
              <div className="relative">
                <DesignCanvas
                  ref={canvasRef}
                  selectedTool={selectedTool}
                  onObjectSelect={setSelectedObject}
                  selectedObject={selectedObject}
                  onCanvasChange={setCanvasObjects}
                  widthPx={artboard.widthPx}
                  heightPx={artboard.heightPx}
                  snappingEnabled={snappingEnabled}
                  gridSize={20}
                  snapThreshold={5}
                  onSmartGuidesChange={setSmartGuides}
                  templateObjects={artboard.data}
                />
                <GridOverlay
                  width={artboard.widthPx}
                  height={artboard.heightPx}
                  gridSize={20}
                  zoom={zoom}
                  visible={gridVisible}
                />
                <GuideLines
                  width={artboard.widthPx}
                  height={artboard.heightPx}
                  guides={guides}
                  onRemoveGuide={handleRemoveGuide}
                />
                <SmartGuidesOverlay
                  width={artboard.widthPx}
                  height={artboard.heightPx}
                  guides={smartGuides}
                  zoom={zoom}
                />
              </div>
            </div>
            
            {/* Collaboration Cursors Overlay */}
            <CollaborationCursors
              artboardId={artboard.id}
              currentUserId={userId}
              canvasRef={canvasContainerRef}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Suggestions (conditionally rendered) */}
      {showAIPanel && (
        <AISuggestionsPanel
          onApplyColor={(color) => {
            const canvas = canvasRef.current?.getCanvas()
            if (!canvas) return
            const activeObject = canvas.getActiveObject()
            if (activeObject) {
              activeObject.set('fill', color)
              canvas.renderAll()
            }
          }}
        />
      )}
    </div>
  )
}
