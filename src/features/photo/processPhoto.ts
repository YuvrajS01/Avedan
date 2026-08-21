import { assertDecodableFile, decodeImage } from '../../processing/decode'
import { cropToCanvas, type DrawableSource } from '../../processing/crop'
import { resizeToCanvas } from '../../processing/resize'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas, type OptimizationOutcome } from '../../processing/optimize'
import type { Rect } from '../../processing/geometry'
import type { ImageRequirements } from '../../domain/requirements/types'

export interface LoadedPhoto {
  source: DrawableSource
  previewUrl: string
  fileName: string
}

export function revokeObjectUrl(url: string): void {
  if (url && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

export async function loadPhotoSource(file: File): Promise<LoadedPhoto> {
  assertDecodableFile(file)
  const source = await decodeImage(file)
  const previewUrl =
    typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : ''
  return { source, previewUrl, fileName: file.name }
}

export interface ValidationCheck {
  label: string
  pass: boolean
}

export interface ProcessedPhoto {
  blob: Blob
  url: string
  fileName: string
  width: number
  height: number
  format: ImageRequirements['format']
  sizeBytes: number
  quality: number
  outcome: OptimizationOutcome
  checks: ValidationCheck[]
}

function buildChecks(
  profile: ImageRequirements,
  width: number,
  height: number,
  sizeBytes: number,
): ValidationCheck[] {
  const checks: ValidationCheck[] = []

  if (profile.dimensions) {
    const pass =
      width === profile.dimensions.width && height === profile.dimensions.height
    checks.push({
      label: `${width} × ${height} px`,
      pass,
    })
  }

  if (profile.aspectRatio !== undefined) {
    const actual = width / height
    checks.push({
      label: `Aspect ratio ${profile.aspectRatio.toFixed(2).replace(/\.?0+$/, '')}`,
      pass: Math.abs(actual - profile.aspectRatio) < 0.02,
    })
  }

  if (profile.format) {
    checks.push({ label: profile.format.toUpperCase(), pass: true })
  }

  if (profile.fileSize?.maxBytes !== undefined) {
    checks.push({
      label: `${(sizeBytes / 1024).toFixed(0)} KB — under the ${Math.round(profile.fileSize.maxBytes / 1024)} KB limit`,
      pass: sizeBytes <= profile.fileSize.maxBytes,
    })
  }

  if (profile.fileSize?.minBytes !== undefined) {
    checks.push({
      label: `${(sizeBytes / 1024).toFixed(0)} KB — above the ${Math.round(profile.fileSize.minBytes / 1024)} KB minimum`,
      pass: sizeBytes >= profile.fileSize.minBytes,
    })
  }

  return checks
}

export async function processPhoto(input: {
  source: DrawableSource
  cropRect: Rect
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedPhoto> {
  const cropped = cropToCanvas(input.source, input.cropRect)

  const target = input.profile.dimensions ?? {
    width: cropped.width,
    height: cropped.height,
  }
  const resized = resizeToCanvas(cropped as unknown as DrawableSource, target)
  const format = input.profile.format ?? 'jpeg'

  const optimization = await optimizeEncoding(
    createCanvasEncoder(resized as unknown as EncodableCanvas, format),
    { fileSize: input.profile.fileSize },
  )

  const url =
    typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(optimization.blob)
      : ''

  const extension = format === 'jpeg' ? 'jpg' : format
  const baseName = input.fileName.replace(/\.[^.]+$/, '') || 'photo'

  return {
    blob: optimization.blob,
    url,
    fileName: `${baseName}-avedan.${extension}`,
    width: resized.width,
    height: resized.height,
    format,
    sizeBytes: optimization.sizeBytes,
    quality: optimization.quality,
    outcome: optimization.outcome,
    checks: buildChecks(
      input.profile,
      resized.width,
      resized.height,
      optimization.sizeBytes,
    ),
  }
}
