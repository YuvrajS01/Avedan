import type { FileSizeRange } from '../domain/requirements/types'
import { ProcessingError } from './errors'
import { encodeCanvas, type OutputFormat } from './encode'
import { resizeToCanvas } from './resize'
import type { CanvasLike, DrawableSource } from './crop'

export type EncodeAt = (quality: number, scale: number) => Promise<Blob>

export interface OptimizeOptions {
  fileSize?: FileSizeRange
  minQuality?: number
  maxQuality?: number
  /** Search stops when the feasible quality interval is narrower than this. */
  qualityEpsilon?: number
  /** Upper bound on binary-search probes per scale. */
  maxSearchSteps?: number
  /** Quality used when no file-size constraints exist. */
  defaultQuality?: number
  /**
   * Scales tried in order when constraints cannot be met. Only provide
   * values below 1 when the requirements allow reduced dimensions.
   */
  allowedScales?: number[]
}

export type OptimizationOutcome = 'ok' | 'too-large' | 'too-small'

export interface OptimizationResult {
  blob: Blob
  quality: number
  scale: number
  sizeBytes: number
  attempts: number
  outcome: OptimizationOutcome
}

interface Candidate {
  blob: Blob
  quality: number
  scale: number
  sizeBytes: number
}

const DEFAULT_MIN_QUALITY = 0.3
const DEFAULT_MAX_QUALITY = 0.95
const DEFAULT_EPSILON = 0.01
const DEFAULT_MAX_STEPS = 8
const DEFAULT_QUALITY = 0.92

function assertValidRange(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new ProcessingError('invalid-input', `${name} must be a non-negative finite number`)
  }
}

async function measure(
  encodeAt: EncodeAt,
  quality: number,
  scale: number,
): Promise<Candidate> {
  const blob = await encodeAt(quality, scale)
  return { blob, quality, scale, sizeBytes: blob.size }
}

function smaller(a: Candidate, b: Candidate | null): Candidate {
  if (!b || a.sizeBytes < b.sizeBytes) return a
  return b
}

/**
 * Find the highest practical encode quality satisfying the file-size
 * constraints. Size is assumed monotonic in quality (true for JPEG/WebP).
 *
 * - `maxBytes`: never exceed; maximize quality under the limit.
 * - `targetBytes`: stay under the target with maximum quality.
 * - `minBytes`: reject results below the minimum rather than padding.
 * - `allowedScales`: dimension reductions tried in order, only when the
 *   requirements permit changing dimensions.
 */
export async function optimizeEncoding(
  encodeAt: EncodeAt,
  options: OptimizeOptions = {},
): Promise<OptimizationResult> {
  const minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY
  const maxQuality = options.maxQuality ?? DEFAULT_MAX_QUALITY
  const epsilon = options.qualityEpsilon ?? DEFAULT_EPSILON
  const maxSteps = options.maxSearchSteps ?? DEFAULT_MAX_STEPS
  const defaultQuality = options.defaultQuality ?? DEFAULT_QUALITY

  if (
    !Number.isFinite(minQuality) ||
    !Number.isFinite(maxQuality) ||
    minQuality <= 0 ||
    maxQuality > 1 ||
    minQuality > maxQuality
  ) {
    throw new ProcessingError(
      'invalid-input',
      'Quality bounds must satisfy 0 < minQuality <= maxQuality <= 1',
    )
  }

  const { fileSize } = options
  const minBytes = fileSize?.minBytes
  const maxBytes = fileSize?.maxBytes
  const targetBytes = fileSize?.targetBytes

  assertValidRange(minBytes, 'minBytes')
  assertValidRange(maxBytes, 'maxBytes')
  assertValidRange(targetBytes, 'targetBytes')

  if (minBytes === undefined && maxBytes === undefined && targetBytes === undefined) {
    const blob = await encodeAt(defaultQuality, 1)
    return {
      blob,
      quality: defaultQuality,
      scale: 1,
      sizeBytes: blob.size,
      attempts: 1,
      outcome: 'ok',
    }
  }

  const upperBound = Math.min(targetBytes ?? Infinity, maxBytes ?? Infinity)
  const scales = options.allowedScales ?? [1]

  let attempts = 0
  let smallest: Candidate | null = null

  for (const scale of scales) {
    const top = await measure(encodeAt, maxQuality, scale)
    attempts += 1
    smallest = smaller(top, smallest)

    if (top.sizeBytes <= upperBound) {
      if (minBytes === undefined || top.sizeBytes >= minBytes) {
        return { ...top, attempts, outcome: 'ok' }
      }
      return { ...top, attempts, outcome: 'too-small' }
    }

    const bottom = await measure(encodeAt, minQuality, scale)
    attempts += 1
    smallest = smaller(bottom, smallest)

    if (bottom.sizeBytes > upperBound) {
      continue
    }

    let loQuality = minQuality
    let hiQuality = maxQuality
    let best = bottom
    let steps = 0

    while (hiQuality - loQuality > epsilon && steps < maxSteps) {
      steps += 1
      const mid = (loQuality + hiQuality) / 2
      const candidate = await measure(encodeAt, mid, scale)
      attempts += 1
      if (candidate.sizeBytes <= upperBound) {
        loQuality = mid
        best = candidate
      } else {
        hiQuality = mid
      }
    }

    if (minBytes !== undefined && best.sizeBytes < minBytes) {
      return { ...best, attempts, outcome: 'too-small' }
    }
    return { ...best, attempts, outcome: 'ok' }
  }

  return { ...(smallest as Candidate), attempts, outcome: 'too-large' }
}

/**
 * Build an encoder suitable for `optimizeEncoding` from a canvas.
 * Scale 1 reuses the canvas directly; smaller scales render a resized copy.
 */
export type EncodableCanvas = DrawableSource & CanvasLike & {
  toBlob: HTMLCanvasElement['toBlob']
}

export function createCanvasEncoder(
  canvas: EncodableCanvas,
  format: OutputFormat,
): EncodeAt {
  return async (quality: number, scale: number) => {
    if (scale === 1) {
      return encodeCanvas(canvas, format, quality)
    }
    const resized = resizeToCanvas(canvas, {
      width: Math.max(1, Math.round(canvas.width * scale)),
      height: Math.max(1, Math.round(canvas.height * scale)),
    })
    return encodeCanvas(resized as EncodableCanvas, format, quality)
  }
}
