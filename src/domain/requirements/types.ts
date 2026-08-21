export type OutputFormat = 'jpeg' | 'png' | 'webp'

export interface PixelDimensions {
  width: number
  height: number
}

export interface FileSizeRange {
  minBytes?: number
  maxBytes?: number
  targetBytes?: number
}

/**
 * Typed representation of an image-processing job's constraints (FR-01).
 * Requirements are data, never hardcoded into UI components.
 */
export interface ImageRequirements {
  id: string
  label: string
  format?: OutputFormat
  dimensions?: PixelDimensions
  /** Target width / height ratio, e.g. 3 / 4 for a portrait photo. */
  aspectRatio?: number
  fileSize?: FileSizeRange
}
