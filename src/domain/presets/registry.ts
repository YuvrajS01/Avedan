import type { ImageRequirements } from '../requirements/types'
import type { PresetAssetKind } from './schema'
import { validateFormPreset, type FormPreset } from './schema'

/**
 * Seed registry. Entries are illustrative templates with verification
 * metadata; they must never be presented as official requirements for a
 * real application (see DECISIONS D019). Replace/extend only with values
 * manually verified against official sources.
 */
const SEED_PRESETS: unknown[] = [
  {
    id: 'example-exam-413x531',
    name: 'Example exam form (35 × 45 mm)',
    authority: 'Example Authority',
    description:
      'Illustrative template: 413 × 531 px JPG photo within 20–50 KB and a JPG signature within 10–20 KB.',
    lastVerified: '2026-08-01',
    sourceUrl: 'https://example.gov/exam',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 413, height: 531 },
      aspectRatio: { width: 35, height: 45 },
      physicalSizeMm: { width: 35, height: 45 },
      dpi: 300,
      fileSizeBytes: { min: 20 * 1024, max: 50 * 1024 },
    },
    signature: {
      format: 'jpeg',
      fileSizeBytes: { min: 10 * 1024, max: 20 * 1024 },
    },
  },
  {
    id: 'example-university-square',
    name: 'Example university application',
    authority: 'Example University',
    description:
      'Illustrative template: square 300 × 300 px PNG photo up to 100 KB and a PNG signature up to 50 KB.',
    lastVerified: '2026-07-15',
    sourceUrl: 'https://example.edu/apply',
    photo: {
      format: 'png',
      pixelSize: { width: 300, height: 300 },
      aspectRatio: { width: 1, height: 1 },
      fileSizeBytes: { max: 100 * 1024 },
    },
    signature: {
      format: 'png',
      fileSizeBytes: { max: 50 * 1024 },
    },
  },
  {
    id: 'example-recruitment-small',
    name: 'Example recruitment form (small)',
    authority: 'Example Recruitment Board',
    description:
      'Illustrative template: 200 × 260 px JPG photo up to 30 KB and a compact JPG signature.',
    lastVerified: '2025-06-01',
    sourceUrl: 'https://example.gov.in/recruit',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 200, height: 260 },
      aspectRatio: { width: 3, height: 4 },
      fileSizeBytes: { max: 30 * 1024 },
    },
    signature: {
      format: 'jpeg',
      fileSizeBytes: { max: 20 * 1024 },
    },
  },
]

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
  }
}
