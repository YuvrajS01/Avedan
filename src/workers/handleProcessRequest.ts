import type { ProcessedOutputData } from '../domain/jobs/result'
import { computePhotoOutput } from '../features/photo/processPhoto'
import { computeSignatureOutput } from '../features/signature/processSignature'
import type { ProcessRequestPayload } from './protocol'

/**
 * Framework-independent worker request handler (T018).
 *
 * Kept separate from the worker entry so the message protocol and result
 * shape can be unit-tested without instantiating a real Worker.
 */
export async function handleProcessRequest(
  request: ProcessRequestPayload,
): Promise<ProcessedOutputData> {
  if (request.kind === 'photo') {
    return computePhotoOutput({
      source: request.source,
      cropRect: request.cropRect,
      profile: request.profile,
      fileName: request.fileName,
    })
  }
  return computeSignatureOutput({
    source: request.source,
    profile: request.profile,
    fileName: request.fileName,
  })
}
