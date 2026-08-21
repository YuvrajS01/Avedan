import { ProcessingError } from '../../processing/errors'

export type CameraFacing = 'user' | 'environment'

export interface CameraHandle {
  stream: MediaStream
  stop: () => void
}

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

export async function startCamera(facing: CameraFacing): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  })
  return {
    stream,
    stop: () => {
      for (const track of stream.getTracks()) track.stop()
    },
  }
}

export function attachStream(video: HTMLVideoElement, stream: MediaStream): void {
  video.srcObject = stream
}

export interface CapturedFrame {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

/** Draw the current video frame into a local canvas. Frames never leave the device. */
export function captureFrame(
  video: HTMLVideoElement,
  createCanvas: (width: number, height: number) => HTMLCanvasElement = (width, height) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  },
): CapturedFrame {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    throw new ProcessingError(
      'invalid-input',
      'The camera frame was empty. Wait for the preview to start and try again.',
    )
  }
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ProcessingError('canvas-unavailable', 'A 2D drawing context could not be created.')
  }
  ctx.drawImage(video, 0, 0, width, height)
  return { canvas, width, height }
}

/** Encode a captured frame locally into a File usable by the normal intake path. */
export function frameToFile(canvas: HTMLCanvasElement, fileName = 'camera.jpg'): Promise<File> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(
        new ProcessingError(
          'encode-failed',
          'The captured photo could not be saved. Try uploading an image instead.',
        ),
      )
      return
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new ProcessingError(
              'encode-failed',
              'The captured photo could not be saved. Try uploading an image instead.',
            ),
          )
        } else {
          resolve(new File([blob], fileName, { type: 'image/jpeg' }))
        }
      },
      'image/jpeg',
      0.95,
    )
  })
}

export function describeCameraError(error: unknown): 'denied' | 'not-found' | 'generic' {
  const name = (error as { name?: string } | null)?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') {
    return 'not-found'
  }
  return 'generic'
}
