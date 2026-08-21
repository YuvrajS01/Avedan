import type { OutputFormat } from '../requirements/types'
import type { ValidationResult } from '../validation/engine'

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
}
