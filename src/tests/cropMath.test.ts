import { describe, expect, it } from 'vitest'
import { clampPan, coverScale, cropBoxStyle, faceFraming, sourceCropRect } from '../features/photo/cropMath'

const BOX = { boxWidth: 300, boxHeight: 400 }
const IMAGE = { imageWidth: 1200, imageHeight: 1600 }

describe('coverScale', () => {
  it('picks the larger ratio so the image covers the box', () => {
    expect(coverScale(300, 400, 1200, 1600)).toBeCloseTo(0.25)
    expect(coverScale(400, 400, 1200, 1600)).toBeCloseTo(1 / 3)
  })

  it('returns 1 for degenerate inputs', () => {
    expect(coverScale(0, 100, 100, 100)).toBe(1)
    expect(coverScale(100, 100, 0, 100)).toBe(1)
  })
})

describe('clampPan', () => {
  it('allows no movement when zoomed to exact cover', () => {
    const clamped = clampPan({
      ...BOX,
      ...IMAGE,
      zoom: 1,
      offsetX: -50,
      offsetY: 30,
    })
    expect(clamped.offsetX).toBeCloseTo(0)
    expect(clamped.offsetY).toBeCloseTo(0)
  })

  it('limits movement to hidden overflow at higher zoom', () => {
    const clamped = clampPan({
      ...BOX,
      ...IMAGE,
      zoom: 2,
      offsetX: -9999,
      offsetY: 9999,
    })
    const scale = coverScale(300, 400, 1200, 1600) * 2
    expect(clamped.offsetX).toBe(-((1200 * scale - 300) / 2))
    expect(clamped.offsetY).toBe((1600 * scale - 400) / 2)
  })
})

describe('cropBoxStyle', () => {
  it('preserves the target aspect ratio even when height-capped', () => {
    // Regression: previously the box was width:100% + max-height:60vh, so a
    // portrait target got clamped into a wider box and exports were distorted.
    for (const aspectRatio of [3 / 4, 1, 35 / 45, 413 / 531]) {
      const style = cropBoxStyle(aspectRatio)
      expect(style.aspectRatio).toBe(String(aspectRatio))

      // At the cap boundary: width = 60vh * ratio, height = width / ratio = 60vh.
      const capPx = 500 // pretend 60vh === 500px
      const box = {
        boxWidth: Math.round(capPx * aspectRatio),
        boxHeight: capPx,
        imageWidth: 1200,
        imageHeight: 1600,
        zoom: 2,
        offsetX: 0,
        offsetY: 0,
      }
      const rect = sourceCropRect({ ...box, ...clampPan(box) })
      expect(rect.width / rect.height).toBeCloseTo(aspectRatio, 2)
    }
  })

  it('caps width at the viewport height times the ratio', () => {
    expect(cropBoxStyle(2).width).toBe('min(100%, calc(60vh * 2))')
    expect(cropBoxStyle(0.5).width).toBe('min(100%, calc(60vh * 0.5))')
  })

  it('falls back to portrait 3:4 for invalid ratios', () => {
    expect(cropBoxStyle(Number.NaN)).toEqual(cropBoxStyle(3 / 4))
    expect(cropBoxStyle(0)).toEqual(cropBoxStyle(3 / 4))
    expect(cropBoxStyle(-1)).toEqual(cropBoxStyle(3 / 4))
  })
})

describe('sourceCropRect', () => {
  it('returns the centered cover crop at zoom 1', () => {
    const rect = sourceCropRect({ ...BOX, ...IMAGE, zoom: 1, offsetX: 0, offsetY: 0 })
    expect(rect).toEqual({ x: 0, y: 0, width: 1200, height: 1600 })
  })

  it('keeps the box aspect ratio at any zoom', () => {
    for (const zoom of [1.5, 2, 3]) {
      const rect = sourceCropRect({ ...BOX, ...IMAGE, zoom, offsetX: 0, offsetY: 0 })
      expect(rect.width / rect.height).toBeCloseTo(300 / 400, 2)
    }
  })

  it('follows pan offsets within bounds', () => {
    const view = { ...BOX, ...IMAGE, zoom: 2, offsetX: 100, offsetY: -50 }
    const clamped = clampPan(view)
    const rect = sourceCropRect({ ...view, ...clamped })

    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(1200)
    expect(rect.y + rect.height).toBeLessThanOrEqual(1600)

    const opposite = sourceCropRect({ ...view, offsetX: clamped.offsetX * -1, offsetY: clamped.offsetY * -1 })
    expect(opposite.x).toBeGreaterThan(rect.x)
    expect(opposite.y).toBeLessThan(rect.y)
  })

  it('stays inside the image for extreme zoom and pan combinations', () => {
    for (let zoom = 1; zoom <= 3; zoom += 0.5) {
      for (const offsetX of [-500, 0, 500]) {
        for (const offsetY of [-500, 0, 500]) {
          const view = { ...BOX, ...IMAGE, zoom, ...clampPan({ ...BOX, ...IMAGE, zoom, offsetX, offsetY }) }
          const rect = sourceCropRect(view)
          expect(rect.x).toBeGreaterThanOrEqual(0)
          expect(rect.y).toBeGreaterThanOrEqual(0)
          expect(rect.x + rect.width).toBeLessThanOrEqual(1200)
          expect(rect.y + rect.height).toBeLessThanOrEqual(1600)
          expect(rect.width).toBeGreaterThan(0)
          expect(rect.height).toBeGreaterThan(0)
        }
      }
    }
  })

  it('falls back to the full image for degenerate boxes', () => {
    const rect = sourceCropRect({ boxWidth: 0, boxHeight: 0, ...IMAGE, zoom: 1, offsetX: 0, offsetY: 0 })
    expect(rect).toEqual({ x: 0, y: 0, width: 1200, height: 1600 })
  })
})

describe('faceFraming', () => {
  const box = { boxWidth: 300, boxHeight: 400, imageWidth: 600, imageHeight: 800 }
  const centeredFace = { x: 0.35, y: 0.3, width: 0.3, height: 0.4 }

  it('places a well-sized face at the canonical position without zoom change', () => {
    const framing = faceFraming({ ...box, face: centeredFace })
    // base = 0.5; face pixel height 320 → wanted zoom = 0.55*400/320/0.5 = 1.375
    expect(framing.zoom).toBeCloseTo(1.375, 3)
    const clamped = clampPan({
      ...box,
      zoom: framing.zoom,
      offsetX: framing.offsetX,
      offsetY: framing.offsetY,
    })
    // Face center maps back into the crop box near target Y.
    const scale = coverScale(300, 400, 600, 800) * framing.zoom
    const screenX =
      150 + clamped.offsetX + ((0.5 * 600) - 300) * scale
    expect(screenX).toBeCloseTo(150, 0)
    const faceCenterY = (0.3 + 0.2) * 800
    const screenY =
      200 + clamped.offsetY + (faceCenterY - 400) * scale
    expect(screenY).toBeLessThanOrEqual(0.42 * 400 + 1)
    expect(screenY).toBeGreaterThanOrEqual(0.42 * 400 - 40)
  })

  it('clamps zoom to the slider minimum for a huge face', () => {
    const framing = faceFraming({ ...box, face: { x: 0.2, y: 0.1, width: 0.6, height: 0.9 } })
    expect(framing.zoom).toBe(1)
  })

  it('clamps zoom to the slider maximum for a tiny face', () => {
    const framing = faceFraming({ ...box, face: { x: 0.45, y: 0.45, width: 0.06, height: 0.05 } })
    expect(framing.zoom).toBe(3)
  })

  it('shifts offsets toward an off-center face', () => {
    const leftFace = { x: 0.05, y: 0.3, width: 0.25, height: 0.4 }
    const framing = faceFraming({ ...box, face: leftFace })
    // Face sits left of center → offset must be positive (image moves right).
    expect(framing.offsetX).toBeGreaterThan(0)
  })

  it('degenerates safely for a zero-height face', () => {
    const framing = faceFraming({ ...box, face: { x: 0.4, y: 0.4, width: 0.2, height: 0 } })
    expect(Number.isFinite(framing.zoom)).toBe(true)
  })
})
