import type { ImageRequirements } from '../requirements/types'
import type { PresetAssetKind } from './schema'
import { validateFormPreset, type FormPreset } from './schema'
import { SEED_PRESETS } from './seedPresets'

/**
 * Registry built from the seed data in `seedPresets.ts` (T019). Entries are
 * validated against the schema at load time and must never be presented as
 * official requirements until manually verified (DECISIONS D003/D019).
 */

function loadRegistry(): FormPreset[] {
  const seen = new Set<string>()
  return SEED_PRESETS.map((entry) => {
    const preset = validateFormPreset(entry)
    if (seen.has(preset.id)) {
      throw new Error(`Duplicate preset id in registry: ${preset.id}`)
    }
    seen.add(preset.id)
    return preset
  })
}

/** All presets, validated against the schema at load time. */
export const FORM_PRESETS: FormPreset[] = loadRegistry()

export function findFormPreset(id: string | undefined): FormPreset | undefined {
  if (!id) return undefined
  return FORM_PRESETS.find((preset) => preset.id === id)
}

export type PresetFreshness = 'verified' | 'stale'

const STALE_AFTER_MS = 365 * 24 * 60 * 60 * 1000

export function presetFreshness(preset: FormPreset, now: Date = new Date()): PresetFreshness {
  const verifiedAt = new Date(`${preset.lastVerified}T00:00:00Z`).getTime()
  return Number.isFinite(verifiedAt) && now.getTime() - verifiedAt <= STALE_AFTER_MS
    ? 'verified'
    : 'stale'
}

/** Map a preset's asset requirements into the engine's ImageRequirements. */
export function requirementsFromPreset(
  preset: FormPreset,
  kind: PresetAssetKind,
): ImageRequirements | undefined {
  const requirements = preset[kind]
  if (!requirements) return undefined

  return {
    id: `${preset.id}:${kind}`,
    label: `${preset.name} — ${kind}`,
    format: requirements.format,
    dimensions: requirements.pixelSize ? { ...requirements.pixelSize } : undefined,
    aspectRatio: requirements.aspectRatio
      ? requirements.aspectRatio.width / requirements.aspectRatio.height
      : undefined,
    fileSize: requirements.fileSizeBytes
      ? {
          minBytes: requirements.fileSizeBytes.min,
          maxBytes: requirements.fileSizeBytes.max,
          targetBytes: requirements.fileSizeBytes.target,
        }
      : undefined,
    // Only explicit white backgrounds activate whitening; 'original' and
    // 'transparent' mean the engine keeps the pixels as-is (T019).
    background: requirements.background === 'white' ? 'white' : undefined,
    physicalSizeMm: requirements.physicalSizeMm
      ? { ...requirements.physicalSizeMm }
      : undefined,
    dpi: requirements.dpi,
  }
}
