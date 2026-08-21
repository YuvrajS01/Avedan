import { ProcessingError } from './errors'
import type { CanvasLike } from './crop'

export const OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function isOutputFormat(value: string): value is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value)
}

/**
 * Encode a canvas to a Blob in the requested format.
 * `quality` applies to lossy formats (JPEG/WebP) and is ignored by PNG.
 */
export function encodeCanvas(
  canvas: CanvasLike & { toBlob: HTMLCanvasElement['toBlob'] },
  format: OutputFormat,
  quality = 0.92,
): Promise<Blob> {
  const mimeType = MIME_BY_FORMAT[format]

  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(
        new ProcessingError(
          'encode-failed',
          'This image could not be exported at the selected settings.',
        ),
      )
      return
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(
            new ProcessingError(
              'encode-failed',
              `This image could not be exported as ${format.toUpperCase()}. Try JPG or reduce the output dimensions.`,
            ),
          )
        }
      },
      mimeType,
      format === 'png' ? undefined : quality,
    )
  })
}
