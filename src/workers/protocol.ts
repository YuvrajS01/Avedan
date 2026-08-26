import type { ImageRequirements } from '../domain/requirements/types'
import type { ProcessedOutputData } from '../domain/jobs/result'
import type { Rect } from '../processing/geometry'

/** Message protocol for the processing worker (T018/T022). */

export type ProcessKind = 'photo' | 'signature' | 'thumb'

interface ProcessRequestBase {
  /** Correlates a response with its request; unique per client session. */
  id: number
  kind: ProcessKind
  /** Always an ImageBitmap on the wire — cloneable and transferable. */
  source: ImageBitmap
  profile: ImageRequirements
  fileName: string
}

export interface PhotoProcessRequest extends ProcessRequestBase {
  kind: 'photo'
  cropRect: Rect
}

export interface SignatureProcessRequest extends ProcessRequestBase {
  kind: 'signature'
}

export interface ThumbProcessRequest extends ProcessRequestBase {
  kind: 'thumb'
}

export type ProcessRequestPayload = PhotoProcessRequest | SignatureProcessRequest | ThumbProcessRequest

export interface ProcessSuccessResponse {
  id: number
  ok: true
  result: ProcessedOutputData
}

export interface ProcessErrorResponse {
  id: number
  ok: false
  error: { code: string; message: string }
}

export type ProcessResponsePayload = ProcessSuccessResponse | ProcessErrorResponse
