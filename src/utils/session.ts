import { revokeObjectUrl } from '../features/photo/processPhoto'
import type { LoadedPhoto } from '../features/photo/processPhoto'
import type { ProcessedAsset } from '../domain/jobs/result'

/**
 * Release every local reference to user image data for the current
 * session: object URLs are revoked and buffers become collectable.
 * Nothing is persisted, so a reset (or reload) leaves no image bytes.
 */
export function releaseSessionAssets(assets: {
  loaded?: LoadedPhoto | null
  result?: ProcessedAsset | null
}): void {
  revokeObjectUrl(assets.loaded?.previewUrl ?? '')
  revokeObjectUrl(assets.result?.url ?? '')
}
