import { describe, expect, it } from 'vitest'
import {
  validateFormPreset,
  type FormPreset,
} from '../domain/presets/schema'
import {
  FORM_PRESETS,
  findFormPreset,
  presetFreshness,
  requirementsFromPreset,
} from '../domain/presets/registry'

const VALID: FormPreset = {
  id: 'test-preset',
  name: 'Test Preset',
  authority: 'Test Authority',
  lastVerified: '2026-01-15',
  sourceUrl: 'https://example.gov/',
  photo: {
    format: 'jpeg',
    pixelSize: { width: 413, height: 531 },
    fileSizeBytes: { min: 20480, max: 51200 },
  },
  signature: {
    format: 'png',
    aspectRatio: { width: 3, height: 1 },
  },
}

describe('validateFormPreset', () => {
  it('accepts a fully specified preset', () => {
    expect(validateFormPreset(VALID)).toEqual(VALID)
  })

  it('rejects missing or malformed fields', () => {
    expect(() => validateFormPreset(null)).toThrow(/must be an object/)
    expect(() => validateFormPreset({ ...VALID, id: '' })).toThrow(/id/)
    expect(() => validateFormPreset({ ...VALID, lastVerified: '2026/01/15' })).toThrow(
      /lastVerified/,
    )
    expect(() => validateFormPreset({ ...VALID, sourceUrl: 'ftp://x' })).toThrow(/sourceUrl/)
  })

  it('rejects invalid requirement values', () => {
    expect(() =>
      validateFormPreset({ ...VALID, photo: { ...VALID.photo, format: 'gif' } }),
    ).toThrow(/format/)
    expect(() =>
      validateFormPreset({
        ...VALID,
        photo: { ...VALID.photo, pixelSize: { width: 0, height: 100 } },
      }),
    ).toThrow(/pixelSize\.width/)
    expect(() =>
      validateFormPreset({
        ...VALID,
        photo: {
          format: 'jpeg',
          fileSizeBytes: { min: 5000, max: 1000 },
        },
      }),
    ).toThrow(/min <= max/)
  })

  it('requires at least one asset kind', () => {
    const empty: Record<string, unknown> = { ...VALID }
    delete empty.photo
    delete empty.signature
    expect(() => validateFormPreset(empty)).toThrow(/photo or signature/)
  })
})

describe('preset registry', () => {
  it('loads only schema-valid presets with unique ids', () => {
    const ids = FORM_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const preset of FORM_PRESETS) {
      expect(validateFormPreset(preset)).toEqual(preset)
      expect(preset.sourceUrl).toMatch(/^https?:\/\//)
      expect(preset.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('resolves presets by id', () => {
    expect(findFormPreset(FORM_PRESETS[0].id)?.id).toBe(FORM_PRESETS[0].id)
    expect(findFormPreset('missing')).toBeUndefined()
    expect(findFormPreset(undefined)).toBeUndefined()
  })
})

describe('presetFreshness', () => {
  it('marks recent verification as verified', () => {
    const now = new Date('2026-08-21T00:00:00Z')
    expect(presetFreshness({ ...VALID, lastVerified: '2026-08-01' }, now)).toBe('verified')
  })

  it('marks year-old verification as stale', () => {
    const now = new Date('2026-08-21T00:00:00Z')
    expect(presetFreshness({ ...VALID, lastVerified: '2025-06-01' }, now)).toBe('stale')
  })
})

describe('requirementsFromPreset', () => {
  it('maps photo requirements into engine requirements', () => {
    const requirements = requirementsFromPreset(FORM_PRESETS[0], 'photo')
    expect(requirements).toMatchObject({
      id: `${FORM_PRESETS[0].id}:photo`,
      format: 'jpeg',
      dimensions: { width: 413, height: 531 },
      aspectRatio: 35 / 45,
      fileSize: { minBytes: 20 * 1024, maxBytes: 50 * 1024 },
    })
  })

  it('maps signature requirements and returns undefined when absent', () => {
    const signature = requirementsFromPreset(FORM_PRESETS[0], 'signature')
    expect(signature?.fileSize?.minBytes).toBe(10 * 1024)

    const bare = validateFormPreset({ id: 'p', name: 'p', authority: 'a', lastVerified: '2026-01-01', photo: { format: 'jpeg' } })
    expect(requirementsFromPreset(bare, 'signature')).toBeUndefined()
  })
})
