import { ProcessingError } from './errors'

export const SUPPORTED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type DecodedImage = ImageBitmap | HTMLImageElement

export function isSupportedImageType(type: string): boolean {
  return (SUPPORTED_INPUT_TYPES as readonly string[]).includes(type)
}

/** Validate a file before spending memory on decoding it. */
export function assertDecodableFile(file: { type: string; size: number }): void {
  if (file.size === 0) {
    throw new ProcessingError('empty-file', 'This file is empty. Choose a valid image file.')
  }
  if (!isSupportedImageType(file.type)) {
    throw new ProcessingError(
      'unsupported-type',
      'This file type is not supported. Use a JPG, PNG or WebP image.',
    )
  }
}

function decodeViaImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(
        new ProcessingError(
          'decode-failed',
          'This image could not be opened. The file may be corrupt or in an unsupported format.',
        ),
      )
    }
    image.src = url
  })
}

/**
 * Decode an image blob entirely on the client.
 * Prefers `createImageBitmap`; falls back to an <img> element.
 */
export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob)
    } catch {
      // fall through to the <img> path
    }
  }
  return decodeViaImageElement(blob)
}
