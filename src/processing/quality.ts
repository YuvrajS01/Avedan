import { defaultCanvasFactory, type CanvasFactory, type DrawableSource } from './crop'

export type QualityStatus = 'ok' | 'attention'

export interface QualityCheck {
  id: string
  label: string
  status: QualityStatus
  details?: string
}

export interface QualityOptions {
  /** Mean luminance below this is reported as too dark (0–255). */
  minMeanLuma?: number
  /** Mean luminance above this is reported as too bright (0–255). */
  maxMeanLuma?: number
  /** Luminance stddev below this is reported as low contrast. */
  minLumaStdDev?: number
  /** Laplacian variance below this suggests blur. */
  minSharpness?: number
}

/** Documented advisory thresholds (not hard requirements). */
const DEFAULTS = {
  minMeanLuma: 60,
  maxMeanLuma: 205,
  minLumaStdDev: 18,
  minSharpness: 25,
}

export function toLuma(pixels: Uint8ClampedArray): number[] {
  const luma: number[] = new Array(pixels.length / 4)
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    luma[p] = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]
  }
  return luma
}

export function lumaStatistics(luma: number[]): { mean: number; stdDev: number } {
  if (luma.length === 0) return { mean: 0, stdDev: 0 }
  let sum = 0
  for (const value of luma) sum += value
  const mean = sum / luma.length
  let varianceSum = 0
  for (const value of luma) {
    const delta = value - mean
    varianceSum += delta * delta
  }
  return { mean, stdDev: Math.sqrt(varianceSum / luma.length) }
}

/**
 * Variance of the 4-neighbour Laplacian over grayscale samples — a standard
 * sharpness estimate. Flat/blurry areas produce low variance.
 */
export function laplacianVariance(luma: number[], width: number, height: number): number {
  if (width < 3 || height < 3) return 0

  let sum = 0
  let squaredSum = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const laplacian =
        4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - width] - luma[i + width]
      sum += laplacian
      squaredSum += laplacian * laplacian
      count++
    }
  }

  if (count === 0) return 0
  const mean = sum / count
  return squaredSum / count - mean * mean
}

/**
 * Advisory-only image quality checks for portrait photos. Deterministic,
 * fully local, and never part of the technical pass/fail result.
 */
export function assessImageQuality(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: QualityOptions = {},
): QualityCheck[] {
  const limits = { ...DEFAULTS, ...options }
  const luma = toLuma(pixels)
  const { mean, stdDev } = lumaStatistics(luma)
  const sharpness = laplacianVariance(luma, width, height)

  const checks: QualityCheck[] = []

  if (mean < limits.minMeanLuma) {
    checks.push({
      id: 'brightness',
      label: 'The photo looks dark',
      status: 'attention',
      details: 'More even lighting usually produces a better result.',
    })
  } else if (mean > limits.maxMeanLuma) {
    checks.push({
      id: 'brightness',
      label: 'The photo looks very bright',
      status: 'attention',
      details: 'Slightly shaded, even lighting usually works better.',
    })
  } else {
    checks.push({ id: 'brightness', label: 'Lighting looks reasonable', status: 'ok' })
  }

  if (stdDev < limits.minLumaStdDev) {
    checks.push({
      id: 'contrast',
      label: 'The photo looks flat or washed out',
      status: 'attention',
      details: 'A plainer background with clearer subject separation helps.',
    })
  } else {
    checks.push({ id: 'contrast', label: 'Contrast looks reasonable', status: 'ok' })
  }

  if (sharpness < limits.minSharpness) {
    checks.push({
      id: 'sharpness',
      label: 'The photo may be blurry',
      status: 'attention',
      details: 'Hold the camera steady and focus on the eyes if possible.',
    })
  } else {
    checks.push({ id: 'sharpness', label: 'Sharpness looks acceptable', status: 'ok' })
  }

  return checks
}

/**
 * Best-effort quality assessment of a rendered canvas. Any failure returns
 * undefined so the core processing flow is never affected (D007).
 */
export function assessCanvasQuality(
  source: DrawableSource,
  createCanvas: CanvasFactory = defaultCanvasFactory,
  options: QualityOptions = {},
): QualityCheck[] | undefined {
  try {
    const longest = Math.max(source.width, source.height)
    const scale = longest > 0 ? Math.min(1, 256 / longest) : 1
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))

    const work = createCanvas(width, height)
    const ctx = work.getContext('2d')
    if (!ctx || typeof ctx.getImageData !== 'function') return undefined

    ctx.drawImage(source, 0, 0, width, height)
    const image = ctx.getImageData(0, 0, width, height)
    return assessImageQuality(image.data, width, height, options)
  } catch {
    return undefined
  }
}
