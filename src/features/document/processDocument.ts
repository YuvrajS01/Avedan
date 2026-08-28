import { correctPerspective, type Quad } from '../../processing/perspective'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas } from '../../processing/optimize'
import type { ImageRequirements, OutputFormat } from '../../domain/requirements/types'
import type { ProcessedAsset, ProcessedOutputData, AssetOutcome } from '../../domain/jobs/result'
import type { ValidationResult } from '../../domain/validation/engine'
import { validateOutput } from '../../domain/validation/engine'
import type { DrawableSource } from '../../processing/crop'

/**
 * Serializable document pipeline: perspective correct → optimize → validate.
 * No auto-crop; the quad defines the source region. The output dimensions are
 * the target dimensions from the profile (or the corrected canvas size if no
 * target is set). Uses STORE-like logic but reuses the same optimizer.
 */
export async function computeDocumentOutput(input: {
  source: DrawableSource
  quad: Quad
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedOutputData> {
  const target = input.profile.dimensions ?? {
    width: (input.source.width as number) ?? 800,
    height: (input.source.height as number) ?? 1100,
  }

  const corrected = correctPerspective(
    input.source,
    input.quad,
    target.width,
    target.height,
  )

  const format: OutputFormat = input.profile.format ?? 'jpeg'

  const optimization = await optimizeEncoding(
    createCanvasEncoder(corrected as unknown as EncodableCanvas, format),
    { fileSize: input.profile.fileSize },
  )

  const extension = format === 'jpeg' ? 'jpg' : format
  const baseName = input.fileName.replace(/\.[^.]+$/, '') || 'document'

  return {
    blob: optimization.blob,
    fileName: `${baseName}-avedan.${extension}`,
    width: target.width,
    height: target.height,
    format,
    sizeBytes: optimization.sizeBytes,
    quality: optimization.quality,
    outcome: optimization.outcome as AssetOutcome,
    validation: validateOutput(input.profile, {
      width: target.width,
      height: target.height,
      format,
      sizeBytes: optimization.sizeBytes,
    }) as ValidationResult,
  }
}

function withSessionUrl(data: ProcessedOutputData): ProcessedAsset {
  return {
    ...data,
    url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(data.blob) : '',
  }
}

export async function processDocument(input: {
  source: DrawableSource
  quad: Quad
  profile: ImageRequirements
  fileName: string
}): Promise<ProcessedAsset> {
  // Document perspective correction is infrequent and already CPU-light (two triangles);
  // run in-thread to avoid adding a new worker kind for T030. The worker path for
  // photo/signature/thumb remains unchanged.
  const data = await computeDocumentOutput(input)
  return withSessionUrl(data)
}
