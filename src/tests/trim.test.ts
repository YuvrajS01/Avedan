import { describe, expect, it } from 'vitest'
import { computeInkBounds } from '../processing/trim'

function makePixels(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number, number],
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = paint(x, y)
      const i = (y * width + x) * 4
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
      pixels[i + 3] = a
    }
  }
  return pixels
}

const WHITE: [number, number, number, number] = [255, 255, 255, 255]
const BLACK: [number, number, number, number] = [20, 20, 20, 255]

describe('computeInkBounds', () => {
  it('returns null for an all-white image', () => {
    const pixels = makePixels(10, 10, () => WHITE)
    expect(computeInkBounds(pixels, 10, 10)).toBeNull()
  })

  it('returns null for a fully transparent image', () => {
    const pixels = makePixels(10, 10, () => [0, 0, 0, 0])
    expect(computeInkBounds(pixels, 10, 10)).toBeNull()
  })

  it('finds a single ink pixel', () => {
    const pixels = makePixels(10, 10, (x, y) =>
      x === 4 && y === 7 ? BLACK : WHITE,
    )
    expect(computeInkBounds(pixels, 10, 10)).toEqual({
      x: 4,
      y: 7,
      width: 1,
      height: 1,
    })
  })

  it('bounds ink at opposite corners', () => {
    const pixels = makePixels(20, 10, (x, y) =>
      (x < 2 && y < 2) || (x > 17 && y > 7) ? BLACK : WHITE,
    )
    expect(computeInkBounds(pixels, 20, 10)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 10,
    })
  })

  it('trims margins tightly around centered content', () => {
    const pixels = makePixels(30, 20, (x, y) =>
      x >= 10 && x <= 19 && y >= 5 && y <= 14 ? BLACK : WHITE,
    )
    expect(computeInkBounds(pixels, 30, 20)).toEqual({
      x: 10,
      y: 5,
      width: 10,
      height: 10,
    })
  })

  it('treats anti-aliased gray below the threshold as ink', () => {
    const pixels = makePixels(5, 5, (x) =>
      x === 2 ? [180, 180, 180, 255] : WHITE,
    )
    expect(computeInkBounds(pixels, 5, 5)).toEqual({ x: 2, y: 0, width: 1, height: 5 })
  })

  it('ignores near-white pixels above the threshold', () => {
    const pixels = makePixels(5, 5, (x) =>
      x === 2 ? [252, 252, 252, 255] : WHITE,
    )
    expect(computeInkBounds(pixels, 5, 5)).toBeNull()
  })

  it('honors a custom luminance threshold', () => {
    const pixels = makePixels(5, 5, (x) =>
      x === 1 ? [200, 200, 200, 255] : WHITE,
    )
    expect(computeInkBounds(pixels, 5, 5, { maxLuminance: 190 })).toBeNull()
    expect(computeInkBounds(pixels, 5, 5, { maxLuminance: 210 })).not.toBeNull()
  })

  it('counts opaque dark ink on transparent backgrounds', () => {
    const pixels = makePixels(6, 6, (x, y) =>
      x >= 3 && y >= 3 ? BLACK : [0, 0, 0, 0],
    )
    expect(computeInkBounds(pixels, 6, 6)).toEqual({
      x: 3,
      y: 3,
      width: 3,
      height: 3,
    })
  })

  it('handles very small inputs', () => {
    const one = makePixels(1, 1, () => BLACK)
    expect(computeInkBounds(one, 1, 1)).toEqual({ x: 0, y: 0, width: 1, height: 1 })
    expect(computeInkBounds(makePixels(1, 1, () => WHITE), 1, 1)).toBeNull()
  })
})

import { vi } from 'vitest'
import { trimToCanvas } from '../processing/trim'
import type { CanvasFactory, DrawableSource } from '../processing/crop'
import { createPixelCanvas, type FakeCanvas } from './fakes'

describe('trimToCanvas', () => {
  const isInk = (x: number, y: number) => x >= 5 && x < 15 && y >= 2 && y < 8

  function inkFactory() {
    const canvases: FakeCanvas[] = []
    const factory: CanvasFactory = (width, height) => {
      const canvas = createPixelCanvas(width, height, (x, y) =>
        width === 20 && height === 10 ? !isInk(x, y) : true,
      )
      canvases.push(canvas as FakeCanvas)
      return canvas
    }
    return { factory, canvases }
  }

  it('crops to the ink bounding box', () => {
    const { factory, canvases } = inkFactory()
    const source = createPixelCanvas(20, 10, (x, y) => !isInk(x, y))

    const trimmed = trimToCanvas(source as unknown as DrawableSource, factory)

    expect(trimmed.width).toBe(10)
    expect(trimmed.height).toBe(6)
    expect(canvases[1].ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      5,
      2,
      10,
      6,
      0,
      0,
      10,
      6,
    )
  })

  it('rejects signatures without any ink', () => {
    const blank = createPixelCanvas(20, 10, () => true)
    const whiteFactory: CanvasFactory = (width, height) =>
      createPixelCanvas(width, height, () => true)

    expect(() =>
      trimToCanvas(blank as unknown as DrawableSource, whiteFactory),
    ).toThrowError(/no signature content/i)
  })

  it('throws when pixel data cannot be read', () => {
    const brokenFactory: CanvasFactory = vi.fn((width, height) =>
      createFakeCanvasWithoutPixels(width, height),
    )
    const source = createPixelCanvas(4, 4, () => false)

    expect(() => trimToCanvas(source as unknown as DrawableSource, brokenFactory)).toThrowError(
      /pixel data/i,
    )
  })

  function createFakeCanvasWithoutPixels(width: number, height: number) {
    return {
      width,
      height,
      getContext: () => ({ drawImage: vi.fn() }),
    } as never
  }
})
