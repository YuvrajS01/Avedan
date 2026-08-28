import { describe, expect, it } from 'vitest'
import { createZipBlob, blobToUint8Array } from '../utils/zip'

describe('createZipBlob (T025)', () => {
  it('creates a valid ZIP with one entry (STORE)', async () => {
    const data = new TextEncoder().encode('hello world')
    const zipBlob = createZipBlob([{ name: 'hello.txt', data }])
    expect(zipBlob.type).toBe('application/zip')
    const bytes = await blobToUint8Array(zipBlob)
    // Local file header signature 0x04034b50
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(bytes[2]).toBe(0x03)
    expect(bytes[3]).toBe(0x04)
    // Contains file name
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('hello.txt')
  })

  it('creates ZIP with multiple entries and correct file names', async () => {
    const entries = [
      { name: 'photo-avedan.jpg', data: new Uint8Array([1, 2, 3, 4]) },
      { name: 'signature-avedan.jpg', data: new Uint8Array([5, 6, 7]) },
      { name: 'thumb-avedan.jpg', data: new Uint8Array([8, 9]) },
    ]
    const zipBlob = createZipBlob(entries)
    const bytes = await blobToUint8Array(zipBlob)
    const text = new TextDecoder().decode(bytes)
    for (const entry of entries) {
      expect(text).toContain(entry.name)
    }
    // EOCD signature 0x06054b50 at end
    const view = new DataView(bytes.buffer)
    let foundEocd = false
    for (let i = bytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        foundEocd = true
        break
      }
    }
    expect(foundEocd).toBe(true)
  })

  it('handles empty entries (empty ZIP)', async () => {
    const zipBlob = createZipBlob([])
    const bytes = await blobToUint8Array(zipBlob)
    // Still has EOCD
    expect(bytes.length).toBe(22)
    const view = new DataView(bytes.buffer)
    expect(view.getUint32(0, true)).toBe(0x06054b50)
  })

  it('blobToUint8Array round-trips', async () => {
    const original = new Uint8Array([10, 20, 30, 40, 50])
    const blob = new Blob([original], { type: 'image/jpeg' })
    const result = await blobToUint8Array(blob)
    expect(result).toEqual(original)
  })
})
