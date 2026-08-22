import { trimToCanvas } from '../../processing/trim'
import { resizeToCanvas } from '../../processing/resize'
import { defaultCanvasFactory, type CanvasLike, type DrawableSource } from '../../processing/crop'
import { computeFitDimensions } from '../../processing/geometry'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas } from '../../processing/optimize'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset } from '../../domain/jobs/result'
import { validateOutput } from '../../domain/validation/engine'

function flattenToWhite(source: CanvasLike): CanvasLike {
  const out = defaultCanvasFactory(source.width, source.height)
  const ctx = out.getContext('2d')
  if (!ctx) return source
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, source.width, source.height)
  ctx.drawImage(source as unknown as CanvasImageSource, 0, 0)
  return out as unknown as CanvasLike
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
  const flattened = flattenToWhite(resized)
  const format = input.profile.format ?? 'png'

  const optimization = await optimizeEncoding(
    createCanvasEncoder(flattened as unknown as EncodableCanvas, format),
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
    validation: validateOutput(
      input.profile,
      {
        width: resized.width,
        height: resized.height,
        format,
        sizeBytes: optimization.sizeBytes,
      },
      { dimensionMode: 'within' },
    ),
  }
}
