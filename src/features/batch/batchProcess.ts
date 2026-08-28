import { decodeImage } from '../../processing/decode'
import { computeCropRect } from '../../processing/geometry'
import { processPhoto } from '../photo/processPhoto'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset } from '../../domain/jobs/result'

export type BatchStatus = 'queued' | 'processing' | 'done' | 'error'

export interface BatchItem {
  id: string
  file: File
  status: BatchStatus
  asset?: ProcessedAsset
  error?: string
}

/**
 * Process a single file with auto center-crop (T026).
 * Reuses the exact same photo pipeline as the single-file flow:
 * decode → auto cropRect via computeCropRect → computePhotoOutput → validate.
 *
 * No manual crop in batch — the largest centered rectangle of the target
 * aspect ratio is used. When no aspectRatio is set, the full image is used.
 */
export async function processSinglePhoto(
  file: File,
  profile: ImageRequirements,
): Promise<ProcessedAsset> {
  // Decode (throws ProcessingError with user-actionable code if unsupported/corrupt)
  const source = await decodeImage(file)

  const aspectRatio = profile.aspectRatio ?? source.width / source.height
  // Use computeCropRect for deterministic center crop; falls back to full image when ratio matches source.
  const cropRect = computeCropRect(source.width, source.height, aspectRatio)

  return processPhoto({
    source,
    cropRect,
    profile,
    fileName: file.name,
  })
}

/**
 * Sequential batch processor (T026) — bounds memory and worker contention
 * by processing one file at a time (not parallel). Returns per-file results
 * in input order. Never throws as a whole; per-file errors are captured.
 */
export async function processBatchPhotos(
  files: File[],
  profile: ImageRequirements,
  onProgress?: (index: number, total: number, item: BatchItem) => void,
): Promise<BatchItem[]> {
  const results: BatchItem[] = files.map((file, index) => ({
    id: `${file.name}-${index}-${Date.now()}`,
    file,
    status: 'queued' as BatchStatus,
  }))

  for (let i = 0; i < results.length; i++) {
    const item = results[i]
    item.status = 'processing'
    onProgress?.(i, files.length, item)
    try {
      const asset = await processSinglePhoto(item.file, profile)
      item.asset = asset
      item.status = 'done'
    } catch (cause) {
      item.error = cause instanceof Error ? cause.message : 'This photo could not be processed.'
      item.status = 'error'
    }
    onProgress?.(i, files.length, item)
  }

  return results
}
