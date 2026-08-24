import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProcessedOutputData } from '../domain/jobs/result'
import type { ImageRequirements } from '../domain/requirements/types'
import {
  processWithOptionalWorker,
  processingWorkerSupported,
} from '../workers/client'
import { handleProcessRequest } from '../workers/handleProcessRequest'
import type {
  ProcessRequestPayload,
  ProcessResponsePayload,
} from '../workers/protocol'

vi.mock('../features/photo/processPhoto', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../features/photo/processPhoto')>()
  return {
    ...actual,
    computePhotoOutput: vi.fn(async () => photoOutput),
  }
})

vi.mock('../features/signature/processSignature', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../features/signature/processSignature')>()
  return {
    ...actual,
    computeSignatureOutput: vi.fn(async () => signatureOutput),
  }
})

import { computePhotoOutput } from '../features/photo/processPhoto'
import { computeSignatureOutput } from '../features/signature/processSignature'

const validation = { status: 'pass' as const, checks: [] }

const photoOutput: ProcessedOutputData = {
  blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
  fileName: 'photo-avedan.jpg',
  width: 100,
  height: 120,
  format: 'jpeg',
  sizeBytes: 3,
  quality: 0.92,
  outcome: 'ok',
  validation,
}

const signatureOutput: ProcessedOutputData = {
  ...photoOutput,
  fileName: 'signature-avedan.png',
  format: 'png',
}

const profile: ImageRequirements = { id: 't', label: 'Test profile' }

class FakeWorker {
  static instances: FakeWorker[] = []
  static responder:
    | ((worker: FakeWorker, message: ProcessRequestPayload) => void)
    | null = null

  url: string
  terminated = false
  posted: ProcessRequestPayload[] = []
  transfers: Transferable[][] = []
  onmessage: ((event: { data: ProcessResponsePayload }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null

  constructor(url: string | URL) {
    this.url = String(url)
    FakeWorker.instances.push(this)
  }

  postMessage(message: unknown, transfer?: Transferable[]): void {
    const request = message as ProcessRequestPayload
    this.posted.push(request)
    this.transfers.push(transfer ?? [])
    FakeWorker.responder?.(this, request)
  }

  terminate(): void {
    this.terminated = true
  }
}

function stubWorkerGlobals(responder: typeof FakeWorker.responder): void {
  FakeWorker.responder = responder
  FakeWorker.instances = []
  vi.stubGlobal('Worker', FakeWorker)
  vi.stubGlobal('createImageBitmap', async (source: { width: number; height: number }) => ({
    width: source.width,
    height: source.height,
    close: () => undefined,
  }))
}

describe('processing worker support detection', () => {
  it('is false in environments without Worker or createImageBitmap', () => {
    vi.stubGlobal('Worker', undefined)
    vi.stubGlobal('createImageBitmap', undefined)
    expect(processingWorkerSupported()).toBe(false)
  })

  it('is true when both Worker and createImageBitmap exist', () => {
    vi.stubGlobal('Worker', FakeWorker)
    vi.stubGlobal('createImageBitmap', () => ({}))
    expect(processingWorkerSupported()).toBe(true)
  })
})

describe('handleProcessRequest (worker message protocol)', () => {
  it('dispatches photo requests to the photo pipeline with serialized fields', async () => {
    const bitmap = { width: 200, height: 100 } as ImageBitmap
    const result = await handleProcessRequest({
      id: 1,
      kind: 'photo',
      source: bitmap,
      cropRect: { x: 4, y: 6, width: 180, height: 90 },
      profile,
      fileName: 'a.jpg',
    })

    expect(computePhotoOutput).toHaveBeenCalledWith({
      source: bitmap,
      cropRect: { x: 4, y: 6, width: 180, height: 90 },
      profile,
      fileName: 'a.jpg',
    })
    expect(result).toEqual(photoOutput)
  })

  it('dispatches signature requests to the signature pipeline', async () => {
    const bitmap = { width: 300, height: 80 } as ImageBitmap
    const result = await handleProcessRequest({
      id: 2,
      kind: 'signature',
      source: bitmap,
      profile,
      fileName: 'b.png',
    })

    expect(computeSignatureOutput).toHaveBeenCalledWith({
      source: bitmap,
      profile,
      fileName: 'b.png',
    })
    expect(result).toEqual(signatureOutput)
  })
})

describe('client dispatcher with a fake worker', () => {
  beforeEach(() => {
    vi.mocked(computePhotoOutput).mockClear()
    vi.mocked(computeSignatureOutput).mockClear()
  })

  it('sends a protocol message with the converted bitmap and resolves the result', async () => {
    stubWorkerGlobals((worker, message) => {
      worker.onmessage?.({
        data: { id: message.id, ok: true, result: photoOutput },
      })
    })

    const source = { width: 200, height: 100 }
    const fallback = vi.fn(async () => signatureOutput)
    const result = await processWithOptionalWorker(
      {
        kind: 'photo',
        source: source as never,
        cropRect: { x: 0, y: 0, width: 200, height: 100 },
        profile,
        fileName: 'a.jpg',
      },
      fallback,
    )

    expect(result).toEqual(photoOutput)
    expect(fallback).not.toHaveBeenCalled()

    const worker = FakeWorker.instances[0]
    expect(worker.url).toContain('process.worker.ts')
    expect(worker.terminated).toBe(true)
    expect(worker.posted).toHaveLength(1)

    const sent = worker.posted[0]
    expect(sent.kind).toBe('photo')
    expect(sent.profile).toEqual(profile)
    expect(sent.fileName).toBe('a.jpg')
    // The wire carries an ImageBitmap copy, not the original source object.
    expect(sent.source).not.toBe(source)
    expect(worker.transfers[0]).toContain(sent.source)
  })

  it('falls back to the in-thread pipeline when the worker reports an error', async () => {
    stubWorkerGlobals((worker, message) => {
      worker.onmessage?.({
        data: {
          id: message.id,
          ok: false,
          error: { code: 'encode-failed', message: 'Encoding failed.' },
        },
      })
    })

    const fallback = vi.fn(async () => signatureOutput)
    const result = await processWithOptionalWorker(
      {
        kind: 'signature',
        source: { width: 10, height: 10 } as never,
        profile,
        fileName: 'b.png',
      },
      fallback,
    )

    // Worker failures degrade to the identical in-thread pipeline.
    expect(result).toEqual(signatureOutput)
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it('falls back to the in-thread pipeline when the worker errors out', async () => {
    stubWorkerGlobals((worker) => {
      worker.onerror?.(new Error('worker crashed'))
    })

    const fallback = vi.fn(async () => signatureOutput)
    const result = await processWithOptionalWorker(
      {
        kind: 'photo',
        source: { width: 10, height: 10 } as never,
        cropRect: { x: 0, y: 0, width: 10, height: 10 },
        profile,
        fileName: 'a.jpg',
      },
      fallback,
    )

    expect(result).toEqual(signatureOutput)
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it('falls back to the in-thread pipeline when the worker stays silent', async () => {
    vi.useFakeTimers()
    try {
      // A worker that loads fine but never answers (engine quirk, CSP, …).
      stubWorkerGlobals(() => undefined)

      const fallback = vi.fn(async () => signatureOutput)
      const pending = processWithOptionalWorker(
        {
          kind: 'photo',
          source: { width: 10, height: 10 } as never,
          cropRect: { x: 0, y: 0, width: 10, height: 10 },
          profile,
          fileName: 'a.jpg',
        },
        fallback,
      )

      await vi.runAllTimersAsync()
      expect(await pending).toEqual(signatureOutput)
      expect(fallback).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses the in-thread pipeline directly when workers are unsupported', async () => {
    vi.stubGlobal('Worker', undefined)
    vi.stubGlobal('createImageBitmap', undefined)
    FakeWorker.instances = []

    const fallback = vi.fn(async () => photoOutput)
    const result = await processWithOptionalWorker(
      {
        kind: 'photo',
        source: { width: 10, height: 10 } as never,
        cropRect: { x: 0, y: 0, width: 10, height: 10 },
        profile,
        fileName: 'a.jpg',
      },
      fallback,
    )

    expect(result).toEqual(photoOutput)
    expect(fallback).toHaveBeenCalledTimes(1)
    expect(FakeWorker.instances).toHaveLength(0)
  })
})

describe('in-thread fallback produces full assets through the public API', () => {
  it('processPhoto runs the engine in-thread and returns metadata + validation', async () => {
    vi.stubGlobal('Worker', undefined)
    vi.stubGlobal('createImageBitmap', undefined)

    const encodedBlob = new Blob([new Uint8Array([9, 9, 9, 9])], {
      type: 'image/jpeg',
    })
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => {
        callback(encodedBlob)
      })

    try {
      const { processPhoto } = await vi.importActual<
        typeof import('../features/photo/processPhoto')
      >('../features/photo/processPhoto')
      const asset = await processPhoto({
        source: { width: 200, height: 100 } as never,
        cropRect: { x: 0, y: 0, width: 200, height: 100 },
        profile: { id: 'p', label: 'P', format: 'jpeg', dimensions: { width: 100, height: 50 } },
        fileName: 'me.jpg',
      })

      expect(asset.blob).toBe(encodedBlob)
      expect(asset.sizeBytes).toBe(encodedBlob.size)
      expect(asset.width).toBe(100)
      expect(asset.height).toBe(50)
      expect(asset.format).toBe('jpeg')
      expect(asset.fileName).toBe('me-avedan.jpg')
      expect(asset.outcome).toBe('ok')
      expect(asset.quality).toBeGreaterThan(0)
      expect(asset.validation.status).toBe('pass')
      expect(asset.url).toBe('')
    } finally {
      toBlobSpy.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
