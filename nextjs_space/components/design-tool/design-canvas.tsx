'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Canvas, Textbox, Rect, Circle, Line, FabricImage, Point, ActiveSelection, Group } from 'fabric'

// @ts-ignore
type FabricObject = any

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface CanvasObject {
  id: string
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fill: string
  stroke: string
  strokeWidth: number
  selected: boolean
  scaleX?: number
  scaleY?: number
  angle?: number
  opacity?: number
  imageUrl?: string  // NEW: for image type
  src?: string       // NEW: alternative property name
}

interface DesignCanvasProps {
  selectedTool: string
  onObjectSelect?: (object: CanvasObject | null) => void
  selectedObject?: CanvasObject | null
  objectProperties?: Partial<CanvasObject>
  templateObjects?: CanvasObject[]
  onCanvasChange?: (objects: CanvasObject[]) => void
  snappingEnabled?: boolean
  gridSize?: number
  snapThreshold?: number
  onSmartGuidesChange?: (guides: { x: number[], y: number[] }) => void
}

interface DesignCanvasSizeProps {
  widthPx?: number
  heightPx?: number
  clipContent?: boolean
}

const DesignCanvas = forwardRef<any, DesignCanvasProps & DesignCanvasSizeProps>(function DesignCanvas({
  selectedTool,
  onObjectSelect,
  selectedObject,
  objectProperties,
  templateObjects = [],
  onCanvasChange,
  widthPx = 800,
  heightPx = 600,
  clipContent = true,
  snappingEnabled = true,
  gridSize = 20,
  snapThreshold = 5,
  onSmartGuidesChange,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      width: widthPx,
      height: heightPx,
      backgroundColor: '#ffffff',
    })

    fabricCanvasRef.current = canvas

    // Handle object selection
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0]
      if (activeObject && onObjectSelect) {
        const obj = convertFabricToCanvasObject(activeObject)
        onObjectSelect(obj)
      }
    })

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0]
      if (activeObject && onObjectSelect) {
        const obj = convertFabricToCanvasObject(activeObject)
        onObjectSelect(obj)
      }
    })

    canvas.on('selection:cleared', () => {
      if (onObjectSelect) {
        onObjectSelect(null)
      }
    })

    // Handle canvas changes
    const emitChange = () => {
      if (onCanvasChange) {
        const objects = canvas.getObjects().map(convertFabricToCanvasObject)
        onCanvasChange(objects)
      }
    }
    canvas.on('object:modified', (e) => {
      emitChange()
      // Clear smart guides when movement ends
      if (onSmartGuidesChange) {
        onSmartGuidesChange({ x: [], y: [] })
      }
    })
    canvas.on('object:added', emitChange)
    canvas.on('object:removed', emitChange)

    // Snapping logic
    canvas.on('object:moving', (e) => {
      if (!snappingEnabled) return

      const obj = e.target
      if (!obj) return

      const objBounds = obj.getBoundingRect()
      const objLeft = objBounds.left
      const objTop = objBounds.top
      const objWidth = objBounds.width
      const objHeight = objBounds.height
      const objCenterX = objLeft + objWidth / 2
      const objCenterY = objTop + objHeight / 2
      const objRight = objLeft + objWidth
      const objBottom = objTop + objHeight

      // Track smart guide positions
      const smartGuideX: number[] = []
      const smartGuideY: number[] = []

      // Grid snapping
      if (gridSize > 0) {
        const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize

        // Snap left edge to grid
        if (Math.abs(objLeft - snapToGrid(objLeft)) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (snapToGrid(objLeft) - objLeft) })
        }
        // Snap top edge to grid
        if (Math.abs(objTop - snapToGrid(objTop)) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (snapToGrid(objTop) - objTop) })
        }
        // Snap center to grid
        if (Math.abs(objCenterX - snapToGrid(objCenterX)) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (snapToGrid(objCenterX) - objCenterX) })
        }
        if (Math.abs(objCenterY - snapToGrid(objCenterY)) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (snapToGrid(objCenterY) - objCenterY) })
        }
      }

      // Edge and center snapping to other objects
      const canvasObjects = canvas.getObjects().filter(o => o !== obj)

      for (const other of canvasObjects) {
        const otherBounds = other.getBoundingRect()
        const otherLeft = otherBounds.left
        const otherTop = otherBounds.top
        const otherRight = otherLeft + otherBounds.width
        const otherBottom = otherTop + otherBounds.height
        const otherCenterX = otherLeft + otherBounds.width / 2
        const otherCenterY = otherTop + otherBounds.height / 2

        // Horizontal snapping
        // Left to left
        if (Math.abs(objLeft - otherLeft) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (otherLeft - objLeft) })
          smartGuideX.push(otherLeft)
        }
        // Right to right
        if (Math.abs(objRight - otherRight) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (otherRight - objRight) })
          smartGuideX.push(otherRight)
        }
        // Center to center (horizontal)
        if (Math.abs(objCenterX - otherCenterX) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (otherCenterX - objCenterX) })
          smartGuideX.push(otherCenterX)
        }
        // Left to right
        if (Math.abs(objLeft - otherRight) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (otherRight - objLeft) })
          smartGuideX.push(otherRight)
        }
        // Right to left
        if (Math.abs(objRight - otherLeft) < snapThreshold) {
          obj.set({ left: (obj.left || 0) + (otherLeft - objRight) })
          smartGuideX.push(otherLeft)
        }

        // Vertical snapping
        // Top to top
        if (Math.abs(objTop - otherTop) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (otherTop - objTop) })
          smartGuideY.push(otherTop)
        }
        // Bottom to bottom
        if (Math.abs(objBottom - otherBottom) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (otherBottom - objBottom) })
          smartGuideY.push(otherBottom)
        }
        // Center to center (vertical)
        if (Math.abs(objCenterY - otherCenterY) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (otherCenterY - objCenterY) })
          smartGuideY.push(otherCenterY)
        }
        // Top to bottom
        if (Math.abs(objTop - otherBottom) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (otherBottom - objTop) })
          smartGuideY.push(otherBottom)
        }
        // Bottom to top
        if (Math.abs(objBottom - otherTop) < snapThreshold) {
          obj.set({ top: (obj.top || 0) + (otherTop - objBottom) })
          smartGuideY.push(otherTop)
        }
      }

      obj.setCoords()

      // Emit smart guide positions
      if (onSmartGuidesChange) {
        onSmartGuidesChange({ x: smartGuideX, y: smartGuideY })
      }
    })

    // Mouse wheel zoom (zoom to pointer)
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** delta

      // Clamp zoom between 0.1 and 10
      if (zoom > 10) zoom = 10
      if (zoom < 0.1) zoom = 0.1

      // Zoom to pointer position
      const point = new Point(e.offsetX, e.offsetY)
      canvas.zoomToPoint(point, zoom)
    })

    // Pan with mouse:down (middle-mouse or space+left-mouse)
    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent

      // Middle mouse button (button === 1) or space + left mouse
      if (e.button === 1 || (isSpacePressed && e.button === 0)) {
        setIsPanning(true)
        panStartRef.current = { x: e.clientX, y: e.clientY }
        canvas.selection = false // Disable selection while panning
      }
    })

    canvas.on('mouse:move', (opt) => {
      if (isPanning && panStartRef.current) {
        const e = opt.e as MouseEvent
        const vpt = canvas.viewportTransform
        if (vpt) {
          vpt[4] += e.clientX - panStartRef.current.x
          vpt[5] += e.clientY - panStartRef.current.y
          canvas.requestRenderAll()
          panStartRef.current = { x: e.clientX, y: e.clientY }
        }
      }
    })

    canvas.on('mouse:up', () => {
      if (isPanning) {
        setIsPanning(false)
        panStartRef.current = null
        canvas.selection = true // Re-enable selection
      }
    })

    // Cleanup
    return () => {
      canvas.dispose()
    }
  }, [onObjectSelect, onCanvasChange, widthPx, heightPx, isPanning, isSpacePressed])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricCanvasRef.current,
    addImage: async (imageUrl: string, options?: {
      left?: number
      top?: number
      scaleX?: number
      scaleY?: number
      maxRetries?: number
    }) => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const maxRetries = options?.maxRetries ?? 3
      let lastError: Error | null = null

      // Retry logic for image loading
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Load image from URL
          const img = await FabricImage.fromURL(imageUrl, {
            crossOrigin: 'anonymous',
          })

          // Auto-scale if image is larger than canvas
          const maxWidth = canvas.width! * 0.8
          const maxHeight = canvas.height! * 0.8

          if (img.width! > maxWidth || img.height! > maxHeight) {
            const scaleX = maxWidth / img.width!
            const scaleY = maxHeight / img.height!
            const scale = Math.min(scaleX, scaleY)
            img.scale(scale)
          }

          // Center by default
          img.set({
            left: options?.left ?? (canvas.width! - img.getScaledWidth()) / 2,
            top: options?.top ?? (canvas.height! - img.getScaledHeight()) / 2,
            scaleX: options?.scaleX,
            scaleY: options?.scaleY,
          })

          // Add UUID and name
          const imgObj = img as any
          imgObj.id = generateUUID()
          imgObj.name = 'Image'

          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()

          // Trigger change event for auto-save
          canvas.fire('object:added', { target: img })

          // Success - exit retry loop
          return
        } catch (error: any) {
          lastError = error
          console.error(`Image load attempt ${attempt + 1}/${maxRetries} failed:`, error)

          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          }
        }
      }

      // All retries failed
      console.error('Failed to load image after retries:', lastError)

      // Provide specific error messages based on the error type
      if (lastError?.message?.includes('CORS') || lastError?.message?.includes('cross-origin')) {
        throw new Error('Image could not be loaded due to cross-origin restrictions.')
      } else if (lastError?.message?.includes('404') || lastError?.message?.includes('Not Found')) {
        throw new Error('Image not found. The URL may be invalid or expired.')
      } else if (lastError?.message?.includes('network') || lastError?.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.')
      } else {
        throw new Error('Failed to load image. Please try again or use a different image.')
      }
    },
    deleteSelected: () => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return
      const activeObject = canvas.getActiveObject()
      if (activeObject) {
        canvas.remove(activeObject)
        canvas.renderAll()
      }
    },
    // Zoom methods
    setZoom: (zoomLevel: number) => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return
      const clamped = Math.min(Math.max(zoomLevel, 0.1), 10)
      canvas.setZoom(clamped)
      canvas.renderAll()
    },
    getZoom: () => {
      return fabricCanvasRef.current?.getZoom() ?? 1
    },
    zoomToFit: () => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const objects = canvas.getObjects()
      if (objects.length === 0) {
        canvas.setZoom(1)
        canvas.absolutePan(new Point(0, 0))
        canvas.renderAll()
        return
      }

      // Calculate bounding box of all objects
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      objects.forEach((obj) => {
        const bound = obj.getBoundingRect()
        minX = Math.min(minX, bound.left)
        minY = Math.min(minY, bound.top)
        maxX = Math.max(maxX, bound.left + bound.width)
        maxY = Math.max(maxY, bound.top + bound.height)
      })

      const contentWidth = maxX - minX
      const contentHeight = maxY - minY
      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()

      // Calculate zoom to fit with 10% padding
      const zoomX = (canvasWidth * 0.9) / contentWidth
      const zoomY = (canvasHeight * 0.9) / contentHeight
      const zoom = Math.min(zoomX, zoomY, 10) // Clamp max to 10x

      canvas.setZoom(zoom)

      // Center the content
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const viewportCenterX = canvasWidth / (2 * zoom)
      const viewportCenterY = canvasHeight / (2 * zoom)

      canvas.absolutePan(new Point(centerX - viewportCenterX, centerY - viewportCenterY))
      canvas.renderAll()
    },
    pan: (dx: number, dy: number) => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return
      canvas.relativePan(new Point(dx, dy))
      canvas.renderAll()
    },
    resetView: () => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return
      canvas.setZoom(1)
      canvas.absolutePan(new Point(0, 0))
      canvas.renderAll()
    },
    // Alignment methods
    align: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      // Get all selected objects
      const objects = activeObject.type === 'activeSelection'
        ? (activeObject as ActiveSelection).getObjects()
        : [activeObject]

      if (objects.length < 2) return

      // Calculate bounding box of all selected objects
      const selection = new ActiveSelection(objects, { canvas })
      const bounds = selection.getBoundingRect()

      // Align each object
      objects.forEach(obj => {
        const objBounds = obj.getBoundingRect()

        switch (mode) {
          case 'left':
            obj.set({ left: (obj.left || 0) + (bounds.left - objBounds.left) })
            break
          case 'center':
            obj.set({
              left: (obj.left || 0) + (bounds.left + bounds.width / 2 - (objBounds.left + objBounds.width / 2))
            })
            break
          case 'right':
            obj.set({
              left: (obj.left || 0) + (bounds.left + bounds.width - (objBounds.left + objBounds.width))
            })
            break
          case 'top':
            obj.set({ top: (obj.top || 0) + (bounds.top - objBounds.top) })
            break
          case 'middle':
            obj.set({
              top: (obj.top || 0) + (bounds.top + bounds.height / 2 - (objBounds.top + objBounds.height / 2))
            })
            break
          case 'bottom':
            obj.set({
              top: (obj.top || 0) + (bounds.top + bounds.height - (objBounds.top + objBounds.height))
            })
            break
        }

        obj.setCoords()
      })

      canvas.renderAll()
      canvas.fire('object:modified', { target: activeObject })
    },
    distribute: (mode: 'horizontal' | 'vertical') => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      // Get all selected objects
      const objects = activeObject.type === 'activeSelection'
        ? (activeObject as ActiveSelection).getObjects()
        : [activeObject]

      if (objects.length < 3) return

      // Get bounding boxes
      const bounds = objects.map(obj => ({
        obj,
        bounds: obj.getBoundingRect()
      }))

      if (mode === 'horizontal') {
        // Sort by left position
        bounds.sort((a, b) => a.bounds.left - b.bounds.left)

        const first = bounds[0].bounds
        const last = bounds[bounds.length - 1].bounds
        const totalSpace = (last.left + last.width) - first.left
        const objectsWidth = bounds.reduce((sum, { bounds }) => sum + bounds.width, 0)
        const spacing = (totalSpace - objectsWidth) / (bounds.length - 1)

        let currentX = first.left
        bounds.forEach(({ obj, bounds: objBounds }) => {
          const offset = currentX - objBounds.left
          obj.set({ left: (obj.left || 0) + offset })
          obj.setCoords()
          currentX += objBounds.width + spacing
        })
      } else {
        // Sort by top position
        bounds.sort((a, b) => a.bounds.top - b.bounds.top)

        const first = bounds[0].bounds
        const last = bounds[bounds.length - 1].bounds
        const totalSpace = (last.top + last.height) - first.top
        const objectsHeight = bounds.reduce((sum, { bounds }) => sum + bounds.height, 0)
        const spacing = (totalSpace - objectsHeight) / (bounds.length - 1)

        let currentY = first.top
        bounds.forEach(({ obj, bounds: objBounds }) => {
          const offset = currentY - objBounds.top
          obj.set({ top: (obj.top || 0) + offset })
          obj.setCoords()
          currentY += objBounds.height + spacing
        })
      }

      canvas.renderAll()
      canvas.fire('object:modified', { target: activeObject })
    },
    // Layer grouping
    groupSelected: () => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return null

      const activeObject = canvas.getActiveObject()
      if (!activeObject || activeObject.type !== 'activeSelection') return null

      const selection = activeObject as ActiveSelection
      const objects = selection.getObjects()

      if (objects.length < 2) return null

      // Remove selection from canvas
      canvas.discardActiveObject()

      // Create a new group
      const group = new Group(objects, {
        left: selection.left,
        top: selection.top,
      })

      // Add UUID and name
      const groupObj = group as any
      groupObj.id = generateUUID()
      groupObj.name = `Group (${objects.length} items)`

      // Remove individual objects and add group
      objects.forEach(obj => canvas.remove(obj))
      canvas.add(group)
      canvas.setActiveObject(group)
      canvas.renderAll()
      canvas.fire('object:added', { target: group })

      return groupObj.id
    },
    ungroupSelected: () => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return false

      const activeObject = canvas.getActiveObject()
      if (!activeObject || activeObject.type !== 'group') return false

      const group = activeObject as Group
      const items = group.getObjects()

      // Calculate absolute positions for each item
      const groupLeft = group.left || 0
      const groupTop = group.top || 0

      // Ungroup items
      // group._restoreObjectsState()
      canvas.remove(group)

      // Add items back to canvas
      items.forEach((item: any) => {
        canvas.add(item)
      })

      // Select all ungrouped items
      const activeSelection = new ActiveSelection(items, { canvas })
      canvas.setActiveObject(activeSelection)
      canvas.renderAll()
      canvas.fire('object:modified', { target: activeSelection })

      return true
    },
  }))

  // Space key listener for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
        const canvas = fabricCanvasRef.current
        if (canvas) {
          canvas.defaultCursor = 'grab'
          canvas.hoverCursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        setIsPanning(false)
        panStartRef.current = null
        const canvas = fabricCanvasRef.current
        if (canvas) {
          canvas.defaultCursor = 'default'
          canvas.hoverCursor = 'move'
          canvas.selection = true
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Resize canvas when dimensions change
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    if (canvas.getWidth() !== widthPx || canvas.getHeight() !== heightPx) {
      canvas.set({ width: widthPx, height: heightPx })
      canvas.renderAll()
    }
  }, [widthPx, heightPx])

  // Convert Fabric object to our CanvasObject interface
  const convertFabricToCanvasObject = (fabricObj: any): CanvasObject => {
    const base = {
      id: fabricObj.id || generateUUID(),
      type: fabricObj.type === 'textbox' ? 'text' : fabricObj.type,
      x: fabricObj.left || 0,
      y: fabricObj.top || 0,
      width: fabricObj.width,
      height: fabricObj.height,
      radius: fabricObj.radius,
      text: fabricObj.text,
      fontSize: fabricObj.fontSize,
      fontFamily: fabricObj.fontFamily,
      fill: fabricObj.fill || '#000000',
      stroke: fabricObj.stroke || 'transparent',
      strokeWidth: fabricObj.strokeWidth || 0,
      selected: fabricObj === fabricCanvasRef.current?.getActiveObject(),
      scaleX: fabricObj.scaleX,
      scaleY: fabricObj.scaleY,
      angle: fabricObj.angle,
      opacity: fabricObj.opacity
    }

    // Handle image type
    if (fabricObj.type === 'image') {
      return {
        ...base,
        imageUrl: fabricObj.getSrc?.() || fabricObj._originalElement?.src,
      }
    }

    return base
  }

  // Handle mouse events for drawing
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: any) => {
      if (selectedTool === 'select') return

      setIsDrawing(true)
      const pointer = canvas.getScenePoint(e.e)

      switch (selectedTool) {
        case 'text':
          addTextObject(pointer.x, pointer.y)
          break
        case 'rectangle':
          addRectangleObject(pointer.x, pointer.y)
          break
        case 'circle':
          addCircleObject(pointer.x, pointer.y)
          break
        case 'line':
          addLineObject(pointer.x, pointer.y)
          break
      }
    }

    canvas.on('mouse:down', handleMouseDown)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [selectedTool])

  // Add different object types
  const addTextObject = (x: number, y: number) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const text = new Textbox('Edit Text', {
      left: x,
      top: y,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#000000',
      width: 200
    }) as any

    text.id = generateUUID()
    text.name = 'Text'

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const addRectangleObject = (x: number, y: number) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const rect = new Rect({
      left: x,
      top: y,
      width: 100,
      height: 60,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 1
    }) as any

    rect.id = generateUUID()
    rect.name = 'Rectangle'

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  const addCircleObject = (x: number, y: number) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const circle = new Circle({
      left: x,
      top: y,
      radius: 50,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 1
    }) as any

    circle.id = generateUUID()
    circle.name = 'Circle'

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  const addLineObject = (x: number, y: number) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const line = new Line([x, y, x + 100, y], {
      stroke: '#000000',
      strokeWidth: 2
    }) as any

    line.id = generateUUID()
    line.name = 'Line'

    canvas.add(line)
    canvas.setActiveObject(line)
    canvas.renderAll()
  }

  // Load template objects
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !templateObjects.length) return

    canvas.clear()

    const loadObjects = async () => {
      for (const obj of templateObjects) {
        let fabricObj: any

        switch (obj.type) {
          case 'text':
            fabricObj = new Textbox(obj.text || 'Text', {
              left: obj.x,
              top: obj.y,
              fontSize: obj.fontSize || 20,
              fontFamily: obj.fontFamily || 'Arial',
              fill: obj.fill,
              width: obj.width || 200
            })
            break
          case 'rectangle':
            fabricObj = new Rect({
              left: obj.x,
              top: obj.y,
              width: obj.width || 100,
              height: obj.height || 60,
              fill: obj.fill,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth
            })
            break
          case 'circle':
            fabricObj = new Circle({
              left: obj.x,
              top: obj.y,
              radius: obj.radius || 50,
              fill: obj.fill,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth
            })
            break
          case 'image':
            if (obj.imageUrl || obj.src) {
              try {
                const imgElement = await FabricImage.fromURL(obj.imageUrl || obj.src!, {
                  crossOrigin: 'anonymous',
                })
                imgElement.set({
                  left: obj.x,
                  top: obj.y,
                  scaleX: obj.scaleX ?? 1,
                  scaleY: obj.scaleY ?? 1,
                  angle: obj.angle ?? 0,
                  opacity: obj.opacity ?? 1,
                })
                fabricObj = imgElement
              } catch (error) {
                console.error('Failed to load template image:', error)
                return
              }
            }
            break
          default:
            return
        }

        if (fabricObj) {
          canvas.add(fabricObj)
        }
      }

      canvas.renderAll()
    }

    loadObjects()
  }, [templateObjects])

  // Update selected object properties
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const activeObject = canvas?.getActiveObject()
    
    if (!activeObject || !objectProperties) return

    if (objectProperties.fill !== undefined) {
      activeObject.set('fill', objectProperties.fill)
    }
    if (objectProperties.stroke !== undefined) {
      activeObject.set('stroke', objectProperties.stroke)
    }
    if (objectProperties.strokeWidth !== undefined) {
      activeObject.set('strokeWidth', objectProperties.strokeWidth)
    }
    if (objectProperties.fontSize !== undefined && activeObject.type === 'textbox') {
      activeObject.set('fontSize', objectProperties.fontSize)
    }
    if (objectProperties.text !== undefined && activeObject.type === 'textbox') {
      activeObject.set('text', objectProperties.text)
    }
    if (objectProperties.opacity !== undefined) {
      activeObject.set('opacity', objectProperties.opacity)
    }

    if (canvas) {
      canvas.renderAll()
    }
  }, [objectProperties])

  return (
    <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg" style={{ overflow: clipContent ? 'hidden' : 'visible' }}>
      <canvas
        ref={canvasRef}
        className="border border-gray-400 rounded shadow-lg bg-white"
      />
    </div>
  )
})

export default DesignCanvas

// Helper function to check if a point is within an object
export function isPointInObject(obj: CanvasObject, x: number, y: number): boolean {
  switch (obj.type) {
    case 'rectangle':
      return !!(obj.width && obj.height) &&
             x >= obj.x && x <= obj.x + obj.width &&
             y >= obj.y && y <= obj.y + obj.height
    case 'circle':
      const centerX = obj.x + (obj.radius || 0)
      const centerY = obj.y + (obj.radius || 0)
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
      return distance <= (obj.radius || 0)
    case 'line':
      return !!(obj.width && obj.height) &&
             x >= Math.min(obj.x, obj.x + obj.width) - 5 &&
             x <= Math.max(obj.x, obj.x + obj.width) + 5 &&
             y >= Math.min(obj.y, obj.y + obj.height) - 5 &&
             y <= Math.max(obj.y, obj.y + obj.height) + 5
    case 'text':
      return !!(obj.width && obj.height) &&
             x >= obj.x && x <= obj.x + obj.width &&
             y >= obj.y && y <= obj.y + obj.height
    default:
      return false
  }
}
