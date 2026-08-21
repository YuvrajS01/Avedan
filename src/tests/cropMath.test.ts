import { describe, expect, it } from 'vitest'
import { clampPan, coverScale, sourceCropRect } from '../features/photo/cropMath'

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
