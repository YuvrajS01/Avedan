import { describe, expect, it } from 'vitest'
import { ProcessingError } from '../processing/errors'
import { optimizeEncoding, type EncodeAt } from '../processing/optimize'

interface FakeEncoder {
  encodeAt: EncodeAt
  calls: Array<{ quality: number; scale: number }>
}

/**
 * Deterministic stand-in for a codec: size grows monotonically with
 * quality and with the square of the scale.
 */
function fakeEncoder(baseBytes: number): FakeEncoder {
  const calls: FakeEncoder['calls'] = []
  const encodeAt: EncodeAt = async (quality, scale) => {
    calls.push({ quality, scale })
    const size = Math.max(1, Math.round(baseBytes * scale * scale * (0.2 + 0.8 * quality)))
    return new Blob([new Uint8Array(size)], { type: 'image/jpeg' })
  }
  return { encodeAt, calls }
}

describe('optimizeEncoding', () => {
  it('finds the highest quality under a maximum byte size', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { maxBytes: 50_000 } })

    expect(result.outcome).toBe('ok')
    expect(result.sizeBytes).toBeLessThanOrEqual(50_000)
    expect(result.quality).toBeGreaterThan(0.3)
    expect(result.quality).toBeLessThanOrEqual(0.38)
    expect(result.scale).toBe(1)
    expect(calls.every((call) => call.scale === 1)).toBe(true)
  })

  it('converges in a bounded number of attempts', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { maxBytes: 55_000 } })

    expect(result.attempts).toBeLessThanOrEqual(10)
    expect(result.attempts).toBeGreaterThanOrEqual(3)
  })

  it('returns immediately when the best quality already fits', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { maxBytes: 200_000 } })

    expect(result.outcome).toBe('ok')
    expect(result.quality).toBe(0.95)
    expect(result.sizeBytes).toBe(96_000)
    expect(calls).toHaveLength(1)
  })

  it('is deterministic for identical inputs', async () => {
    const a = await optimizeEncoding(fakeEncoder(100_000).encodeAt, {
      fileSize: { maxBytes: 50_000 },
    })
    const b = await optimizeEncoding(fakeEncoder(100_000).encodeAt, {
      fileSize: { maxBytes: 50_000 },
    })

    expect(a.quality).toBe(b.quality)
    expect(a.sizeBytes).toBe(b.sizeBytes)
  })

  it('satisfies a minimum/maximum range', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { minBytes: 40_000, maxBytes: 60_000 },
    })

    expect(result.outcome).toBe('ok')
    expect(result.sizeBytes).toBeGreaterThanOrEqual(40_000)
    expect(result.sizeBytes).toBeLessThanOrEqual(60_000)
  })

  it('targets a byte size from below without exceeding it', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { targetBytes: 60_000 } })

    expect(result.outcome).toBe('ok')
    expect(result.sizeBytes).toBeLessThanOrEqual(60_000)
    expect(result.quality).toBeLessThanOrEqual(0.51)
  })

  it('reports too-small when even maximum quality is below the minimum', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { minBytes: 150_000 } })

    expect(result.outcome).toBe('too-small')
    expect(result.quality).toBe(0.95)
    expect(result.attempts).toBe(1)
  })

  it('reports too-small when the range cannot be hit', async () => {
    const calls: Array<{ quality: number; scale: number }> = []
    const encodeAt: EncodeAt = async (quality, scale) => {
      calls.push({ quality, scale })
      const size = quality < 0.7 ? 30_000 : 90_000
      return new Blob([new Uint8Array(size)], { type: 'image/jpeg' })
    }

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { minBytes: 50_000, maxBytes: 60_000 },
    })

    expect(result.outcome).toBe('too-small')
    expect(result.sizeBytes).toBeLessThan(50_000)
    expect(calls.every((call) => call.scale === 1)).toBe(true)
  })

  it('reports too-large and keeps the smallest candidate when nothing fits', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { maxBytes: 10_000 },
      allowedScales: [1, 0.5],
    })

    expect(result.outcome).toBe('too-large')
    expect(result.blob.size).toBe(11_000)
  })

  it('reduces dimensions only via allowed scales and succeeds there', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { maxBytes: 10_000 },
      allowedScales: [1, 0.25],
    })

    expect(result.outcome).toBe('ok')
    expect(result.scale).toBe(0.25)
    expect(result.sizeBytes).toBeLessThanOrEqual(10_000)
    expect(calls.filter((call) => call.scale === 1).length).toBeGreaterThan(0)
    expect(calls.every((call) => call.scale === 1 || call.scale === 0.25)).toBe(true)
  })

  it('never changes dimensions unless scales are provided', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, { fileSize: { maxBytes: 1_000 } })

    expect(result.outcome).toBe('too-large')
    expect(calls.every((call) => call.scale === 1)).toBe(true)
  })

  it('encodes once at the default quality without constraints', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {})

    expect(result.outcome).toBe('ok')
    expect(result.quality).toBe(0.92)
    expect(calls).toHaveLength(1)
  })

  it('rejects invalid quality bounds and negative sizes', async () => {
    const { encodeAt } = fakeEncoder(100_000)

    await expect(
      optimizeEncoding(encodeAt, { minQuality: 0.9, maxQuality: 0.5 }),
    ).rejects.toMatchObject({ code: 'invalid-input' } satisfies Partial<ProcessingError>)

    await expect(
      optimizeEncoding(encodeAt, { fileSize: { maxBytes: -5 } }),
    ).rejects.toMatchObject({ code: 'invalid-input' } satisfies Partial<ProcessingError>)
  })
})

describe('optimizeEncoding with allowedScales', () => {
  it('falls back to a smaller scale when scale 1 cannot meet the limit', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { maxBytes: 20_000 },
      allowedScales: [1, 0.8, 0.6],
    })

    expect(result.outcome).toBe('ok')
    expect(result.scale).toBeLessThan(1)
    // Scale 0.8 → max size = 100k * 0.64 * 0.96 ≈ 61.4k > 20k; 0.6 → ≈34.5k…
    // 0.6 still too big at top quality? Verify against measured size instead:
    expect(result.sizeBytes).toBeLessThanOrEqual(20_000)
    expect(calls.some((call) => call.scale === result.scale)).toBe(true)
  })

  it('prefers full size when it already satisfies the constraint', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { maxBytes: 50_000 },
      allowedScales: [1, 0.8, 0.6],
    })

    expect(result.outcome).toBe('ok')
    expect(result.scale).toBe(1)
    expect(calls.every((call) => call.scale === 1)).toBe(true)
  })

  it('reports too-large only after every allowed scale fails', async () => {
    const { encodeAt, calls } = fakeEncoder(100_000)

    const result = await optimizeEncoding(encodeAt, {
      fileSize: { maxBytes: 1 },
      allowedScales: [1, 0.5],
    })

    expect(result.outcome).toBe('too-large')
    const triedScales = new Set(calls.map((call) => call.scale))
    expect(triedScales.has(1)).toBe(true)
    expect(triedScales.has(0.5)).toBe(true)
    // Smallest candidate is min quality at the smallest allowed scale:
    // 100k * 0.5² * (0.2 + 0.8·0.3) = 11k.
    expect(result.sizeBytes).toBe(11_000)
  })
})
