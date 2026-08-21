import { describe, expect, it } from 'vitest'
import { hashForRoute, routeFromHash, ROUTES } from '../app/routes'

describe('routeFromHash', () => {
  it('maps known hashes to routes', () => {
    expect(routeFromHash('#/photo')).toBe('photo')
    expect(routeFromHash('#/signature')).toBe('signature')
    expect(routeFromHash('#/forms')).toBe('forms')
    expect(routeFromHash('#/custom')).toBe('custom')
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
