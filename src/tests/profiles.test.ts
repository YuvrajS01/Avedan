import { describe, expect, it } from 'vitest'
import {
  CUSTOM_PROFILE_ID,
  PHOTO_PROFILES,
  describeRequirements,
  findProfile,
} from '../domain/requirements/profiles'
import { OUTPUT_FORMATS } from '../processing/encode'

describe('photo profiles', () => {
  it('has unique ids', () => {
    const ids = PHOTO_PROFILES.map((profile) => profile.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses supported output formats', () => {
    for (const profile of PHOTO_PROFILES) {
      if (profile.format) {
        expect(OUTPUT_FORMATS).toContain(profile.format)
      }
    }
  })

  it('has valid dimensions and ratios', () => {
    for (const profile of PHOTO_PROFILES) {
      if (profile.dimensions) {
        expect(profile.dimensions.width).toBeGreaterThan(0)
        expect(profile.dimensions.height).toBeGreaterThan(0)
      }
      if (profile.aspectRatio !== undefined) {
        expect(profile.aspectRatio).toBeGreaterThan(0)
      }
    }
  })

  it('has coherent file-size ranges', () => {
    for (const profile of PHOTO_PROFILES) {
      const { minBytes, maxBytes } = profile.fileSize ?? {}
      if (minBytes !== undefined && maxBytes !== undefined) {
        expect(minBytes).toBeLessThanOrEqual(maxBytes)
      }
    }
  })

  it('resolves profiles by id and treats custom separately', () => {
    expect(findProfile('portrait-3x4')?.label).toBe('Portrait 3:4')
    expect(findProfile(CUSTOM_PROFILE_ID)).toBeUndefined()
  })
})

describe('describeRequirements', () => {
  it('joins all constraints into one line', () => {
    const text = describeRequirements({
      id: 'x',
      label: 'X',
      dimensions: { width: 200, height: 260 },
      format: 'jpeg',
      fileSize: { maxBytes: 50 * 1024 },
    })
    expect(text).toBe('200 × 260 px · JPEG · ≤ 50 KB')
  })

  it('falls back to a neutral description', () => {
    expect(describeRequirements({ id: 'x', label: 'X' })).toBe(
      'No fixed technical target',
    )
  })
})
