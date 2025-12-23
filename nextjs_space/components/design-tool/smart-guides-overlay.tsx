'use client'

interface SmartGuidesOverlayProps {
  width: number
  height: number
  guides: { x: number[], y: number[] }
  zoom: number
}

export default function SmartGuidesOverlay({
  width,
  height,
  guides,
  zoom,
}: SmartGuidesOverlayProps) {
  if (!guides.x.length && !guides.y.length) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {guides.x.map((x, i) => (
        <line
          key={`x-${i}`}
          x1={x * zoom}
          y1={0}
          x2={x * zoom}
          y2={height}
          stroke="#2563eb"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
      {guides.y.map((y, i) => (
        <line
          key={`y-${i}`}
          x1={0}
          y1={y * zoom}
          x2={width}
          y2={y * zoom}
          stroke="#2563eb"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
    </svg>
  )
}
