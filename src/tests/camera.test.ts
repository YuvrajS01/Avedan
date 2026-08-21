import { describe, expect, it, vi } from 'vitest'
import { ProcessingError } from '../processing/errors'
import {
  captureFrame,
  describeCameraError,
  frameToFile,
  isCameraSupported,
} from '../features/camera/camera'
import { createRecordingFactory } from './fakes'

describe('isCameraSupported', () => {
  it('is false when mediaDevices is unavailable', () => {
    expect(isCameraSupported()).toBe(false)
  })
})

describe('captureFrame', () => {
  it('draws the video at its intrinsic size', () => {
    const { factory, canvases } = createRecordingFactory()
    const video = { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement

    const frame = captureFrame(video, factory as never)

    expect(frame.width).toBe(1920)
    expect(frame.height).toBe(1080)
    expect(canvases[0].width).toBe(1920)
    expect(canvases[0].height).toBe(1080)
    expect(canvases[0].ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080)
  })

  it('rejects empty frames', () => {
    const { factory } = createRecordingFactory()
    const video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement

    expect(() => captureFrame(video, factory as never)).toThrowError(/frame was empty/i)
  })

  it('throws a typed error for missing frames', () => {
    const { factory } = createRecordingFactory()
    const video = { videoWidth: 640, videoHeight: 0 } as HTMLVideoElement
    try {
      captureFrame(video, factory as never)
      expect.unreachable()
    } catch (error) {
      expect((error as ProcessingError).code).toBe('invalid-input')
    }
  })
})

describe('frameToFile', () => {
  function canvasWithBlob(blob: Blob | null) {
    return {
      width: 100,
      height: 100,
      getContext: () => null,
      toBlob: vi.fn((callback: (b: Blob | null) => void) => callback(blob)),
    } as unknown as HTMLCanvasElement
  }

  it('wraps the encoded blob in a JPEG file', async () => {
    const blob = new Blob([new Uint8Array(10)], { type: 'image/jpeg' })
    const file = await frameToFile(canvasWithBlob(blob))
    expect(file.name).toBe('camera.jpg')
    expect(file.type).toBe('image/jpeg')
    expect(file.size).toBe(10)
  })

  it('rejects with an actionable message when encoding fails', async () => {
    await expect(frameToFile(canvasWithBlob(null))).rejects.toMatchObject({
      code: 'encode-failed',
    } satisfies Partial<ProcessingError>)
  })
})

describe('describeCameraError', () => {
  it('classifies permission and hardware failures', () => {
    expect(describeCameraError({ name: 'NotAllowedError' })).toBe('denied')
    expect(describeCameraError({ name: 'SecurityError' })).toBe('denied')
    expect(describeCameraError({ name: 'NotFoundError' })).toBe('not-found')
    expect(describeCameraError({ name: 'NotReadableError' })).toBe('not-found')
    expect(describeCameraError(new Error('boom'))).toBe('generic')
    expect(describeCameraError(null)).toBe('generic')
  })
})
