'use client'

interface GridOverlayProps {
  width: number
  height: number
  gridSize: number
  zoom: number
  visible: boolean
}

export default function GridOverlay({
  width,
  height,
  gridSize,
  zoom,
  visible,
}: GridOverlayProps) {
  if (!visible) return null

  const scaledGridSize = gridSize * zoom

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      <defs>
        <pattern
          id="grid"
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
            fill="none"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}
