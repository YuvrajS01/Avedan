import { describe, expect, it } from 'vitest'
import { resizeToCanvas } from '../processing/resize'
import { createRecordingFactory, fakeSource } from './fakes'

describe('resizeToCanvas', () => {
  it('produces the exact requested dimensions', () => {
    const { factory, canvases } = createRecordingFactory()

    const canvas = resizeToCanvas(fakeSource(1000, 800), { width: 413, height: 531 }, factory)

    expect(canvas.width).toBe(413)
    expect(canvas.height).toBe(531)
    expect(canvases[canvases.length - 1].ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      expect.any(Number),
      expect.any(Number),
      0,
      0,
      413,
      531,
    )
  })

  it('downscales in halving steps for large reductions', () => {
    const { factory, canvases } = createRecordingFactory()

    resizeToCanvas(fakeSource(1000, 800), { width: 100, height: 100 }, factory)

    const stepSizes = canvases.map((c) => `${c.width}x${c.height}`)
    expect(stepSizes).toEqual(['500x400', '250x200', '100x100'])
  })

  it('skips intermediate steps for small reductions', () => {
    const { factory, canvases } = createRecordingFactory()

    resizeToCanvas(fakeSource(300, 300), { width: 200, height: 200 }, factory)

    expect(canvases).toHaveLength(1)
    expect(canvases[0].width).toBe(200)
    expect(canvases[0].height).toBe(200)
  })

  it('never produces a zero-sized canvas', () => {
    const { factory, canvases } = createRecordingFactory()

    resizeToCanvas(fakeSource(3, 3), { width: 1, height: 1 }, factory)

    for (const canvas of canvases) {
      expect(canvas.width).toBeGreaterThanOrEqual(1)
      expect(canvas.height).toBeGreaterThanOrEqual(1)
    }
  })

  it('keeps source dimensions when target equals source', () => {
    const { factory, canvases } = createRecordingFactory()

    const canvas = resizeToCanvas(fakeSource(320, 240), { width: 320, height: 240 }, factory)

    expect(canvases).toHaveLength(1)
    expect(canvas.width).toBe(320)
    expect(canvas.height).toBe(240)
  })
})
