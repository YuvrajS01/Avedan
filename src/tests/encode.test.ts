import { describe, expect, it, vi } from 'vitest'
import { ProcessingError } from '../processing/errors'
import { encodeCanvas, MIME_BY_FORMAT } from '../processing/encode'
import type { CanvasLike } from '../processing/crop'

function canvasWithBlob(
  respond: (callback: (blob: Blob | null) => void) => void,
): CanvasLike & { toBlob: HTMLCanvasElement['toBlob'] } {
  return {
    width: 100,
    height: 100,
    getContext: () => null,
    toBlob: vi.fn((callback) => {
      respond(callback as (blob: Blob | null) => void)
    }),
  } as unknown as CanvasLike & { toBlob: HTMLCanvasElement['toBlob'] }
}

describe('encodeCanvas', () => {
  it('resolves with the produced blob and requests the right MIME type', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
    const canvas = canvasWithBlob((cb) => cb(blob))

    const result = await encodeCanvas(canvas, 'jpeg', 0.8)

    expect(result).toBe(blob)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8)
  })

  it('maps each format to its MIME type', () => {
    expect(MIME_BY_FORMAT.jpeg).toBe('image/jpeg')
    expect(MIME_BY_FORMAT.png).toBe('image/png')
    expect(MIME_BY_FORMAT.webp).toBe('image/webp')
  })

  it('omits quality for lossless PNG', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const canvas = canvasWithBlob((cb) => cb(blob))

    await encodeCanvas(canvas, 'png')

    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined)
  })

  it('rejects with a friendly error when encoding yields no blob', async () => {
    const canvas = canvasWithBlob((cb) => cb(null))

    await expect(encodeCanvas(canvas, 'webp')).rejects.toMatchObject({
      code: 'encode-failed',
      message: expect.stringContaining('WEBP'),
    } satisfies Partial<ProcessingError>)
  })

  it('rejects when the canvas cannot encode at all', async () => {
    const canvas = {
      width: 10,
      height: 10,
      getContext: () => null,
    } as unknown as CanvasLike & { toBlob: HTMLCanvasElement['toBlob'] }

    await expect(encodeCanvas(canvas, 'jpeg')).rejects.toMatchObject({
      code: 'encode-failed',
    } satisfies Partial<ProcessingError>)
  })

  it('encodes via convertToBlob when only OffscreenCanvas-style export exists', async () => {
    const blob = new Blob([new Uint8Array([7])], { type: 'image/webp' })
    const convertToBlob = vi.fn(async () => blob)
    const canvas = {
      width: 64,
      height: 64,
      getContext: () => null,
      convertToBlob,
    }

    const result = await encodeCanvas(canvas as never, 'webp', 0.75)

    expect(result).toBe(blob)
    expect(convertToBlob).toHaveBeenCalledWith({
      type: 'image/webp',
      quality: 0.75,
    })
  })

  it('omits quality on convertToBlob for lossless PNG', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const convertToBlob = vi.fn(async () => blob)
    const canvas = {
      width: 8,
      height: 8,
      getContext: () => null,
      convertToBlob,
    }

    await encodeCanvas(canvas as never, 'png')

    expect(convertToBlob).toHaveBeenCalledWith({
      type: 'image/png',
      quality: undefined,
    })
  })
})
