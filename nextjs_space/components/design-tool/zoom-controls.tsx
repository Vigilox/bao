'use client'

import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize, Minimize2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomToFit: () => void
  onResetView: () => void
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onResetView,
}: ZoomControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Zoom Out
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl+-</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Zoom In
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl++</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomToFit}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Zoom to Fit
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl+0</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetView}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Reset View
              <div className="font-mono mt-1 bg-muted px-1.5 py-0.5 rounded">Ctrl+1</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
