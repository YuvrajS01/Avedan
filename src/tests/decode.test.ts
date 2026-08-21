import { describe, expect, it } from 'vitest'
import { ProcessingError } from '../processing/errors'
import { assertDecodableFile, isSupportedImageType } from '../processing/decode'

describe('assertDecodableFile', () => {
  it('accepts supported image types', () => {
    expect(() =>
      assertDecodableFile({ type: 'image/jpeg', size: 1024 }),
    ).not.toThrow()
    expect(() =>
      assertDecodableFile({ type: 'image/png', size: 1024 }),
    ).not.toThrow()
    expect(() =>
      assertDecodableFile({ type: 'image/webp', size: 1024 }),
    ).not.toThrow()
  })

  it('rejects zero-byte files before decoding', () => {
    try {
      assertDecodableFile({ type: 'image/jpeg', size: 0 })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ProcessingError)
      expect((error as ProcessingError).code).toBe('empty-file')
    }
  })

  it('rejects unsupported MIME types', () => {
    try {
      assertDecodableFile({ type: 'application/pdf', size: 1024 })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ProcessingError)
      expect((error as ProcessingError).code).toBe('unsupported-type')
    }
  })

  it('classifies common unsupported types', () => {
    expect(isSupportedImageType('image/gif')).toBe(false)
    expect(isSupportedImageType('image/heic')).toBe(false)
    expect(isSupportedImageType('')).toBe(false)
  })
})
