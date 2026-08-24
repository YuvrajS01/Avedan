import type { OutputFormat } from '../requirements/types'
import type { ValidationResult } from '../validation/engine'
import type { QualityCheck } from '../../processing/quality'

export type AssetOutcome = 'ok' | 'too-large' | 'too-small'

export interface ProcessedAsset {
  blob: Blob
  url: string
  fileName: string
  width: number
  height: number
  format: OutputFormat | undefined
  sizeBytes: number
  quality: number
  outcome: AssetOutcome
  validation: ValidationResult
  /** Optional advisory hints; absent when assessment is unavailable. */
  advisory?: QualityCheck[]
}

/**
 * Serializable processing output without the session object URL (T018).
 * This is the shape transferred from the processing worker; the URL is
 * attached on the main thread where `URL.createObjectURL` exists.
 */
export type ProcessedOutputData = Omit<ProcessedAsset, 'url'>
