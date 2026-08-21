import { describe, expect, it } from 'vitest'
import { ProcessingError } from '../processing/errors'
import {
  computeCropRect,
  computeResizeDimensions,
  computeFitDimensions,
  dimensionsFromPhysical,
} from '../processing/geometry'

describe('computeCropRect', () => {
  it('crops a landscape source to a portrait aspect ratio', () => {
    const rect = computeCropRect(1000, 500, 3 / 4)
    expect(rect.height).toBe(500)
    expect(rect.width).toBe(375)
    expect(rect.x).toBe(Math.round((1000 - 375) / 2))
    expect(rect.y).toBe(0)
  })

  it('crops a portrait source to a landscape aspect ratio', () => {
    const rect = computeCropRect(600, 1200, 4 / 3)
    expect(rect.width).toBe(600)
    expect(rect.height).toBe(450)
    expect(rect.y).toBe(Math.round((1200 - 450) / 2))
  })

  it('keeps the full source when the ratio already matches', () => {
    const rect = computeCropRect(300, 400, 3 / 4)
    expect(rect).toEqual({ x: 0, y: 0, width: 300, height: 400 })
  })

  it('honors an extreme aspect ratio', () => {
    const rect = computeCropRect(1000, 1000, 10)
    expect(rect.width).toBe(1000)
    expect(rect.height).toBe(100)
  })

  it('stays within bounds for very small sources', () => {
    const rect = computeCropRect(1, 1, 16 / 9)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
    expect(rect.width).toBe(1)
    expect(rect.height).toBe(1)
  })

  it('centers on the focus point', () => {
    const wide = computeCropRect(2000, 1000, 1, { x: 0.75, y: 0.5 })
    expect(wide.x).toBe(1000)
    expect(wide.y).toBe(0)

    const tall = computeCropRect(1000, 2000, 1, { x: 0.5, y: 0.75 })
    expect(tall.x).toBe(0)
    expect(tall.y).toBe(1000)

    const centered = computeCropRect(2000, 1000, 1, { x: 0.5, y: 0.5 })
    expect(centered.x).toBe(500)
    expect(centered.y).toBe(0)
  })

  it('clamps focus-driven crops inside the source', () => {
    const rect = computeCropRect(100, 100, 1, { x: 0, y: 0 })
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)

    const bottomRight = computeCropRect(100, 100, 1, { x: 1, y: 1 })
    expect(bottomRight.x).toBe(0)
    expect(bottomRight.y).toBe(0)
  })

  it('clamps out-of-range focus values', () => {
    const rect = computeCropRect(100, 100, 1, { x: -5, y: 42 })
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
  })

  it('rejects invalid inputs', () => {
    expect(() => computeCropRect(0, 100, 1)).toThrow(ProcessingError)
    expect(() => computeCropRect(100, -1, 1)).toThrow(ProcessingError)
    expect(() => computeCropRect(100, 100, 0)).toThrow(ProcessingError)
    expect(() => computeCropRect(100, 100, Number.NaN)).toThrow(ProcessingError)
  })
})

describe('computeResizeDimensions', () => {
  it('uses both target dimensions exactly', () => {
    expect(computeResizeDimensions({ width: 1000, height: 800 }, { width: 413, height: 531 })).toEqual({
      width: 413,
      height: 531,
    })
  })

  it('scales proportionally when only width is given', () => {
    expect(computeResizeDimensions({ width: 1000, height: 500 }, { width: 200 })).toEqual({
      width: 200,
      height: 100,
    })
  })

  it('scales proportionally when only height is given', () => {
    expect(computeResizeDimensions({ width: 1000, height: 500 }, { height: 100 })).toEqual({
      width: 200,
      height: 100,
    })
  })

  it('rounds proportional results without collapsing to zero', () => {
    expect(computeResizeDimensions({ width: 1000, height: 3 }, { width: 1 })).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('keeps source dimensions when no target is given', () => {
    expect(computeResizeDimensions({ width: 640, height: 480 })).toEqual({
      width: 640,
      height: 480,
    })
  })

  it('rejects invalid inputs', () => {
    expect(() => computeResizeDimensions({ width: 0, height: 10 })).toThrow(ProcessingError)
    expect(() => computeResizeDimensions({ width: 10, height: 10 }, { width: -5 })).toThrow(
      ProcessingError,
    )
    expect(() => computeResizeDimensions({ width: 10, height: 10 }, { width: 1.5 })).toThrow(
      ProcessingError,
    )
  })
})

describe('dimensionsFromPhysical', () => {  it('converts millimeters at 300 DPI deterministically', () => {
    expect(dimensionsFromPhysical({ widthMm: 25.4, heightMm: 25.4 }, 300)).toEqual({
      width: 300,
      height: 300,
    })
    expect(dimensionsFromPhysical({ widthMm: 35, heightMm: 45 }, 300)).toEqual({
      width: 413,
      height: 531,
    })
  })

  it('produces identical output for repeated calls', () => {
    const a = dimensionsFromPhysical({ widthMm: 20, heightMm: 50 }, 200)
    const b = dimensionsFromPhysical({ widthMm: 20, heightMm: 50 }, 200)
    expect(a).toEqual(b)
  })

  it('never produces zero pixels for tiny physical sizes', () => {
    const { width, height } = dimensionsFromPhysical({ widthMm: 0.01, heightMm: 0.01 }, 72)
    expect(width).toBeGreaterThanOrEqual(1)
    expect(height).toBeGreaterThanOrEqual(1)
  })

  it('rejects invalid DPI or missing dimensions', () => {
    expect(() => dimensionsFromPhysical({ widthMm: 35, heightMm: 45 }, 0)).toThrow(ProcessingError)
    expect(() => dimensionsFromPhysical({}, 300)).toThrow(ProcessingError)
    expect(() => dimensionsFromPhysical({ widthMm: 35 }, 300)).toThrow(ProcessingError)
  })
})

describe('computeFitDimensions', () => {
  it('keeps sources that already fit', () => {
    expect(computeFitDimensions({ width: 200, height: 80 }, { width: 300, height: 100 })).toEqual({
      width: 200,
      height: 80,
    })
  })

  it('shrinks to fit while preserving the aspect ratio', () => {
    const fit = computeFitDimensions({ width: 900, height: 300 }, { width: 300, height: 100 })
    expect(fit).toEqual({ width: 300, height: 100 })

    const tall = computeFitDimensions({ width: 600, height: 400 }, { width: 300, height: 100 })
    expect(tall.width).toBeLessThanOrEqual(300)
    expect(tall.height).toBeLessThanOrEqual(100)
    expect(tall.width / tall.height).toBeCloseTo(600 / 400, 2)
  })

  it('constrains by the tighter axis', () => {
    const fit = computeFitDimensions({ width: 1000, height: 100 }, { width: 300, height: 100 })
    expect(fit).toEqual({ width: 300, height: 30 })
  })

  it('never upscales small sources', () => {
    expect(computeFitDimensions({ width: 50, height: 20 }, { width: 300, height: 100 })).toEqual({
      width: 50,
      height: 20,
    })
  })

  it('never produces zero dimensions', () => {
    const fit = computeFitDimensions({ width: 10000, height: 3 }, { width: 10, height: 10 })
    expect(fit.width).toBeGreaterThanOrEqual(1)
    expect(fit.height).toBeGreaterThanOrEqual(1)
  })

  it('rejects invalid inputs', () => {
    expect(() => computeFitDimensions({ width: 0, height: 5 }, { width: 10, height: 10 })).toThrow(
      ProcessingError,
    )
    expect(() => computeFitDimensions({ width: 5, height: 5 }, { width: -1, height: 10 })).toThrow(
      ProcessingError,
    )
  })
})
