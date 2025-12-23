'use client'

import { Button } from '@/components/ui/button'
import { Undo, Redo } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HistoryControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  undoCount?: number
  redoCount?: number
}

export default function HistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoCount = 0,
  redoCount = 0,
}: HistoryControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Undo {undoCount > 0 && `(${undoCount})`}
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl+Z</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Redo {redoCount > 0 && `(${redoCount})`}
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl+Shift+Z</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
