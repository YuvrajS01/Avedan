export type ProcessingErrorCode =
  | 'unsupported-type'
  | 'empty-file'
  | 'decode-failed'
  | 'encode-failed'
  | 'invalid-input'
  | 'canvas-unavailable'

export class ProcessingError extends Error {
  readonly code: ProcessingErrorCode

  constructor(code: ProcessingErrorCode, message: string) {
    super(message)
    this.name = 'ProcessingError'
    this.code = code
  }
}
