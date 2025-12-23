'use client'

import { useState } from 'react'

interface RulerProps {
  orientation: 'horizontal' | 'vertical'
  length: number
  zoom: number
  onCreateGuide: (position: number) => void
}

export default function Ruler({
  orientation,
  length,
  zoom,
  onCreateGuide,
}: RulerProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const position = orientation === 'horizontal'
      ? e.clientX - rect.left
      : e.clientY - rect.top
    onCreateGuide(position / zoom)
    setIsDragging(false)
  }

  const tickInterval = 50 * zoom
  const numTicks = Math.ceil(length / tickInterval)

  return (
    <div
      className="bg-gray-200 relative cursor-crosshair"
      style={{
        [orientation === 'horizontal' ? 'width' : 'height']: `${length}px`,
        [orientation === 'horizontal' ? 'height' : 'width']: '20px',
      }}
      onMouseDown={handleMouseDown}
    >
      <svg
        className="absolute inset-0"
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: `${length}px`,
          [orientation === 'horizontal' ? 'height' : 'width']: '20px',
        }}
      >
        {Array.from({ length: numTicks }).map((_, i) => {
          const pos = i * tickInterval
          const isLarge = i % 5 === 0
          return (
            <g key={i}>
              <line
                x1={orientation === 'horizontal' ? pos : 0}
                y1={orientation === 'horizontal' ? 0 : pos}
                x2={orientation === 'horizontal' ? pos : (isLarge ? 20 : 15)}
                y2={orientation === 'horizontal' ? (isLarge ? 20 : 15) : pos}
                stroke="#666"
                strokeWidth="1"
              />
              {isLarge && (
                <text
                  x={orientation === 'horizontal' ? pos + 2 : 2}
                  y={orientation === 'horizontal' ? 12 : pos + 12}
                  fontSize="9"
                  fill="#666"
                >
                  {Math.round(pos / zoom)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
