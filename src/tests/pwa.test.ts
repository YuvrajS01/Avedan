import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { releaseSessionAssets } from '../utils/session'

const root = resolve(process.cwd())

describe('web app manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(root, 'public/manifest.webmanifest'), 'utf-8'),
  ) as Record<string, unknown>

  it('declares the required PWA fields', () => {
    expect(manifest.name).toContain('Avedan')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect((manifest.icons as unknown[]).length).toBeGreaterThan(0)
  })

  it('does not declare any network endpoints', () => {
    const serialized = JSON.stringify(manifest)
    expect(serialized.match(/https?:\/\/(?!example)/g) ?? []).toHaveLength(0)
  })
})

describe('service worker', () => {
  const source = readFileSync(resolve(root, 'public/sw.js'), 'utf-8')

  it('caches only same-origin GET requests', () => {
    expect(source).toContain("request.method !== 'GET'")
    expect(source).toContain('url.origin !== self.location.origin')
  })

  it('contains no third-party or analytics endpoints', () => {
    expect(source).not.toMatch(/https?:\/\/(?!localhost)[^\s'"]+/)
    expect(source.toLowerCase()).not.toContain('analytics')
  })

  it('uses a versioned cache and cleans old caches on activate', () => {
    expect(source).toMatch(/const CACHE = 'avedan-v\d+'/)
    expect(source).toContain('caches.delete')
  })
})

describe('releaseSessionAssets', () => {
  it('revokes both preview and result URLs', () => {
    const revoke = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revoke })

    releaseSessionAssets({
      loaded: { source: {} as never, previewUrl: 'blob:a', fileName: 'a.jpg' },
      result: { url: 'blob:b' } as never,
    })

    expect(revoke).toHaveBeenCalledWith('blob:a')
    expect(revoke).toHaveBeenCalledWith('blob:b')
    vi.unstubAllGlobals()
  })

  it('tolerates missing assets and missing API support', () => {
    vi.stubGlobal('URL', {})
    expect(() => releaseSessionAssets({})).not.toThrow()
    vi.unstubAllGlobals()
  })
})
