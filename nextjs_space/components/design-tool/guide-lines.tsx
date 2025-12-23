'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Guide {
  id: string
  orientation: 'horizontal' | 'vertical'
  position: number
}

interface GuideLinesProps {
  width: number
  height: number
  guides: Guide[]
  onRemoveGuide: (id: string) => void
}

export default function GuideLines({
  width,
  height,
  guides,
  onRemoveGuide,
}: GuideLinesProps) {
  if (!guides.length) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {guides.map((guide) => (
        <div
          key={guide.id}
          className="absolute pointer-events-auto group"
          style={{
            [guide.orientation === 'horizontal' ? 'top' : 'left']: `${guide.position}px`,
            [guide.orientation === 'horizontal' ? 'left' : 'top']: 0,
            [guide.orientation === 'horizontal' ? 'right' : 'bottom']: 0,
            [guide.orientation === 'horizontal' ? 'height' : 'width']: '1px',
            backgroundColor: '#16a34a',
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 bg-white border border-border"
            style={{
              [guide.orientation === 'horizontal' ? 'left' : 'top']: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => onRemoveGuide(guide.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
