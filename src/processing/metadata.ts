import { decodeImage, type DecodedImage } from './decode'
import type { Size } from './geometry'

export interface ImageMetadata extends Size {
  mimeType: string
  sizeBytes: number
}

export function dimensionsOf(source: DecodedImage): Size {
  return { width: source.width, height: source.height }
}

/**
 * Measure a source image: pixel dimensions plus byte size and MIME type.
 * No image data leaves the device.
 */
export async function inspectImage(file: Blob & { type?: string }): Promise<ImageMetadata> {
  const decoded = await decodeImage(file)
  const { width, height } = dimensionsOf(decoded)
  if ('close' in decoded && typeof decoded.close === 'function') {
    decoded.close()
  }
  return {
    width,
    height,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }
}
