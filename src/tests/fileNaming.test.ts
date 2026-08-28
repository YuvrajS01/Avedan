import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  renderFileName,
  dedupeFileNames,
  sanitizeFileNamePart,
  getNamingTemplate,
  setNamingTemplate,
  NAMING_TEMPLATE_DEFAULT,
} from '../domain/naming/fileNaming'

describe('sanitizeFileNamePart (T027)', () => {
  it('replaces illegal chars and trims', () => {
    expect(sanitizeFileNamePart('a/b\\c:d')).toBe('a_b_c_d')
    expect(sanitizeFileNamePart('  hello  ')).toBe('hello')
    expect(sanitizeFileNamePart('')).toBe('file')
    expect(sanitizeFileNamePart('...')).toBe('file')
    expect(sanitizeFileNamePart('a<b>c')).toBe('a_b_c')
  })
})

describe('renderFileName (T027)', () => {
  it('uses default template when empty', () => {
    expect(
      renderFileName('', { original: 'rahul', index: 1, kind: 'photo', preset: 'manual', ext: 'jpg' }),
    ).toBe('rahul-avedan.jpg')
    expect(
      renderFileName('   ', { original: 'rahul', index: 1, kind: 'photo', preset: 'manual', ext: 'jpg' }),
    ).toBe('rahul-avedan.jpg')
  })

  it('replaces all tokens', () => {
    const template = '{original}_{index}_{kind}_{preset}.{ext}'
    expect(
      renderFileName(template, { original: 'rahul', index: 2, kind: 'photo', preset: 'my-preset', ext: 'png' }),
    ).toBe('rahul_2_photo_my-preset.png')
  })

  it('appends extension when template lacks it', () => {
    expect(
      renderFileName('{original}_{index}', { original: 'a', index: 1, kind: 'photo', preset: 'p', ext: 'jpg' }),
    ).toBe('a_1.jpg')
  })

  it('does not double-append extension', () => {
    expect(
      renderFileName('{original}.{ext}', { original: 'a', index: 1, kind: 'photo', preset: 'p', ext: 'jpg' }),
    ).toBe('a.jpg')
    expect(
      renderFileName('{original}.jpg', { original: 'a', index: 1, kind: 'photo', preset: 'p', ext: 'jpg' }),
    ).toBe('a.jpg')
  })

  it('sanitizes rendered name', () => {
    expect(
      renderFileName('{original}', { original: 'a/b', index: 1, kind: 'photo', preset: 'p', ext: 'jpg' }),
    ).toBe('a_b.jpg')
    expect(
      renderFileName('{preset}', { original: 'a', index: 1, kind: 'photo', preset: 'my/preset', ext: 'jpg' }),
    ).toBe('my_preset.jpg')
  })

  it('handles missing tokens gracefully', () => {
    expect(
      renderFileName('photo_{index}', { original: 'rahul', index: 1, kind: 'photo', preset: 'p', ext: 'jpg' }),
    ).toBe('photo_1.jpg')
  })

  it('replaces csv tokens when dataset row is present (T028)', () => {
    expect(
      renderFileName('{csv.id}_{original}', {
        original: 'rahul',
        index: 1,
        kind: 'photo',
        preset: 'p',
        ext: 'jpg',
        csv: { id: '123', name: 'Rahul' },
      }),
    ).toBe('123_rahul.jpg')
    expect(
      renderFileName('{csv.name}_{index}', {
        original: 'a',
        index: 2,
        kind: 'photo',
        preset: 'p',
        ext: 'jpg',
        csv: { name: 'Anita' },
      }),
    ).toBe('Anita_2.jpg')
    // Missing csv key becomes empty -> sanitized to "file" fallback via ext handling
    expect(
      renderFileName('{csv.missing}_{original}', {
        original: 'a',
        index: 1,
        kind: 'photo',
        preset: 'p',
        ext: 'jpg',
        csv: {},
      }),
    ).toBe('file_a.jpg')
    // Case-insensitive csv keys
    expect(
      renderFileName('{csv.ID}', {
        original: 'a',
        index: 1,
        kind: 'photo',
        preset: 'p',
        ext: 'jpg',
        csv: { id: '999' },
      }),
    ).toBe('999.jpg')
  })
})

describe('dedupeFileNames (T027)', () => {
  it('leaves unique names unchanged', () => {
    expect(dedupeFileNames(['a.jpg', 'b.jpg', 'c.jpg'])).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
  })

  it('appends -2, -3 for collisions (case-insensitive)', () => {
    expect(dedupeFileNames(['a.jpg', 'a.jpg', 'a.jpg'])).toEqual(['a.jpg', 'a-2.jpg', 'a-3.jpg'])
    expect(dedupeFileNames(['A.JPG', 'a.jpg'])).toEqual(['A.JPG', 'a-2.jpg'])
  })

  it('handles multiple distinct collisions', () => {
    expect(dedupeFileNames(['a.jpg', 'b.jpg', 'a.jpg', 'b.jpg'])).toEqual([
      'a.jpg',
      'b.jpg',
      'a-2.jpg',
      'b-2.jpg',
    ])
  })
})

describe('getNamingTemplate / setNamingTemplate (T027)', () => {
  const store = new Map<string, string>()
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    length: 0,
    key: () => null,
  } as unknown as Storage

  beforeEach(() => {
    store.clear()
    // Stub both global and window storage for helper
    vi.stubGlobal('localStorage', mockStorage)
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true, configurable: true })
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = mockStorage
  })

  it('returns default when nothing stored', () => {
    expect(getNamingTemplate(undefined)).toBe(NAMING_TEMPLATE_DEFAULT)
    expect(getNamingTemplate('my-preset')).toBe(NAMING_TEMPLATE_DEFAULT)
  })

  it('persists per preset', () => {
    setNamingTemplate('preset-a', '{original}_{index}')
    expect(getNamingTemplate('preset-a')).toBe('{original}_{index}')
    expect(getNamingTemplate('preset-b')).toBe(NAMING_TEMPLATE_DEFAULT)
    expect(getNamingTemplate(undefined)).toBe(NAMING_TEMPLATE_DEFAULT)
  })

  it('persists manual preset', () => {
    setNamingTemplate(undefined, '{original}_{kind}')
    expect(getNamingTemplate(undefined)).toBe('{original}_{kind}')
  })
})
