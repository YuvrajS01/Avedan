import { describe, expect, it } from 'vitest'
import { ProcessingError } from '../processing/errors'
import { computeCropRect } from '../processing/geometry'
import { cropToAspectRatio, cropToCanvas, type CanvasFactory } from '../processing/crop'
import { createRecordingFactory, fakeSource } from './fakes'

describe('cropToCanvas', () => {
  it('draws the source rect into a canvas of the rect size', () => {
    const { factory, canvases } = createRecordingFactory()
    const rect = { x: 10, y: 20, width: 300, height: 400 }

    const canvas = cropToCanvas(fakeSource(1000, 800), rect, factory)

    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(400)
    expect(canvases).toHaveLength(1)
    expect(canvases[0].ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      10,
      20,
      300,
      400,
      0,
      0,
      300,
      400,
    )
  })

  it('rejects non-positive crop dimensions', () => {
    const { factory } = createRecordingFactory()
    expect(() => cropToCanvas(fakeSource(100, 100), { x: 0, y: 0, width: 0, height: 10 }, factory)).toThrow(
      ProcessingError,
    )
  })

  it('throws when no 2D context is available', () => {
    const brokenFactory: CanvasFactory = () =>
      ({
        width: 5,
        height: 5,
        getContext: () => null,
      }) as never

    expect(() =>
      cropToCanvas(fakeSource(100, 100), { x: 0, y: 0, width: 5, height: 5 }, brokenFactory),
    ).toThrowError(/drawing context/i)
  })
})

describe('cropToAspectRatio', () => {
  it('produces a canvas matching the requested aspect ratio', () => {
    const { factory, canvases } = createRecordingFactory()
    const canvas = cropToAspectRatio(fakeSource(1000, 500), 3 / 4, undefined, factory)

    expect(canvas.width / canvas.height).toBeCloseTo(3 / 4, 2)
    const expectedRect = computeCropRect(1000, 500, 3 / 4)
    expect(canvases[0].ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expectedRect.x,
      expectedRect.y,
      expectedRect.width,
      expectedRect.height,
      0,
      0,
      expectedRect.width,
      expectedRect.height,
    )
  })

  it('keeps a square source intact for a square ratio', () => {
    const { factory } = createRecordingFactory()
    const canvas = cropToAspectRatio(fakeSource(200, 200), 1, undefined, factory)
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(200)
  })
})
