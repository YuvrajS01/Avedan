import type { ImageRequirements } from '../requirements/types'

export type CheckStatus = 'pass' | 'attention' | 'not-run'

export interface ValidationCheck {
  id: string
  label: string
  status: CheckStatus
  details?: string
}

export interface ValidationResult {
  status: 'pass' | 'attention'
  checks: ValidationCheck[]
}

export interface OutputFacts {
  width: number
  height: number
  format?: ImageRequirements['format']
  sizeBytes: number
}

/** Documented tolerance for derived aspect-ratio comparison. */
export const ASPECT_TOLERANCE = 0.02

function ratioToLabel(ratio: number): string {
  for (let q = 1; q <= 20; q++) {
    const p = Math.round(ratio * q)
    if (p > 0 && Math.abs(p / q - ratio) < 0.005) {
      return `${p}:${q}`
    }
  }
  return ratio.toFixed(2)
}

function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * Deterministic technical validation of a processed output against its
 * requirements. Reports every category; unconstrained categories are
 * marked `not-run`. This is compatibility guidance, never an official
 * acceptance guarantee.
 */
export function validateOutput(
  requirements: ImageRequirements,
  facts: OutputFacts,
  options: {
    /** `exact` (default) mandates precise pixels; `within` allows fitting inside. */
    dimensionMode?: 'exact' | 'within'
  } = {},
): ValidationResult {
  const checks: ValidationCheck[] = []
  const dimensionMode = options.dimensionMode ?? 'exact'
  const actualRatio = facts.height > 0 ? facts.width / facts.height : 0

  if (requirements.dimensions) {
    const { width, height } = requirements.dimensions
    const pass =
      dimensionMode === 'within'
        ? facts.width <= width && facts.height <= height
        : facts.width === width && facts.height === height
    checks.push({
      id: 'dimensions',
      label: `${facts.width} × ${facts.height} px`,
      status: pass ? 'pass' : 'attention',
      details:
        dimensionMode === 'within'
          ? `Within ${width} × ${height} px`
          : `Required ${width} × ${height} px`,
    })
  } else {
    checks.push({
      id: 'dimensions',
      label: `${facts.width} × ${facts.height} px`,
      status: 'not-run',
      details: 'No fixed dimension target',
    })
  }

  if (requirements.aspectRatio !== undefined && dimensionMode === 'exact') {
    const pass = Math.abs(actualRatio - requirements.aspectRatio) <= ASPECT_TOLERANCE
    checks.push({
      id: 'aspect-ratio',
      label: `Aspect ratio ${ratioToLabel(actualRatio)}`,
      status: pass ? 'pass' : 'attention',
      details: `Target ${ratioToLabel(requirements.aspectRatio)}`,
    })
  } else {
    checks.push({
      id: 'aspect-ratio',
      label: `Aspect ratio ${ratioToLabel(actualRatio)}`,
      status: 'not-run',
      details: 'No fixed aspect-ratio target',
    })
  }

  if (requirements.format) {
    const pass = facts.format === requirements.format
    checks.push({
      id: 'format',
      label: facts.format ? facts.format.toUpperCase() : 'Unknown format',
      status: pass ? 'pass' : 'attention',
      details: `Required ${requirements.format.toUpperCase()}`,
    })
  } else {
    checks.push({
      id: 'format',
      label: facts.format ? facts.format.toUpperCase() : 'Unknown format',
      status: 'not-run',
      details: 'No format requirement',
    })
  }

  const fileSize = requirements.fileSize
  if (fileSize?.maxBytes !== undefined || fileSize?.targetBytes !== undefined) {
    const limit = fileSize.maxBytes ?? fileSize.targetBytes ?? 0
    const pass = facts.sizeBytes <= limit
    checks.push({
      id: 'file-size-max',
      label: `${kb(facts.sizeBytes)} — limit ${kb(limit)}`,
      status: pass ? 'pass' : 'attention',
    })
  } else {
    checks.push({
      id: 'file-size-max',
      label: kb(facts.sizeBytes),
      status: 'not-run',
      details: 'No maximum size',
    })
  }

  if (fileSize?.minBytes !== undefined) {
    const pass = facts.sizeBytes >= fileSize.minBytes
    checks.push({
      id: 'file-size-min',
      label: `${kb(facts.sizeBytes)} — minimum ${kb(fileSize.minBytes)}`,
      status: pass ? 'pass' : 'attention',
    })
  }

  return {
    status: checks.some((check) => check.status === 'attention') ? 'attention' : 'pass',
    checks,
  }
}
