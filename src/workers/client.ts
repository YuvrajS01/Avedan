import type { ImageRequirements } from '../domain/requirements/types'
import type { ProcessedOutputData } from '../domain/jobs/result'
import type { Rect } from '../processing/geometry'
import type {
  ProcessKind,
  ProcessRequestPayload,
  ProcessResponsePayload,
} from './protocol'

/**
 * Main-thread dispatcher for the processing worker (T018).
 *
 * Workers are used only when the environment supports them; every caller
 * supplies an equivalent in-thread computation as a fallback so behavior is
 * identical everywhere (older browsers, test environments).
 */

export function processingWorkerSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof createImageBitmap === 'function'
}

let nextRequestId = 1

function spawnWorker(): Worker {
  return new Worker(new URL('./process.worker.ts', import.meta.url), { type: 'module' })
}

/**
 * Upper bound for a worker round-trip. Legitimate jobs finish in seconds;
 * anything silent past this is treated as a stalled worker so the flow can
 * degrade to the in-thread pipeline instead of hanging the UI.
 */
const WORKER_TIMEOUT_MS = 15000

export interface ProcessingJobInput {
  kind: ProcessKind
  source: Parameters<typeof createImageBitmap>[0]
  profile: ImageRequirements
  fileName: string
  cropRect?: Rect
}

async function runProcessingJob(input: ProcessingJobInput): Promise<ProcessedOutputData> {
  const bitmap = await createImageBitmap(input.source as ImageBitmapSource)
  const id = nextRequestId++
  const worker = spawnWorker()

  try {
    return await new Promise<ProcessedOutputData>((resolve, reject) => {
      const fail = (message: string) => reject(new Error(message))
      const timeout = setTimeout(
        () => fail('Background processing did not finish in time.'),
        WORKER_TIMEOUT_MS,
      )
      const settle = (fn: () => void) => {
        clearTimeout(timeout)
        fn()
      }

      worker.onmessage = (event: MessageEvent<ProcessResponsePayload>) => {
        const response = event.data
        if (!response || response.id !== id) return
        settle(() => {
          if (response.ok) resolve(response.result)
          else fail(response.error.message)
        })
      }
      worker.onerror = () => {
        settle(() => fail('Background processing failed.'))
      }

      const message: ProcessRequestPayload =
        input.kind === 'photo'
          ? {
              id,
              kind: 'photo',
              source: bitmap,
              cropRect: input.cropRect as Rect,
              profile: input.profile,
              fileName: input.fileName,
            }
          : input.kind === 'thumb'
            ? {
                id,
                kind: 'thumb',
                source: bitmap,
                profile: input.profile,
                fileName: input.fileName,
              }
            : {
                id,
                kind: 'signature',
                source: bitmap,
                profile: input.profile,
                fileName: input.fileName,
              }
      // Transfer the bitmap instead of cloning it (structured clone).
      worker.postMessage(message, [bitmap])
    })
  } finally {
    worker.terminate()
  }
}

/**
 * Run the job through the worker when supported, otherwise — or when the
 * worker fails for any reason — through the identical in-thread pipeline.
 */
export async function processWithOptionalWorker(
  input: ProcessingJobInput,
  computeInThread: () => Promise<ProcessedOutputData>,
): Promise<ProcessedOutputData> {
  if (!processingWorkerSupported()) {
    return computeInThread()
  }
  try {
    return await runProcessingJob(input)
  } catch {
    return computeInThread()
  }
}
