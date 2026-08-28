import type { FormPreset, PresetAssetKind } from './schema'
import { PRESET_ASSET_KINDS } from './schema'

/**
 * Data-driven helper for V3 preset-aware validation (T023).
 *
 * No exam-specific logic — everything derives from the preset object and the
 * shared `PRESET_ASSET_KINDS` enumeration.
 */

/** Which asset kinds a preset actually requires (present in the preset object). */
export function requiredAssetKinds(preset: FormPreset): PresetAssetKind[] {
  return PRESET_ASSET_KINDS.filter((kind) => Boolean(preset[kind]))
}

/** Human label for an asset kind (kept in sync with FormsView). */
export function assetLabel(kind: PresetAssetKind): string {
  switch (kind) {
    case 'photo':
      return 'Photo'
    case 'signature':
      return 'Signature'
    case 'thumbImpression':
      return 'Thumb impression'
  }
}

/** Validation dimension mode per asset kind (D015/D042). */
export function dimensionModeForKind(kind: PresetAssetKind): 'exact' | 'within' {
  return kind === 'photo' ? 'exact' : 'within'
}

/** One-line summary of a preset's required kinds (e.g. "Photo + Signature + Thumb"). */
export function presetKindsSummary(preset: FormPreset): string {
  const kinds = requiredAssetKinds(preset)
  if (kinds.length === 0) return 'No required assets'
  return kinds.map((kind) => assetLabel(kind)).join(' + ')
}
