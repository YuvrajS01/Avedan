import { describe, expect, it, vi } from 'vitest'
import { correctPerspective, defaultQuadForImage, clampQuad } from '../processing/perspective'

function fakeCanvasFactory(width: number, height: number) {
  const calls: unknown[] = []
  const ctx = {
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
  }
  const canvas = {
    width,
    height,
    getContext: vi.fn(() => ctx as unknown as CanvasRenderingContext2D),
    _ctx: ctx,
    _calls: calls,
  }
  return canvas as unknown as import('../processing/crop').CanvasLike
}

describe('perspective helpers (T030)', () => {
  it('creates default quad inset by 5%', () => {
    const quad = defaultQuadForImage(1000, 800)
    expect(quad.tl).toEqual({ x: 50, y: 40 })
    expect(quad.tr).toEqual({ x: 950, y: 40 })
    expect(quad.br).toEqual({ x: 950, y: 760 })
    expect(quad.bl).toEqual({ x: 50, y: 760 })
  })

  it('clamps quad inside image bounds', () => {
    const quad = {
      tl: { x: -10, y: -20 },
      tr: { x: 1010, y: -5 },
      br: { x: 1010, y: 810 },
      bl: { x: -10, y: 810 },
    }
    const clamped = clampQuad(quad, 1000, 800)
    expect(clamped.tl).toEqual({ x: 0, y: 0 })
    expect(clamped.tr).toEqual({ x: 1000, y: 0 })
    expect(clamped.br).toEqual({ x: 1000, y: 800 })
    expect(clamped.bl).toEqual({ x: 0, y: 800 })
  })

  it('correctPerspective creates a canvas of target size and draws two triangles', () => {
    const source = { width: 800, height: 600 } as unknown as import('../processing/crop').DrawableSource
    const quad = defaultQuadForImage(800, 600)
    let drawCalls = 0
    let clipCalls = 0
    const factory: typeof fakeCanvasFactory = (width, height) => {
      const ctx = {
        fillRect: vi.fn(),
        setTransform: vi.fn(),
        drawImage: vi.fn(() => {
          drawCalls += 1
        }),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(() => {
          clipCalls += 1
        }),
      }
      return {
        width,
        height,
        getContext: vi.fn(() => ctx as unknown as CanvasRenderingContext2D),
      } as unknown as import('../processing/crop').CanvasLike
    }
    const canvas = correctPerspective(source, quad, 400, 500, factory)
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(500)
    expect(drawCalls).toBe(2)
    expect(clipCalls).toBe(2)
  })

  it('handles degenerate quad gracefully (fallback to identity)', () => {
    const source = { width: 100, height: 100 } as unknown as import('../processing/crop').DrawableSource
    const degenerate: import('../processing/perspective').Quad = {
      tl: { x: 0, y: 0 },
      tr: { x: 0, y: 0 },
      br: { x: 0, y: 0 },
      bl: { x: 0, y: 0 },
    }
    const canvas = correctPerspective(source, degenerate, 200, 200, fakeCanvasFactory)
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(200)
  })
})
