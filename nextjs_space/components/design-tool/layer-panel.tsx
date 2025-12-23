'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react'
import { useState } from 'react'

interface LayerObject {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  selected: boolean
  opacity?: number
}

interface LayerPanelProps {
  objects: LayerObject[]
  onLayerSelect: (layerId: string) => void
  onLayerVisibilityToggle: (layerId: string) => void
  onLayerLockToggle: (layerId: string) => void
  onLayerDelete: (layerId: string) => void
  onLayerDuplicate: (layerId: string) => void
  onLayerReorder: (fromIndex: number, toIndex: number) => void
  onLayerRename: (layerId: string, newName: string) => void
  onGroupSelected?: () => void
  onUngroupSelected?: () => void
  onOpacityChange?: (layerId: string, opacity: number) => void
  onBlendModeChange?: (layerId: string, blendMode: string) => void
  onShadowChange?: (layerId: string, shadow: any) => void
  onStrokeChange?: (layerId: string, stroke: any) => void
  onFillChange?: (layerId: string, fill: string) => void
}

export default function LayerPanel({
  objects,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerDuplicate,
}: LayerPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {objects.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No layers yet
          </div>
        ) : (
          objects.map((layer) => (
            <div
              key={layer.id}
              className={`p-2 rounded border hover:bg-secondary/50 transition-colors cursor-pointer ${
                layer.selected ? 'bg-secondary border-primary' : 'bg-white border-border'
              }`}
              onClick={() => onLayerSelect(layer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium truncate">{layer.name}</span>
                  <span className="text-xs text-muted-foreground">({layer.type})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerVisibilityToggle(layer.id)
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerLockToggle(layer.id)
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerDuplicate(layer.id)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerDelete(layer.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
