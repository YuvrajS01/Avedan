import { describe, expect, it, vi, beforeEach } from 'vitest'
import { processBatchPhotos, processSinglePhoto } from '../features/batch/batchProcess'
import { decodeImage } from '../processing/decode'
import type { ProcessedAsset } from '../domain/jobs/result'

vi.mock('../processing/decode', () => ({
  decodeImage: vi.fn(),
}))

vi.mock('../features/photo/processPhoto', () => ({
  processPhoto: vi.fn(),
}))

vi.mock('../features/signature/processSignature', () => ({
  processSignature: vi.fn(),
}))

vi.mock('../features/thumb/processThumb', () => ({
  processThumb: vi.fn(),
}))

const mockedDecode = vi.mocked(decodeImage)
let mockedProcess: ReturnType<typeof vi.fn>
let mockedSignature: ReturnType<typeof vi.fn>
let mockedThumb: ReturnType<typeof vi.fn>

function fakeAsset(name: string): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
    url: `blob:${name}`,
    fileName: `${name}-avedan.jpg`,
    width: 300,
    height: 400,
    format: 'jpeg',
    sizeBytes: 3,
    quality: 0.85,
    outcome: 'ok',
    validation: { status: 'pass', checks: [{ id: 'dimensions', label: '300 × 400 px', status: 'pass' }] },
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('../features/photo/processPhoto')
  mockedProcess = vi.mocked(mod.processPhoto)
  const modSig = await import('../features/signature/processSignature')
  mockedSignature = vi.mocked(modSig.processSignature)
  const modThumb = await import('../features/thumb/processThumb')
  mockedThumb = vi.mocked(modThumb.processThumb)
  mockedDecode.mockResolvedValue({ width: 800, height: 600, getContext: () => null } as never)
  mockedProcess.mockImplementation(async ({ fileName }: { fileName: string }) => fakeAsset(fileName))
  mockedSignature.mockImplementation(async ({ fileName }: { fileName: string }) => fakeAsset(fileName))
  mockedThumb.mockImplementation(async ({ fileName }: { fileName: string }) => fakeAsset(fileName))
})

describe('processSinglePhoto (T026)', () => {
  it('auto center-crops to the target aspect ratio and delegates to photo pipeline', async () => {
    mockedDecode.mockResolvedValue({ width: 800, height: 600 } as never)
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const profile = { id: 'test', label: 'Test', dimensions: { width: 300, height: 400 }, aspectRatio: 3 / 4, format: 'jpeg' as const }
    const asset = await processSinglePhoto(file, profile)
    expect(mockedDecode).toHaveBeenCalledWith(file)
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'photo.jpg',
        profile,
      }),
    )
    const call = mockedProcess.mock.calls[0][0] as { cropRect: { width: number; height: number } }
    expect(call.cropRect.width / call.cropRect.height).toBeCloseTo(3 / 4, 2)
    expect(asset.fileName).toBe('photo.jpg-avedan.jpg')
  })

  it('uses full image when no aspectRatio is set', async () => {
    mockedDecode.mockResolvedValue({ width: 500, height: 500 } as never)
    const file = new File(['y'], 'a.png', { type: 'image/png' })
    const profile = { id: 't', label: 'T' }
    await processSinglePhoto(file, profile)
    const call = mockedProcess.mock.calls[0][0] as { cropRect: { x: number; y: number; width: number; height: number } }
    expect(call.cropRect).toEqual({ x: 0, y: 0, width: 500, height: 500 })
  })
})

describe('processBatchPhotos (T026)', () => {
  it('processes files sequentially and captures per-file results', async () => {
    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'c.jpg', { type: 'image/jpeg' }),
    ]
    const profile = { id: 't', label: 'T', dimensions: { width: 300, height: 400 }, aspectRatio: 3 / 4, format: 'jpeg' as const }
    const callOrder: string[] = []
    mockedProcess.mockImplementation(async ({ fileName }: { fileName: string }) => {
      callOrder.push(fileName)
      await new Promise((resolve) => setTimeout(resolve, 1))
      return fakeAsset(fileName)
    })

    const results = await processBatchPhotos(files, profile)
    expect(results).toHaveLength(3)
    expect(results.every((r) => r.status === 'done')).toBe(true)
    expect(callOrder).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
    expect(results[0].asset?.fileName).toBe('a.jpg-avedan.jpg')
  })

  it('delegates to photo processor for BatchKind photo (T029)', async () => {
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' })]
    const profile = { id: 't', label: 'T' }
    const { processBatch } = await import('../features/batch/batchProcess')
    const results = await processBatch(files, 'photo', profile)
    expect(results[0].status).toBe('done')
    expect(mockedProcess).toHaveBeenCalled()
  })

  it('delegates to signature processor for BatchKind signature (T029)', async () => {
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' })]
    const profile = { id: 't', label: 'T', dimensions: { width: 300, height: 100 }, format: 'jpeg' as const }
    const { processBatch } = await import('../features/batch/batchProcess')
    const results = await processBatch(files, 'signature', profile)
    expect(results[0].status).toBe('done')
    expect(mockedSignature).toHaveBeenCalled()
    expect(mockedProcess).not.toHaveBeenCalled()
  })

  it('delegates to thumb processor for BatchKind thumb (T029)', async () => {
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' })]
    const profile = { id: 't', label: 'T', dimensions: { width: 240, height: 240 }, format: 'jpeg' as const }
    const { processBatch } = await import('../features/batch/batchProcess')
    const results = await processBatch(files, 'thumb', profile)
    expect(results[0].status).toBe('done')
    expect(mockedThumb).toHaveBeenCalled()
  })

  it('captures per-file errors without aborting the batch', async () => {
    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'c.jpg', { type: 'image/jpeg' }),
    ]
    const profile = { id: 't', label: 'T' }
    mockedDecode
      .mockResolvedValueOnce({ width: 800, height: 600 } as never)
      .mockRejectedValueOnce(new Error('Corrupt file'))
      .mockResolvedValueOnce({ width: 800, height: 600 } as never)

    const results = await processBatchPhotos(files, profile)
    expect(results[0].status).toBe('done')
    expect(results[1].status).toBe('error')
    expect(results[1].error).toMatch(/corrupt/i)
    expect(results[2].status).toBe('done')
  })

  it('calls onProgress sequentially', async () => {
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' })]
    const profile = { id: 't', label: 'T' }
    const progress: string[] = []
    await processBatchPhotos(files, profile, (index, total, item) => {
      progress.push(`${item.status}:${index}/${total}`)
    })
    expect(progress.length).toBe(4)
    expect(progress[0]).toContain('processing:0/2')
    expect(progress[1]).toContain('done:0/2')
  })
})
