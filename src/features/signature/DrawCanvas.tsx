import { useCallback, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

interface DrawCanvasProps {
  onFinish: (canvas: HTMLCanvasElement) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

interface Stroke {
  size: number
  points: Point[]
}

const PEN_SIZES = [
  { id: 'fine', label: 'Fine', width: 3 },
  { id: 'medium', label: 'Medium', width: 6 },
  { id: 'bold', label: 'Bold', width: 10 },
] as const

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 420

export function DrawCanvas({ onFinish, onCancel }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const activeStrokeRef = useRef<Stroke | null>(null)
  const [penId, setPenId] = useState<(typeof PEN_SIZES)[number]['id']>('medium')
  const [strokeCount, setStrokeCount] = useState(0)

  const penWidth = PEN_SIZES.find((pen) => pen.id === penId)?.width ?? 6

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1c1c1a'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokesRef.current) {
      ctx.lineWidth = stroke.size * 2
      ctx.beginPath()
      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i]
        if (i === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      }
      if (stroke.points.length === 1) {
        const only = stroke.points[0]
        ctx.lineTo(only.x + 0.1, only.y)
      }
      ctx.stroke()
    }
  }, [])

  const toCanvasPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const stroke: Stroke = { size: penWidth, points: [toCanvasPoint(event)] }
    activeStrokeRef.current = stroke
    strokesRef.current.push(stroke)
    setStrokeCount(strokesRef.current.length)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    redraw()
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStrokeRef.current
    if (!stroke) return
    const point = toCanvasPoint(event)
    const last = stroke.points[stroke.points.length - 1]
    if (Math.abs(point.x - last.x) + Math.abs(point.y - last.y) > 2) {
      stroke.points.push(point)
      redraw()
    }
  }

  const endStroke = () => {
    activeStrokeRef.current = null
  }

  const undo = () => {
    strokesRef.current.pop()
    setStrokeCount(strokesRef.current.length)
    redraw()
  }

  const clear = () => {
    strokesRef.current = []
    setStrokeCount(0)
    redraw()
  }

  return (
    <div className="draw-panel">
      <div className="draw-toolbar">
        <div className="pen-picker" role="radiogroup" aria-label="Pen size">
          {PEN_SIZES.map((pen) => (
            <button
              key={pen.id}
              type="button"
              role="radio"
              aria-checked={pen.id === penId}
              className={pen.id === penId ? 'pen-option is-active' : 'pen-option'}
              onClick={() => setPenId(pen.id)}
            >
              {pen.label}
            </button>
          ))}
        </div>
        <button type="button" className="button button-secondary" onClick={undo} disabled={strokeCount === 0}>
          Undo
        </button>
        <button type="button" className="button button-secondary" onClick={clear} disabled={strokeCount === 0}>
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Signature drawing area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      />
      <p className="intake-alt">Draw your signature above the line using a finger, stylus or mouse.</p>
      <div className="step-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Back
        </button>
        <button
          type="button"
          className="button button-primary"
          disabled={strokeCount === 0}
          onClick={() => {
            const canvas = canvasRef.current
            if (canvas && strokeCount > 0) onFinish(canvas)
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
