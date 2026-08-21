import { ProcessingError } from './errors'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface FocusPoint {
  /** Normalized horizontal focus, 0 (left) to 1 (right). */
  x: number
  /** Normalized vertical focus, 0 (top) to 1 (bottom). */
  y: number
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ProcessingError('invalid-input', `${name} must be a positive finite number`)
  }
}

/**
 * Largest axis-aligned rectangle of the requested aspect ratio that fits in
 * the source, centered on the focus point (defaults to center).
 * Result is integral and always inside the source bounds.
 */
export function computeCropRect(
  sourceWidth: number,
  sourceHeight: number,
  aspectRatio: number,
  focus?: FocusPoint,
): Rect {
  assertPositiveFinite(sourceWidth, 'sourceWidth')
  assertPositiveFinite(sourceHeight, 'sourceHeight')
  assertPositiveFinite(aspectRatio, 'aspectRatio')

  const fx = focus ? Math.min(Math.max(focus.x, 0), 1) : 0.5
  const fy = focus ? Math.min(Math.max(focus.y, 0), 1) : 0.5

  let cropWidth = sourceWidth
  let cropHeight = sourceWidth / aspectRatio

  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight
    cropWidth = sourceHeight * aspectRatio
  }

  let width = Math.max(1, Math.floor(cropWidth))
  let height = Math.max(1, Math.floor(cropHeight))

  if (width > sourceWidth) width = sourceWidth
  if (height > sourceHeight) height = sourceHeight

  const centerX = fx * sourceWidth
  const centerY = fy * sourceHeight

  let x = Math.round(centerX - width / 2)
  let y = Math.round(centerY - height / 2)

  x = Math.min(Math.max(x, 0), sourceWidth - width)
  y = Math.min(Math.max(y, 0), sourceHeight - height)

  return { x, y, width, height }
}

export interface Size {
  width: number
  height: number
}

function assertPositiveInt(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ProcessingError('invalid-input', `${name} must be a positive integer`)
  }
}

/**
 * Resolve output dimensions. When both target dimensions are provided they
 * are used exactly; when only one is provided the other follows the source
 * aspect ratio; with no target the source dimensions are kept.
 */
export function computeResizeDimensions(
  source: Size,
  target?: { width?: number; height?: number },
): Size {
  assertPositiveInt(source.width, 'source.width')
  assertPositiveInt(source.height, 'source.height')

  const { width, height } = target ?? {}

  if (width !== undefined && height !== undefined) {
    assertPositiveInt(width, 'target.width')
    assertPositiveInt(height, 'target.height')
    return { width, height }
  }

  if (width !== undefined) {
    assertPositiveInt(width, 'target.width')
    return {
      width,
      height: Math.max(1, Math.round((source.height * width) / source.width)),
    }
  }

  if (height !== undefined) {
    assertPositiveInt(height, 'target.height')
    return {
      width: Math.max(1, Math.round((source.width * height) / source.height)),
      height,
    }
  }

  return { width: source.width, height: source.height }
}

const MM_PER_INCH = 25.4

/**
 * Largest version of `source` that fits inside `max` while preserving the
 * source aspect ratio. Never upscales beyond the source size.
 */
export function computeFitDimensions(source: Size, max: Size): Size {
  assertPositiveInt(source.width, 'source.width')
  assertPositiveInt(source.height, 'source.height')
  assertPositiveInt(max.width, 'max.width')
  assertPositiveInt(max.height, 'max.height')

  if (source.width <= max.width && source.height <= max.height) {
    return { width: source.width, height: source.height }
  }

  const ratio = Math.min(max.width / source.width, max.height / source.height)
  return {
    width: Math.max(1, Math.floor(source.width * ratio)),
    height: Math.max(1, Math.floor(source.height * ratio)),
  }
}

/**
 * Derive pixel dimensions from physical millimeter sizes at a DPI.
 * Deterministic rounding so identical inputs always produce identical pixels.
 */
export function dimensionsFromPhysical(
  physical: { widthMm?: number; heightMm?: number },
  dpi: number,
): Size {
  assertPositiveFinite(dpi, 'dpi')
  const { widthMm, heightMm } = physical

  if (widthMm === undefined || heightMm === undefined) {
    throw new ProcessingError(
      'invalid-input',
      'both physical dimensions are required to derive pixel dimensions',
    )
  }

  const toPixels = (mm: number): number => {
    assertPositiveFinite(mm, 'physical dimension')
    return Math.max(1, Math.round((mm / MM_PER_INCH) * dpi))
  }

  return { width: toPixels(widthMm), height: toPixels(heightMm) }
}
