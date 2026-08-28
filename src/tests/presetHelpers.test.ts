import { describe, expect, it } from 'vitest'
import { validateFormPreset } from '../domain/presets/schema'
import {
  requiredAssetKinds,
  assetLabel,
  dimensionModeForKind,
  presetKindsSummary,
} from '../domain/presets/helpers'
import { FORM_PRESETS } from '../domain/presets/registry'

describe('preset helpers (T023)', () => {
  it('lists required asset kinds data-driven', () => {
    const full = validateFormPreset({
      id: 'full-kit',
      name: 'Full Kit',
      authority: 'Authority',
      lastVerified: '2026-08-20',
      sourceUrl: 'https://example.gov/full',
      photo: { format: 'jpeg', pixelSize: { width: 350, height: 450 } },
      signature: { format: 'jpeg' },
      thumbImpression: { format: 'jpeg', pixelSize: { width: 240, height: 240 } },
    })
    expect(requiredAssetKinds(full)).toEqual(['photo', 'signature', 'thumbImpression'])

    const photoOnly = validateFormPreset({
      id: 'photo-only',
      name: 'Photo Only',
      authority: 'Authority',
      lastVerified: '2026-08-20',
      photo: { format: 'jpeg' },
    })
    expect(requiredAssetKinds(photoOnly)).toEqual(['photo'])
  })

  it('returns correct labels and dimension modes', () => {
    expect(assetLabel('photo')).toBe('Photo')
    expect(assetLabel('signature')).toBe('Signature')
    expect(assetLabel('thumbImpression')).toBe('Thumb impression')
    expect(dimensionModeForKind('photo')).toBe('exact')
    expect(dimensionModeForKind('signature')).toBe('within')
    expect(dimensionModeForKind('thumbImpression')).toBe('within')
  })

  it('summarizes preset kinds for UI', () => {
    const thumbKit = FORM_PRESETS.find((preset) => preset.thumbImpression)!
    expect(presetKindsSummary(thumbKit)).toBe('Photo + Signature + Thumb impression')
    const whiteOnly = FORM_PRESETS.find((preset) => preset.id === 'example-white-background')!
    expect(presetKindsSummary(whiteOnly)).toBe('Photo')
  })

  it('handles seed registry data-driven kinds', () => {
    for (const preset of FORM_PRESETS) {
      const kinds = requiredAssetKinds(preset)
      expect(kinds.length).toBeGreaterThan(0)
      for (const kind of kinds) {
        expect(preset[kind]).toBeDefined()
      }
    }
  })
})
