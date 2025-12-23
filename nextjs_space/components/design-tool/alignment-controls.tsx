'use client'

import { Button } from '@/components/ui/button'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AlignmentControlsProps {
  selectedCount: number
  onAlign: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (mode: 'horizontal' | 'vertical') => void
  compact?: boolean
}

export default function AlignmentControls({
  selectedCount,
  onAlign,
  onDistribute,
  compact = false,
}: AlignmentControlsProps) {
  const disabled = selectedCount < 2

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('left')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Align Left</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('center')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Align Center</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('right')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Align Right</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">Horizontal</div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('left')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('center')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('right')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">Vertical</div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('top')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignVerticalJustifyStart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('middle')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAlign('bottom')}
            disabled={disabled}
            className="flex-1"
          >
            <AlignVerticalJustifyEnd className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">Distribute</div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDistribute('horizontal')}
            disabled={selectedCount < 3}
            className="flex-1"
          >
            <AlignHorizontalJustifyCenter className="h-4 w-4 mr-1" />
            Horizontal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDistribute('vertical')}
            disabled={selectedCount < 3}
            className="flex-1"
          >
            <AlignVerticalJustifyCenter className="h-4 w-4 mr-1" />
            Vertical
          </Button>
        </div>
      </div>
    </div>
  )
}
