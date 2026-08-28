import type { PresetAssetKind } from '../presets/schema'

export interface KitAsset {
  blob: Blob
  fileName: string
  sizeBytes: number
}

/**
 * Session-local kit store (T025).
 *
 * Holds the most recently prepared asset per preset + kind.
 * In-memory only — no durable storage, no image bytes in analytics/logs.
 * Cleared when the user navigates away or refreshes (session-local).
 */
const store = new Map<string, Map<PresetAssetKind, KitAsset>>()

export function setKitAsset(
  presetId: string,
  kind: PresetAssetKind,
  asset: KitAsset,
): void {
  if (!presetId) return
  let byPreset = store.get(presetId)
  if (!byPreset) {
    byPreset = new Map()
    store.set(presetId, byPreset)
  }
  byPreset.set(kind, asset)
}

export function getKitAssets(presetId: string | undefined): Map<PresetAssetKind, KitAsset> | undefined {
  if (!presetId) return undefined
  return store.get(presetId)
}

export function getKitAsset(
  presetId: string | undefined,
  kind: PresetAssetKind,
): KitAsset | undefined {
  if (!presetId) return undefined
  return store.get(presetId)?.get(kind)
}

export function clearKit(presetId: string): void {
  store.delete(presetId)
}

export function clearAllKits(): void {
  store.clear()
}

/** For testing only — expose store size. */
export function _storeSize(): number {
  return store.size
}
