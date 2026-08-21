export type PresetFormat = 'jpeg' | 'png' | 'webp'

export type BackgroundMode = 'original' | 'white' | 'transparent'

export interface PresetDimensions {
  width: number
  height: number
}

export interface PresetFileSizeBytes {
  min?: number
  max?: number
  target?: number
}

export interface PresetRequirements {
  format: PresetFormat
  aspectRatio?: PresetDimensions
  pixelSize?: PresetDimensions
  physicalSizeMm?: PresetDimensions
  dpi?: number
  fileSizeBytes?: PresetFileSizeBytes
  background?: BackgroundMode
}

export type PresetAssetKind = 'photo' | 'signature'

export interface FormPreset {
  id: string
  name: string
  authority: string
  applicationYear?: number
  description?: string
  /** ISO date (YYYY-MM-DD) of the last manual verification of these values. */
  lastVerified: string
  sourceUrl?: string
  photo?: PresetRequirements
  signature?: PresetRequirements
}

function fail(field: string, expected: string): never {
  throw new Error(`Invalid preset: ${field} must be ${expected}`)
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) fail(field, 'a non-empty string')
  return value
}

function assertOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  return assertString(value, field)
}

function assertPositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    fail(field, 'a positive integer')
  }
  return value
}

function assertNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    fail(field, 'a non-negative finite number')
  }
  return value
}

function assertEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    fail(field, `one of ${allowed.join(', ')}`)
  }
  return value as T
}

function assertDimensions(value: unknown, field: string): PresetDimensions {
  if (typeof value !== 'object' || value === null) fail(field, 'an object')
  const record = value as Record<string, unknown>
  return {
    width: assertPositiveInt(record.width, `${field}.width`),
    height: assertPositiveInt(record.height, `${field}.height`),
  }
}

function assertRequirements(value: unknown, field: string): PresetRequirements {
  if (typeof value !== 'object' || value === null) fail(field, 'an object')
  const record = value as Record<string, unknown>

  const requirements: PresetRequirements = {
    format: assertEnum(record.format, `${field}.format`, ['jpeg', 'png', 'webp'] as const),
  }

  if (record.aspectRatio !== undefined) {
    requirements.aspectRatio = assertDimensions(record.aspectRatio, `${field}.aspectRatio`)
  }
  if (record.pixelSize !== undefined) {
    requirements.pixelSize = assertDimensions(record.pixelSize, `${field}.pixelSize`)
  }
  if (record.physicalSizeMm !== undefined) {
    requirements.physicalSizeMm = assertDimensions(record.physicalSizeMm, `${field}.physicalSizeMm`)
  }
  if (record.dpi !== undefined) {
    requirements.dpi = assertPositiveInt(record.dpi, `${field}.dpi`)
  }
  if (record.background !== undefined) {
    requirements.background = assertEnum(record.background, `${field}.background`, [
      'original',
      'white',
      'transparent',
    ] as const)
  }

  if (record.fileSizeBytes !== undefined) {
    if (typeof record.fileSizeBytes !== 'object' || record.fileSizeBytes === null) {
      fail(`${field}.fileSizeBytes`, 'an object')
    }
    const size = record.fileSizeBytes as Record<string, unknown>
    const fileSizeBytes: PresetFileSizeBytes = {}
    if (size.min !== undefined) fileSizeBytes.min = assertNonNegativeNumber(size.min, `${field}.fileSizeBytes.min`)
    if (size.max !== undefined) fileSizeBytes.max = assertNonNegativeNumber(size.max, `${field}.fileSizeBytes.max`)
    if (size.target !== undefined) fileSizeBytes.target = assertNonNegativeNumber(size.target, `${field}.fileSizeBytes.target`)
    if (
      fileSizeBytes.min !== undefined &&
      fileSizeBytes.max !== undefined &&
      fileSizeBytes.min > fileSizeBytes.max
    ) {
      fail(`${field}.fileSizeBytes`, 'have min <= max')
    }
    requirements.fileSizeBytes = fileSizeBytes
  }

  return requirements
}

/** Runtime validation of untrusted preset data against the typed schema. */
export function validateFormPreset(value: unknown): FormPreset {
  if (typeof value !== 'object' || value === null) fail('preset', 'an object')
  const record = value as Record<string, unknown>

  const preset: FormPreset = {
    id: assertString(record.id, 'id'),
    name: assertString(record.name, 'name'),
    authority: assertString(record.authority, 'authority'),
    lastVerified: assertString(record.lastVerified, 'lastVerified'),
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(preset.lastVerified)) {
    fail('lastVerified', 'an ISO date string (YYYY-MM-DD)')
  }

  if (record.applicationYear !== undefined) {
    preset.applicationYear = assertPositiveInt(record.applicationYear, 'applicationYear')
  }
  if (record.description !== undefined) {
    preset.description = assertOptionalString(record.description, 'description')
  }
  if (record.sourceUrl !== undefined) {
    const url = assertOptionalString(record.sourceUrl, 'sourceUrl')
    if (url !== undefined && !/^https?:\/\//.test(url)) fail('sourceUrl', 'an http(s) URL')
    preset.sourceUrl = url
  }

  if (record.photo !== undefined) {
    preset.photo = assertRequirements(record.photo, 'photo')
  }
  if (record.signature !== undefined) {
    preset.signature = assertRequirements(record.signature, 'signature')
  }

  if (!preset.photo && !preset.signature) {
    fail('preset', 'at least one of photo or signature requirements')
  }

  return preset
}
