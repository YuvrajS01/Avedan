import { describe, expect, it, beforeEach } from 'vitest'
import { clearAllKits, getKitAsset, getKitAssets, setKitAsset, _storeSize } from '../domain/kit/store'

describe('kit store (T025)', () => {
  beforeEach(() => clearAllKits())

  it('stores and retrieves assets per preset and kind', () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
    setKitAsset('preset-a', 'photo', { blob, fileName: 'photo-avedan.jpg', sizeBytes: 3 })
    setKitAsset('preset-a', 'signature', { blob, fileName: 'sig-avedan.jpg', sizeBytes: 3 })
    expect(getKitAsset('preset-a', 'photo')?.fileName).toBe('photo-avedan.jpg')
    expect(getKitAsset('preset-a', 'thumbImpression')).toBeUndefined()
    expect(getKitAssets('preset-a')?.size).toBe(2)
  })

  it('isolates different presets', () => {
    const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    setKitAsset('preset-a', 'photo', { blob, fileName: 'a.jpg', sizeBytes: 1 })
    setKitAsset('preset-b', 'photo', { blob, fileName: 'b.jpg', sizeBytes: 1 })
    expect(getKitAsset('preset-a', 'photo')?.fileName).toBe('a.jpg')
    expect(getKitAsset('preset-b', 'photo')?.fileName).toBe('b.jpg')
  })

  it('overwrites an existing kind for the same preset', () => {
    const blob1 = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    const blob2 = new Blob([new Uint8Array([2, 2])], { type: 'image/jpeg' })
    setKitAsset('preset-a', 'photo', { blob: blob1, fileName: 'a.jpg', sizeBytes: 1 })
    setKitAsset('preset-a', 'photo', { blob: blob2, fileName: 'a2.jpg', sizeBytes: 2 })
    expect(getKitAsset('preset-a', 'photo')?.fileName).toBe('a2.jpg')
    expect(getKitAssets('preset-a')?.size).toBe(1)
  })

  it('ignores empty presetId', () => {
    const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    setKitAsset('', 'photo', { blob, fileName: 'x.jpg', sizeBytes: 1 })
    expect(_storeSize()).toBe(0)
    expect(getKitAsset(undefined, 'photo')).toBeUndefined()
  })

  it('clears kits', () => {
    const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    setKitAsset('preset-a', 'photo', { blob, fileName: 'a.jpg', sizeBytes: 1 })
    clearAllKits()
    expect(getKitAsset('preset-a', 'photo')).toBeUndefined()
    expect(_storeSize()).toBe(0)
  })
})
