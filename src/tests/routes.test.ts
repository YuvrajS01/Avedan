import { describe, expect, it } from 'vitest'
import { hashForRoute, routeFromHash, ROUTES } from '../app/routes'

describe('routeFromHash', () => {
  it('maps known hashes to routes', () => {
    expect(routeFromHash('#/photo')).toBe('photo')
    expect(routeFromHash('#/signature')).toBe('signature')
    expect(routeFromHash('#/thumb')).toBe('thumb')
    expect(routeFromHash('#/kit')).toBe('kit')
    expect(routeFromHash('#/batch')).toBe('batch')
    expect(routeFromHash('#/document')).toBe('document')
    expect(routeFromHash('#/forms')).toBe('forms')
    expect(routeFromHash('#/')).toBe('home')
  })

  it('treats an empty hash as home', () => {
    expect(routeFromHash('')).toBe('home')
    expect(routeFromHash('#')).toBe('home')
  })

  it('falls back to home for unknown hashes', () => {
    expect(routeFromHash('#/unknown')).toBe('home')
    expect(routeFromHash('#photo')).toBe('home')
  })
})

describe('hashForRoute', () => {
  it('round-trips every route', () => {
    for (const route of ROUTES) {
      expect(routeFromHash(hashForRoute(route))).toBe(route)
    }
  })
})

import { parseHash } from '../app/routes'

describe('parseHash', () => {
  it('extracts the preset query parameter', () => {
    expect(parseHash('#/photo?preset=example-exam')).toEqual({
      route: 'photo',
      presetId: 'example-exam',
    })
  })

  it('omits presetId when absent or empty', () => {
    expect(parseHash('#/photo')).toEqual({ route: 'photo', presetId: undefined })
    expect(parseHash('#/photo?preset=')).toEqual({ route: 'photo', presetId: undefined })
  })

  it('encodes and decodes preset ids safely', () => {
    expect(parseHash(hashForRoute('photo', 'example exam'))).toEqual({
      route: 'photo',
      presetId: 'example exam',
    })
  })

  it('still falls back to home for unknown paths with queries', () => {
    expect(parseHash('#/nope?preset=x').route).toBe('home')
  })
})
