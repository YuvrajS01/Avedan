import type { OutputFormat } from '../requirements/types'

export type AssetOutcome = 'ok' | 'too-large' | 'too-small'

export interface ValidationCheck {
  label: string
  pass: boolean
}

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
  checks: ValidationCheck[]
}
