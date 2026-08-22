import { defaultCanvasFactory, drawWithContext, type CanvasFactory, type CanvasLike, type DrawableSource } from './crop'
import { ProcessingError } from './errors'

/**
 * Background quality detection and white-background processing (V2, T014).
 *
 * Deterministic pixel heuristics only — no ML segmentation. The uniformity
 * metric is advisory; whitening is opt-in per job and never fabricates
 * compliance (imperfect results are reported as hints, not guarantees).
 */

export interface BackgroundAssessment {
  /** Fraction of border pixels close to the border mean color (0–1). */
  uniformity: number
  /** True when `uniformity` reaches the configured plainness threshold. */
  plain: boolean
  meanColor: [number, number, number]
}

export interface AssessBackgroundOptions {
  /** Thickness of the sampled border band as a fraction of the smaller side. */
  borderWidthRatio?: number
  /** RGB distance under which a border pixel counts as "close to mean". */
  colorDistanceThreshold?: number
  /** Uniformity fraction required to call the background plain. */
  plainThreshold?: number
}

const DEFAULTS = {
  borderWidthRatio: 0.08,
  colorDistanceThreshold: 30,
  plainThreshold: 0.6,
}

function rgbDistance(
  r: number,
  g: number,
  b: number,
  mean: [number, number, number],
): number {
  return Math.sqrt((r - mean[0]) ** 2 + (g - mean[1]) ** 2 + (b - mean[2]) ** 2)
}

/** Border-band uniformity of an RGBA buffer: high means a plain backdrop. */
export function assessBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: AssessBackgroundOptions = {},
): BackgroundAssessment {
  const limits = { ...DEFAULTS, ...options }
  if (width <= 0 || height <= 0) {
    throw new ProcessingError('invalid-input', 'Image dimensions must be positive')
  }

  const band = Math.max(
    1,
    Math.round(Math.min(width, height) * limits.borderWidthRatio),
  )
  const isBorder = (x: number, y: number) =>
    x < band || y < band || x >= width - band || y >= height - band

  let count = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isBorder(x, y)) continue
      const i = (y * width + x) * 4
      sumR += pixels[i]
      sumG += pixels[i + 1]
      sumB += pixels[i + 2]
      count++
    }
  }
  if (count === 0) {
    throw new ProcessingError('invalid-input', 'No border pixels found')
  }

  const meanColor: [number, number, number] = [
    sumR / count,
    sumG / count,
    sumB / count,
  ]

  let nearMean = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isBorder(x, y)) continue
      const i = (y * width + x) * 4
      if (rgbDistance(pixels[i], pixels[i + 1], pixels[i + 2], meanColor) <= limits.colorDistanceThreshold) {
        nearMean++
      }
    }
  }

  const uniformity = nearMean / count
  return { uniformity, plain: uniformity >= limits.plainThreshold, meanColor }
}

/**
 * Lighten every background-like region connected to the image border toward
 * pure white. Subject pixels darker/different than the border mean stay
 * untouched because they fall outside the tolerance.
 */
export function whitenBackground(
  source: DrawableSource,
  createCanvas: CanvasFactory = defaultCanvasFactory,
  options: { tolerance?: number } = {},
): CanvasLike {
  const tolerance = options.tolerance ?? 32
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new ProcessingError('invalid-input', 'Tolerance must be a positive number')
  }

  const canvas = drawWithContext(createCanvas(source.width, source.height), (ctx) => {
    ctx.drawImage(source, 0, 0, source.width, source.height)
  })
  const ctx = canvas.getContext('2d')
  if (!ctx || typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') {
    throw new ProcessingError('canvas-unavailable', 'Pixel data could not be processed.')
  }

  const width = source.width
  const height = source.height
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data

  const assessment = assessBackground(data, width, height)
  const mean = assessment.meanColor

  // Flood fill from every border pixel that looks like background.
  const visited = new Uint8Array(width * height)
  const stack: number[] = []
  const pushIfBackground = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    const i = p * 4
    if (rgbDistance(data[i], data[i + 1], data[i + 2], mean) > tolerance) return
    visited[p] = 1
    stack.push(p)
  }
  for (let x = 0; x < width; x++) {
    pushIfBackground(x, 0)
    pushIfBackground(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    pushIfBackground(0, y)
    pushIfBackground(width - 1, y)
  }

  while (stack.length > 0) {
    const p = stack.pop() as number
    const i = p * 4
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
    data[i + 3] = 255
    const x = p % width
    const y = Math.floor(p / width)
    pushIfBackground(x - 1, y)
    pushIfBackground(x + 1, y)
    pushIfBackground(x, y - 1)
    pushIfBackground(x, y + 1)
  }

  ctx.putImageData(image, 0, 0)
  return canvas
}

export interface CanvasBackgroundCheck {
  id: string
  label: string
  status: 'ok' | 'attention'
  details?: string
}

/** Best-effort advisory check of a rendered canvas; never throws (D007/D034). */
export function assessCanvasBackground(
  source: DrawableSource,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): CanvasBackgroundCheck | undefined {
  try {
    const work = drawWithContext(createCanvas(source.width, source.height), (ctx) => {
      ctx.drawImage(source, 0, 0, source.width, source.height)
    })
    const ctx = work.getContext('2d')
    if (!ctx || typeof ctx.getImageData !== 'function') return undefined
    const image = ctx.getImageData(0, 0, source.width, source.height)
    const assessment = assessBackground(image.data, source.width, source.height)
    return assessment.plain
      ? { id: 'background', label: 'Background looks plain', status: 'ok' }
      : {
          id: 'background',
          label: 'The background looks busy or uneven',
          status: 'attention',
          details: 'A smooth, evenly lit wall usually works best.',
        }
  } catch {
    return undefined
  }
}
