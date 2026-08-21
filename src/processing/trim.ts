import { cropToCanvas, defaultCanvasFactory, type CanvasFactory, type CanvasLike, type DrawableSource } from './crop'
import { ProcessingError } from './errors'

export interface TrimOptions {
  /** Luminance (0–255) at or below which a pixel counts as ink. */
  maxLuminance?: number
  /** Alpha (0–255) at or above which a pixel can count as ink. */
  minAlpha?: number
}

export interface InkBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Bounding box of "ink" (dark or opaque pixels) in an RGBA pixel buffer.
 * Returns null when the input contains no ink at all.
 */
export function computeInkBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: TrimOptions = {},
): InkBounds | null {
  const maxLuminance = options.maxLuminance ?? 245
  const minAlpha = options.minAlpha ?? 8

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (pixels[i + 3] < minAlpha) continue
      const luminance =
        0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]
      if (luminance <= maxLuminance) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/**
 * Render `source` and crop away empty margins around the ink.
 * Throws `invalid-input` when no content is found (empty signature).
 */
export function trimToCanvas(
  source: DrawableSource,
  createCanvas: CanvasFactory = defaultCanvasFactory,
  options: TrimOptions = {},
): CanvasLike {
  const work = createCanvas(source.width, source.height)
  const ctx = work.getContext('2d')
  if (!ctx) {
    throw new ProcessingError('canvas-unavailable', 'A 2D drawing context could not be created.')
  }
  if (typeof ctx.getImageData !== 'function') {
    throw new ProcessingError('canvas-unavailable', 'Pixel data could not be read.')
  }

  ctx.drawImage(source, 0, 0)
  const image = ctx.getImageData(0, 0, source.width, source.height)
  const bounds = computeInkBounds(image.data, source.width, source.height, options)

  if (!bounds) {
    throw new ProcessingError(
      'invalid-input',
      'No signature content was found. Draw or upload a signature with visible ink.',
    )
  }

  return cropToCanvas(work as unknown as DrawableSource, bounds, createCanvas)
}
