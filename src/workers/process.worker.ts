import { handleProcessRequest } from './handleProcessRequest'
import type { ProcessRequestPayload, ProcessResponsePayload } from './protocol'

// Thin worker entry: all engine logic lives in `src/processing/*` and the
// shared pipelines, which are framework-independent by design (T018).

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<ProcessRequestPayload>) => void) | null
  postMessage: (message: ProcessResponsePayload) => void
}

ctx.onmessage = (event) => {
  const request = event.data
  handleProcessRequest(request)
    .then((result) => {
      ctx.postMessage({ id: request.id, ok: true, result })
    })
    .catch((error: unknown) => {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : 'processing-failed'
      const message =
        error instanceof Error ? error.message : 'Processing failed.'
      ctx.postMessage({ id: request.id, ok: false, error: { code, message } })
    })
}
