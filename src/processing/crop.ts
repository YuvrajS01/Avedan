import { ProcessingError } from './errors'
import { computeCropRect, type FocusPoint, type Rect } from './geometry'

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
}

export type CanvasFactory = (width: number, height: number) => CanvasLike

/**
 * Create a canvas in whichever runtime is available: a document canvas on
 * the main thread, an OffscreenCanvas inside a worker (T018).
 */
export function defaultCanvasFactory(width: number, height: number): CanvasLike {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height) as unknown as CanvasLike
  }
  throw new ProcessingError(
    'canvas-unavailable',
    'No canvas implementation is available in this environment.',
  )
}

export type DrawableSource = CanvasImageSource & { width: number; height: number }

export function drawWithContext(
  canvas: CanvasLike,
  draw: (ctx: CanvasRenderingContext2D) => void,
): CanvasLike {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ProcessingError('canvas-unavailable', 'A 2D drawing context could not be created.')
  }
  ctx.imageSmoothingEnabled = true
  if ('imageSmoothingQuality' in ctx) {
    ctx.imageSmoothingQuality = 'high'
  }
  draw(ctx)
  return canvas
}

/** Crop `source` to `rect` into a new canvas of exactly the rect size. */
export function cropToCanvas(
  source: DrawableSource,
  rect: Rect,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): CanvasLike {
  if (rect.width <= 0 || rect.height <= 0) {
    throw new ProcessingError('invalid-input', 'Crop dimensions must be positive')
  }
  return drawWithContext(createCanvas(rect.width, rect.height), (ctx) => {
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
  })
}

/**
 * Crop `source` to the requested aspect ratio and return the cropped canvas.
 */
export function cropToAspectRatio(
  source: DrawableSource,
  aspectRatio: number,
  focus?: FocusPoint,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): CanvasLike {
  const rect = computeCropRect(source.width, source.height, aspectRatio, focus)
  return cropToCanvas(source, rect, createCanvas)
}
