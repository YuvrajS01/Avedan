import type { ImageRequirements } from './types'

export interface RequirementProfile extends ImageRequirements {
  description: string
}

export const CUSTOM_PROFILE_ID = 'custom'

export const PROFILE_NOTE =
  'Example templates — always verify against the official requirements of your form.'

export const PHOTO_PROFILES: RequirementProfile[] = [
  {
    id: 'portrait-3x4',
    label: 'Portrait 3:4',
    description: 'Common portrait ratio at 300 × 400 px, JPG.',
    aspectRatio: 3 / 4,
    dimensions: { width: 300, height: 400 },
    format: 'jpeg',
  },
  {
    id: 'square-1x1',
    label: 'Square 1:1',
    description: 'Square crop at 600 × 600 px, JPG.',
    aspectRatio: 1,
    dimensions: { width: 600, height: 600 },
    format: 'jpeg',
  },
  {
    id: 'exam-small-jpg',
    label: 'Small exam photo (≤ 50 KB)',
    description: 'Portrait 3:4 at 200 × 260 px, JPG under 50 KB.',
    aspectRatio: 3 / 4,
    dimensions: { width: 200, height: 260 },
    format: 'jpeg',
    fileSize: { maxBytes: 50 * 1024 },
  },
]

export function findProfile(id: string): RequirementProfile | undefined {
  return PHOTO_PROFILES.find((profile) => profile.id === id)
}

export const SIGNATURE_PROFILES: RequirementProfile[] = [
  {
    id: 'signature-standard',
    label: 'Standard (≤ 20 KB)',
    description: 'Fits within 300 × 100 px, JPG under 20 KB.',
    dimensions: { width: 300, height: 100 },
    format: 'jpeg',
    fileSize: { maxBytes: 20 * 1024 },
  },
  {
    id: 'signature-wide-png',
    label: 'Wide PNG (≤ 40 KB)',
    description: 'Fits within 400 × 120 px, PNG under 40 KB.',
    dimensions: { width: 400, height: 120 },
    format: 'png',
    fileSize: { maxBytes: 40 * 1024 },
  },
]

export function findSignatureProfile(id: string): RequirementProfile | undefined {
  return SIGNATURE_PROFILES.find((profile) => profile.id === id)
}

export function describeRequirements(profile: ImageRequirements): string {
  const parts: string[] = []

  if (profile.dimensions) {
    parts.push(`${profile.dimensions.width} × ${profile.dimensions.height} px`)
  }
  if (profile.format) {
    parts.push(profile.format.toUpperCase())
  }
  if (profile.fileSize?.minBytes !== undefined) {
    parts.push(`≥ ${Math.round(profile.fileSize.minBytes / 1024)} KB`)
  }
  if (profile.fileSize?.maxBytes !== undefined) {
    parts.push(`≤ ${Math.round(profile.fileSize.maxBytes / 1024)} KB`)
  }
  if (profile.background === 'white') {
    parts.push('white bg')
  }
  // Descriptive only — validation stays pixel-based (D043).
  if (profile.physicalSizeMm && profile.dpi) {
    parts.push(
      `${profile.physicalSizeMm.width} × ${profile.physicalSizeMm.height} mm @ ${profile.dpi} DPI`,
    )
  }

  return parts.length > 0 ? parts.join(' · ') : 'No fixed technical target'
}
