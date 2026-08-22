import { describe, expect, it, vi } from 'vitest'
import {
  assessCanvasQuality,
  assessImageQuality,
  laplacianVariance,
  lumaStatistics,
  toLuma,
} from '../processing/quality'
import { createPixelCanvas } from './fakes'
import type { CanvasFactory, DrawableSource } from '../processing/crop'

function solidPixels(width: number, height: number, gray: number): Uint8ClampedArray {
  return new Uint8ClampedArray(width * height * 4).fill(gray)
}

describe('toLuma / lumaStatistics', () => {
  it('converts RGB using Rec.709 weights', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
    const luma = toLuma(pixels)
    expect(luma[0]).toBeCloseTo(54.2, 1)
    expect(luma[1]).toBeCloseTo(182.4, 1)
    expect(luma[2]).toBeCloseTo(18.41, 1)
  })

  it('summarizes flat and mixed buffers', () => {
    expect(lumaStatistics([])).toEqual({ mean: 0, stdDev: 0 })
    const flat = lumaStatistics(toLuma(solidPixels(4, 4, 128)))
    expect(flat.mean).toBeCloseTo(128)
    expect(flat.stdDev).toBeCloseTo(0)
  })
})

describe('laplacianVariance', () => {
  it('reports zero for a perfectly flat image', () => {
    const width = 8
    const height = 8
    const luma = new Array(width * height).fill(100)
    expect(laplacianVariance(luma, width, height)).toBeCloseTo(0)
  })

  it('reports high variance for a checkerboard', () => {
    const size = 16
    const luma: number[] = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        luma.push((x + y) % 2 === 0 ? 20 : 220)
      }
    }
    expect(laplacianVariance(luma, size, size)).toBeGreaterThan(100)
  })

  it('returns zero for degenerate dimensions', () => {
    expect(laplacianVariance([10], 1, 1)).toBe(0)
  })
})

describe('assessImageQuality', () => {
  function checkerboard(size = 64) {
    const pixels = new Uint8ClampedArray(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const block = Math.floor(x / 4) % 2 === 0 ? 40 : 200
        pixels[i] = pixels[i + 1] = pixels[i + 2] = block
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  it('passes all hints for a well-lit detailed image', () => {
    const checks = assessImageQuality(checkerboard(), 64, 64)
    for (const check of checks) {
      expect(check.status).toBe('ok')
    }
    expect(checks.map((check) => check.id)).toEqual(['brightness', 'contrast', 'sharpness'])
  })

  it('flags dark images', () => {
    const checks = assessImageQuality(solidPixels(32, 32, 30), 32, 32)
    const brightness = checks.find((check) => check.id === 'brightness')
    expect(brightness?.status).toBe('attention')
    expect(brightness?.label).toMatch(/dark/i)
  })

  it('flags very bright images', () => {
    const checks = assessImageQuality(solidPixels(32, 32, 240), 32, 32)
    const brightness = checks.find((check) => check.id === 'brightness')
    expect(brightness?.status).toBe('attention')
    expect(brightness?.label).toMatch(/bright/i)
  })

  it('flags flat images as low contrast and possibly blurry', () => {
    const checks = assessImageQuality(solidPixels(32, 32, 128), 32, 32)
    expect(checks.find((check) => check.id === 'contrast')?.status).toBe('attention')
    expect(checks.find((check) => check.id === 'sharpness')?.status).toBe('attention')
  })

  it('respects custom thresholds', () => {
    const checks = assessImageQuality(solidPixels(32, 32, 75), 32, 32, {
      minMeanLuma: 80,
    })
    expect(checks.find((check) => check.id === 'brightness')?.status).toBe('attention')
  })

  it('never uses guarantee language', () => {
    const serialized = JSON.stringify(
      assessImageQuality(checkerboard(), 64, 64),
    ).toLowerCase()
    expect(serialized).not.toContain('guarantee')
    expect(serialized).not.toContain('official')
  })
})

describe('assessCanvasQuality', () => {
  it('analyzes downscaled canvas content and never mutates the flow on failure', () => {
    const inkPattern = createPixelCanvas(64, 64, () => false)
    const factory: CanvasFactory = (width, height) =>
      createPixelCanvas(width, height, () => false)

    const checks = assessCanvasQuality(
      inkPattern as unknown as DrawableSource,
      factory,
    )
    expect(checks).toBeDefined()
    expect(checks?.map((check) => check.id)).toEqual(['brightness', 'contrast', 'sharpness'])
  })

  it('returns undefined when the context is unavailable', () => {
    const brokenFactory: CanvasFactory = (() => ({
      width: 10,
      height: 10,
      getContext: () => null,
    })) as unknown as CanvasFactory

    const source = createPixelCanvas(32, 32, () => true)
    expect(
      assessCanvasQuality(source as unknown as DrawableSource, brokenFactory),
    ).toBeUndefined()
  })

  it('returns undefined when getImageData is missing', () => {
    const noPixelsFactory: CanvasFactory = (() =>
      ({
        width: 10,
        height: 10,
        getContext: () => ({ drawImage: vi.fn() }),
      }) as never) as unknown as CanvasFactory

    const source = createPixelCanvas(32, 32, () => false)
    expect(
      assessCanvasQuality(source as unknown as DrawableSource, noPixelsFactory),
    ).toBeUndefined()
  })
})
