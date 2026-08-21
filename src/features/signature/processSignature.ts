import { trimToCanvas } from '../../processing/trim'
import { resizeToCanvas } from '../../processing/resize'
import type { DrawableSource } from '../../processing/crop'
import { computeFitDimensions } from '../../processing/geometry'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas } from '../../processing/optimize'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset, ValidationCheck } from '../../domain/jobs/result'

function buildChecks(
  profile: ImageRequirements,
  width: number,
  height: number,
  sizeBytes: number,
): ValidationCheck[] {
  const checks: ValidationCheck[] = []

  if (profile.dimensions) {
    const pass =
      width <= profile.dimensions.width && height <= profile.dimensions.height
    checks.push({
      label: `${width} × ${height} px — within ${profile.dimensions.width} × ${profile.dimensions.height}`,
      pass,
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

/**
 * Signature pipeline per PROCESSING_ENGINE order:
 * trim empty margins → fit resize → encode → optimize → validate.
 */
export async function processSignature(input: {
  source: DrawableSource
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedAsset> {
  const trimmed = trimToCanvas(input.source)

  const target = input.profile.dimensions
    ? computeFitDimensions(
        { width: trimmed.width, height: trimmed.height },
        input.profile.dimensions,
      )
    : { width: trimmed.width, height: trimmed.height }

  const resized = resizeToCanvas(trimmed as unknown as DrawableSource, target)
  const format = input.profile.format ?? 'png'

  const optimization = await optimizeEncoding(
    createCanvasEncoder(resized as unknown as EncodableCanvas, format),
    { fileSize: input.profile.fileSize },
  )

  const url =
    typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(optimization.blob)
      : ''

  const extension = format === 'jpeg' ? 'jpg' : format
  const baseName = input.fileName.replace(/\.[^.]+$/, '') || 'signature'

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
