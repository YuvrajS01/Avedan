import { describe, expect, it, vi } from 'vitest'
import {
  assessBackground,
  assessCanvasBackground,
  whitenBackground,
} from '../processing/background'
import type { CanvasFactory, CanvasLike, DrawableSource } from '../processing/crop'

type Rgb = [number, number, number]

const asSource = (canvas: unknown) => canvas as DrawableSource

/** A factory that always hands back one prepared fake canvas. */
const factoryOf = (c: ColorCanvas): CanvasFactory => () => c.canvas

interface ColorCanvas {
  canvas: CanvasLike
  /** Buffer as last read by getImageData. */
  data: Uint8ClampedArray
  /** Buffer as written by putImageData (the processing output). */
  out: Uint8ClampedArray
}

function createColorCanvas(
  width: number,
  height: number,
  colorAt: (x: number, y: number) => Rgb,
): ColorCanvas {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const [r, g, b] = colorAt(x, y)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  const out = new Uint8ClampedArray(data)
  const ctx = {
    drawImage: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'high',
    getImageData: vi.fn(() => ({ data, width, height })),
    putImageData: vi.fn((image: { data: Uint8ClampedArray }) => {
      out.set(image.data)
    }),
  }
  const canvas = {
    width,
    height,
    getContext: vi.fn(() => ctx),
  } as unknown as CanvasLike
  return { canvas, data, out }
}

const WHITE: Rgb = [255, 255, 255]
const DARK: Rgb = [20, 20, 20]

describe('assessBackground', () => {
  it('calls a plain light backdrop plain', () => {
    // White everywhere except a centered dark subject.
    const pixels = new Uint8ClampedArray(100 * 100 * 4)
    for (let p = 0; p < 100 * 100; p++) {
      const i = p * 4
      pixels[i] = 255
      pixels[i + 1] = 255
      pixels[i + 2] = 255
      pixels[i + 3] = 255
    }
    for (let y = 40; y < 60; y++) {
      for (let x = 40; x < 60; x++) {
        const i = (y * 100 + x) * 4
        pixels[i] = DARK[0]
        pixels[i + 1] = DARK[1]
        pixels[i + 2] = DARK[2]
      }
    }
    const result = assessBackground(pixels, 100, 100)
    expect(result.plain).toBe(true)
    expect(result.uniformity).toBeGreaterThan(0.9)
  })

  it('rejects a noisy backdrop', () => {
    // Alternating black/white checkerboard border — nothing near the mean.
    const pixels = new Uint8ClampedArray(100 * 100 * 4)
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        const i = (y * 100 + x) * 4
        const v = (x + y) % 2 === 0 ? 255 : 10
        pixels[i] = v
        pixels[i + 1] = v
        pixels[i + 2] = v
        pixels[i + 3] = 255
      }
    }
    const result = assessBackground(pixels, 100, 100)
    expect(result.plain).toBe(false)
  })

  it('throws on degenerate dimensions', () => {
    const pixels = new Uint8ClampedArray(4)
    expect(() => assessBackground(pixels, 0, 10)).toThrow()
    expect(() => assessBackground(pixels, 10, -1)).toThrow()
  })
})

describe('assessCanvasBackground', () => {
  it('reports ok for a plain backdrop', () => {
    const color = createColorCanvas(80, 80, () => [245, 245, 245])
    const check = assessCanvasBackground(asSource({ ...color.canvas, width: 80, height: 80 }), factoryOf(color))
    expect(check?.status).toBe('ok')
  })

  it('warns on a busy backdrop', () => {
    const color = createColorCanvas(80, 80, (x, y) =>
      ((x >> 2) + (y >> 2)) % 2 === 0 ? WHITE : DARK,
    )
    const check = assessCanvasBackground(asSource(color.canvas), factoryOf(color))
    expect(check?.status).toBe('attention')
  })

  it('returns undefined instead of throwing without pixel access', () => {
    const source = {
      width: 10,
      height: 10,
    } as unknown as DrawableSource
    const nullFactory: CanvasFactory = () =>
      ({ width: 10, height: 10, getContext: () => null }) as unknown as CanvasLike
    expect(assessCanvasBackground(source, nullFactory)).toBeUndefined()
  })
})

describe('whitenBackground', () => {
  function photoCanvas(): ColorCanvas {
    return createColorCanvas(60, 60, (x, y) =>
      x >= 20 && x < 40 && y >= 20 && y < 40 ? DARK : [248, 248, 248],
    )
  }

  it('whitens connected background regions but keeps the subject', () => {
    const color = photoCanvas()
    const { out } = color
    whitenBackground(asSource(color.canvas), factoryOf(color))

    // Border became pure white…
    const corner = (0 * 60 + 0) * 4
    expect([out[corner], out[corner + 1], out[corner + 2]]).toEqual([255, 255, 255])
    // …and the dark subject survived untouched.
    const center = (30 * 60 + 30) * 4
    expect([out[center], out[center + 1], out[center + 2]]).toEqual([...DARK])
  })

  it('does not leak into enclosed regions of a different color', () => {
    // Dark ring fully enclosing a mid-gray area: gray must stay untouched.
    const color = createColorCanvas(50, 50, (x, y) => {
      if (x >= 15 && x < 35 && y >= 15 && y < 35) return [120, 120, 120]
      if (x >= 10 && x < 40 && y >= 10 && y < 40) return DARK
      return [250, 250, 250]
    })
    whitenBackground(asSource(color.canvas), factoryOf(color), { tolerance: 20 })
    const { out } = color

    const enclosed = (25 * 50 + 25) * 4
    expect(out[enclosed]).toBe(120)
  })

  it('throws when the canvas has no pixel access', () => {
    const canvas = {
      width: 10,
      height: 10,
      getContext: () => null,
    } as unknown as CanvasLike
    expect(() => whitenBackground(asSource(canvas))).toThrow(/pixel/i)
  })

  it('validates tolerance', () => {
    const color = photoCanvas()
    expect(() => whitenBackground(asSource(color.canvas), factoryOf(color), { tolerance: 0 })).toThrow(/tolerance/i)
  })
})
