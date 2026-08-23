import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { FlowSteps } from '../../components/FlowSteps'
import { clampPan, coverScale, cropBoxStyle, faceFraming, sourceCropRect } from './cropMath'
import type { NormalizedFace } from './cropMath'
import type { Rect } from '../../processing/geometry'

interface CropStepProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  aspectRatio: number
  summary: string
  busy: boolean
  error: string | null
  /** Optional auto-framing seed from camera face detection (T015). */
  faceRect?: NormalizedFace
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
  faceRect,
  onConfirm,
  onCancel,
}: CropStepProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const [box, setBox] = useState(DEFAULT_BOX)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  // T015: apply the face suggestion once, before any manual adjustment.
  const appliedRef = useRef(false)
  const measuredRef = useRef(false)
  const adjustedRef = useRef(false)
  const [autoFramed, setAutoFramed] = useState(false)

  /** Any manual interaction dismisses the auto-framing note for good. */
  const markAdjusted = () => {
    if (!adjustedRef.current) {
      adjustedRef.current = true
      setAutoFramed(false)
    }
  }

  useEffect(() => {
    const measure = () => {
      const el = boxRef.current
      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        measuredRef.current = true
        setBox({ width: el.clientWidth, height: el.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // T015: seed the framing from the detected face once the box has been
  // measured — only before the user's first manual adjustment (FR-04).
  useEffect(() => {
    if (!faceRect || !measuredRef.current || appliedRef.current || adjustedRef.current) return
    appliedRef.current = true
    const framing = faceFraming({
      boxWidth: box.width,
      boxHeight: box.height,
      imageWidth,
      imageHeight,
      face: faceRect,
    })
    const view = {
      boxWidth: box.width,
      boxHeight: box.height,
      imageWidth,
      imageHeight,
      zoom: framing.zoom,
      offsetX: framing.offsetX,
      offsetY: framing.offsetY,
    }
    const clamped = clampPan(view)
    setZoom(framing.zoom)
    setOffset({ x: clamped.offsetX, y: clamped.offsetY })
    setAutoFramed(true)
  }, [faceRect, box, imageWidth, imageHeight])

  const view = {
    boxWidth: box.width,
    boxHeight: box.height,
    imageWidth,
    imageHeight,
    zoom,
    offsetX: offset.x,
    offsetY: offset.y,
  }

  const boxStyle = cropBoxStyle(aspectRatio)

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
    markAdjusted()
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
    // Arrow-key panning counts as a manual adjustment (T015).
    if (event.key === 'ArrowLeft') applyPan(-step, 0)
    else if (event.key === 'ArrowRight') applyPan(step, 0)
    else if (event.key === 'ArrowUp') applyPan(0, -step)
    else if (event.key === 'ArrowDown') applyPan(0, step)
    else return
    event.preventDefault()
    markAdjusted()
  }

  const resetFraming = () => {
    setZoom(1)
    const next = clampPan({ ...view, zoom: 1, offsetX: 0, offsetY: 0 })
    setOffset({ x: next.offsetX, y: next.offsetY })
  }

  const scale = coverScale(box.width, box.height, imageWidth, imageHeight) * zoom

  return (
    <section className="view" aria-labelledby="crop-title">
      <FlowSteps current="frame" />
      <h1 id="crop-title">Crop your photo</h1>
      <p className="lede">
        Drag to position your photo inside the frame. Target:{' '}
        <strong>{summary}</strong>
      </p>
      <div className="workspace">
        <div
          ref={boxRef}
          className="crop-stage"
          style={boxStyle}
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
          <div className="crop-guides" aria-hidden="true" />
          <span className="crop-corner tl" aria-hidden="true" />
          <span className="crop-corner tr" aria-hidden="true" />
          <span className="crop-corner bl" aria-hidden="true" />
          <span className="crop-corner br" aria-hidden="true" />
        </div>
        <div>
          {autoFramed && (
            <p className="auto-frame-note" role="status">
              Auto-framed from your face — adjust freely.
            </p>
          )}
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
                  markAdjusted()
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
              Reset
            </button>
          </div>
          {busy && (
            <p className="busy-note" role="status">
              <span className="spinner" aria-hidden="true" />
              Preparing your photo…
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
        </div>
      </div>
    </section>
  )
}
