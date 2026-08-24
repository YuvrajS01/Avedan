import { ProcessingError } from './errors'
import type { CanvasLike } from './crop'
import type { OutputFormat } from '../domain/requirements/types'

export type { OutputFormat }

export const OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const

export const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function isOutputFormat(value: string): value is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value)
}

/**
 * A canvas that can encode itself to a Blob. Main-thread canvases expose
 * `toBlob`; worker OffscreenCanvas exposes `convertToBlob` (T018).
 */
export type EncodableSurface = CanvasLike & {
  toBlob?: HTMLCanvasElement['toBlob']
  convertToBlob?: (options?: { type?: string; quality?: number }) => Promise<Blob>
}

/**
 * Encode a canvas to a Blob in the requested format.
 * `quality` applies to lossy formats (JPEG/WebP) and is ignored by PNG.
 */
export function encodeCanvas(
  canvas: EncodableSurface,
  format: OutputFormat,
  quality = 0.92,
): Promise<Blob> {
  const mimeType = MIME_BY_FORMAT[format]
  const qualityArg = format === 'png' ? undefined : quality

  const fail = () =>
    new ProcessingError(
      'encode-failed',
      `This image could not be exported as ${format.toUpperCase()}. Try JPG or reduce the output dimensions.`,
    )

  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(fail())
          }
        },
        mimeType,
        qualityArg,
      )
      return
    }

    if (typeof canvas.convertToBlob === 'function') {
      canvas
        .convertToBlob({ type: mimeType, quality: qualityArg })
        .then((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(fail())
          }
        })
        .catch(() => reject(fail()))
      return
    }

    reject(
      new ProcessingError(
        'encode-failed',
        'This image could not be exported at the selected settings.',
      ),
    )
  })
}
