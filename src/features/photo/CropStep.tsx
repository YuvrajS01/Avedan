import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { clampPan, coverScale, sourceCropRect } from './cropMath'
import type { Rect } from '../../processing/geometry'

interface CropStepProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  aspectRatio: number
  summary: string
  busy: boolean
  error: string | null
  onConfirm: (rect: Rect) => void
  onCancel: () => void
}

const DEFAULT_BOX = { width: 320, height: 240 }

export function CropStep({
  imageUrl,
  imageWidth,
  imageHeight,
  aspectRatio,
  summary,
  busy,
  error,
  onConfirm,
  onCancel,
}: CropStepProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const [box, setBox] = useState(DEFAULT_BOX)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const measure = () => {
      const el = boxRef.current
      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        setBox({ width: el.clientWidth, height: el.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const view = {
    boxWidth: box.width,
    boxHeight: box.height,
    imageWidth,
    imageHeight,
    zoom,
    offsetX: offset.x,
    offsetY: offset.y,
  }

  const applyPan = (dx: number, dy: number) => {
    setOffset((current) => {
      const next = clampPan({
        ...view,
        offsetX: current.x + dx,
        offsetY: current.y + dy,
      })
      return { x: next.offsetX, y: next.offsetY }
    })
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = clampPan({
      ...view,
      offsetX: drag.baseX + (event.clientX - drag.startX),
      offsetY: drag.baseY + (event.clientY - drag.startY),
    })
    setOffset({ x: next.offsetX, y: next.offsetY })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = 10
    if (event.key === 'ArrowLeft') applyPan(-step, 0)
    else if (event.key === 'ArrowRight') applyPan(step, 0)
    else if (event.key === 'ArrowUp') applyPan(0, -step)
    else if (event.key === 'ArrowDown') applyPan(0, step)
    else return
    event.preventDefault()
  }

  const resetFraming = () => {
    setZoom(1)
    const next = clampPan({ ...view, zoom: 1, offsetX: 0, offsetY: 0 })
    setOffset({ x: next.offsetX, y: next.offsetY })
  }

  const scale = coverScale(box.width, box.height, imageWidth, imageHeight) * zoom

  return (
    <section className="view" aria-labelledby="crop-title">
      <h1 id="crop-title">Crop your photo</h1>
      <p className="lede">
        Drag to position and pinch/scroll-free zoom to frame. Target:{' '}
        <strong>{summary}</strong>
      </p>
      <div
        ref={boxRef}
        className="crop-box"
        style={{ aspectRatio: String(aspectRatio) }}
        tabIndex={0}
        role="application"
        aria-label={`Crop area for a ${summary} photo. Use arrow keys to adjust the framing.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="crop-image"
            style={{
              width: `${imageWidth * scale}px`,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
        ) : (
          <div className="crop-image crop-image-missing" style={{ width: `${imageWidth * scale}px` }} aria-hidden="true" />
        )}
      </div>
      <div className="crop-controls">
        <label className="field">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => {
              const nextZoom = Number(event.target.value)
              setZoom(nextZoom)
              setOffset((current) => {
                const next = clampPan({ ...view, zoom: nextZoom, offsetX: current.x, offsetY: current.y })
                return { x: next.offsetX, y: next.offsetY }
              })
            }}
          />
        </label>
        <button type="button" className="button button-secondary" onClick={resetFraming}>
          Reset framing
        </button>
      </div>
      {busy && (
        <p className="busy-note" role="status">
          Processing your photo…
        </p>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
      <div className="step-actions">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>
          Back
        </button>
        <button
          type="button"
          className="button button-primary"
          disabled={busy}
          onClick={() => onConfirm(sourceCropRect(view))}
        >
          Continue
        </button>
      </div>
    </section>
  )
}
