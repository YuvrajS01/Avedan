import { trimToCanvas } from '../../processing/trim'
import { resizeToCanvas } from '../../processing/resize'
import { defaultCanvasFactory, type CanvasLike, type DrawableSource } from '../../processing/crop'
import { computeFitDimensions } from '../../processing/geometry'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas } from '../../processing/optimize'
import type { ImageRequirements, OutputFormat } from '../../domain/requirements/types'
import type { ProcessedAsset, ProcessedOutputData, AssetOutcome } from '../../domain/jobs/result'
import type { ValidationResult } from '../../domain/validation/engine'
import { validateOutput } from '../../domain/validation/engine'
import { processWithOptionalWorker } from '../../workers/client'

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
 *
 * Signature dimensions are "fit within" (validation uses `within` mode), so
 * when a file-size constraint cannot be met at full size the optimizer may
 * try progressively smaller scales — this is the only recourse for PNG,
 * whose encoder ignores quality (MVP audit finding I1).
 */
const SIGNATURE_ALLOWED_SCALES = [1, 0.9, 0.8, 0.7, 0.6, 0.5]

/**
 * Serializable signature pipeline; identical code in-thread and in-worker
 * (T018). Returns everything except the session object URL.
 */
export async function computeSignatureOutput(input: {
  source: DrawableSource
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedOutputData> {
  const trimmed = trimToCanvas(input.source)

  const target = input.profile.dimensions
    ? computeFitDimensions(
        { width: trimmed.width, height: trimmed.height },
        input.profile.dimensions,
      )
    : { width: trimmed.width, height: trimmed.height }

  const resized = resizeToCanvas(trimmed as unknown as DrawableSource, target)
  const flattened = flattenToWhite(resized)
  const format: OutputFormat = input.profile.format ?? 'png'

  const optimization = await optimizeEncoding(
    createCanvasEncoder(flattened as unknown as EncodableCanvas, format),
    {
      fileSize: input.profile.fileSize,
      allowedScales: input.profile.fileSize ? SIGNATURE_ALLOWED_SCALES : undefined,
    },
  )

  // The optimizer may have scaled down; report what was actually encoded.
  const width = Math.max(1, Math.round(target.width * optimization.scale))
  const height = Math.max(1, Math.round(target.height * optimization.scale))

  const extension = format === 'jpeg' ? 'jpg' : format
  const baseName = input.fileName.replace(/\.[^.]+$/, '') || 'signature'

  return {
    blob: optimization.blob,
    fileName: `${baseName}-avedan.${extension}`,
    width,
    height,
    format,
    sizeBytes: optimization.sizeBytes,
    quality: optimization.quality,
    outcome: optimization.outcome as AssetOutcome,
    validation: validateOutput(
      input.profile,
      {
        width: resized.width,
        height: resized.height,
        format,
        sizeBytes: optimization.sizeBytes,
      },
      { dimensionMode: 'within' },
    ) as ValidationResult,
  }
}

function withSessionUrl(data: ProcessedOutputData): ProcessedAsset {
  return {
    ...data,
    url:
      typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(data.blob)
        : '',
  }
}

export async function processSignature(input: {
  source: DrawableSource
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedAsset> {
  const data = await processWithOptionalWorker(
    {
      kind: 'signature',
      source: input.source,
      profile: input.profile,
      fileName: input.fileName,
    },
    () => computeSignatureOutput(input),
  )
  return withSessionUrl(data)
}
