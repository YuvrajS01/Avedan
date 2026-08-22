import { assertDecodableFile, decodeImage } from '../../processing/decode'
import { cropToCanvas, type DrawableSource } from '../../processing/crop'
import { resizeToCanvas } from '../../processing/resize'
import { createCanvasEncoder, optimizeEncoding, type EncodableCanvas } from '../../processing/optimize'
import { assessCanvasQuality, type QualityCheck } from '../../processing/quality'
import type { Rect } from '../../processing/geometry'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset } from '../../domain/jobs/result'
import { validateOutput } from '../../domain/validation/engine'

export type ProcessedPhoto = ProcessedAsset
export type { QualityCheck as PhotoQualityCheck }

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
    validation: validateOutput(input.profile, {
      width: resized.width,
      height: resized.height,
      format,
      sizeBytes: optimization.sizeBytes,
    }),
    advisory: assessCanvasQuality(resized as unknown as DrawableSource),
  }
}
