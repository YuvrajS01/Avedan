import { describe, expect, it } from 'vitest'
import { validateOutput, ASPECT_TOLERANCE } from '../domain/validation/engine'
import type { ImageRequirements } from '../domain/requirements/types'

const FACTS = { width: 300, height: 400, format: 'jpeg' as const, sizeBytes: 40 * 1024 }

function check(result: ReturnType<typeof validateOutput>, id: string) {
  return result.checks.find((c) => c.id === id)
}

describe('validateOutput', () => {
  it('passes every category for a fully compliant output', () => {
    const requirements: ImageRequirements = {
      id: 'x',
      label: 'X',
      dimensions: { width: 300, height: 400 },
      aspectRatio: 3 / 4,
      format: 'jpeg',
      fileSize: { maxBytes: 50 * 1024 },
    }

    const result = validateOutput(requirements, FACTS)

    expect(result.status).toBe('pass')
    expect(check(result, 'dimensions')?.status).toBe('pass')
    expect(check(result, 'aspect-ratio')?.status).toBe('pass')
    expect(check(result, 'format')?.status).toBe('pass')
    expect(check(result, 'file-size-max')?.status).toBe('pass')
  })

  it('reports dimensions and flags mismatches', () => {
    const result = validateOutput(
      { id: 'x', label: 'X', dimensions: { width: 200, height: 260 } },
      FACTS,
    )
    expect(result.status).toBe('attention')
    const dimensions = check(result, 'dimensions')
    expect(dimensions?.status).toBe('attention')
    expect(dimensions?.label).toBe('300 × 400 px')
    expect(dimensions?.details).toContain('200 × 260')
  })

  it('flags aspect ratios beyond the documented tolerance', () => {
    const result = validateOutput({ id: 'x', label: 'X', aspectRatio: 1 }, FACTS)
    expect(check(result, 'aspect-ratio')?.status).toBe('attention')

    const near = validateOutput(
      { id: 'x', label: 'X', aspectRatio: 3 / 4 + ASPECT_TOLERANCE - 0.001 },
      FACTS,
    )
    expect(check(near, 'aspect-ratio')?.status).toBe('pass')
  })

  it('formats aspect ratios as small integer labels', () => {
    const result = validateOutput({ id: 'x', label: 'X', aspectRatio: 1 }, FACTS)
    expect(check(result, 'aspect-ratio')?.label).toBe('Aspect ratio 3:4')
  })

  it('compares the actual output format', () => {
    const result = validateOutput({ id: 'x', label: 'X', format: 'png' }, FACTS)
    expect(check(result, 'format')?.status).toBe('attention')
    expect(check(result, 'format')?.label).toBe('JPEG')
  })

  it('enforces maximum and minimum byte sizes', () => {
    const over = validateOutput(
      { id: 'x', label: 'X', fileSize: { maxBytes: 30 * 1024 } },
      FACTS,
    )
    expect(over.status).toBe('attention')
    expect(check(over, 'file-size-max')?.status).toBe('attention')

    const under = validateOutput(
      { id: 'x', label: 'X', fileSize: { minBytes: 50 * 1024 } },
      FACTS,
    )
    expect(under.status).toBe('attention')
    expect(check(under, 'file-size-min')?.status).toBe('attention')

    const inside = validateOutput(
      { id: 'x', label: 'X', fileSize: { minBytes: 30 * 1024, maxBytes: 50 * 1024 } },
      FACTS,
    )
    expect(inside.status).toBe('pass')
  })

  it('treats a target size as an upper bound', () => {
    const result = validateOutput(
      { id: 'x', label: 'X', fileSize: { targetBytes: 32 * 1024 } },
      FACTS,
    )
    expect(check(result, 'file-size-max')?.status).toBe('attention')
  })

  it('marks unconstrained categories as not-run without failing the result', () => {
    const result = validateOutput({ id: 'x', label: 'X' }, FACTS)

    expect(result.status).toBe('pass')
    for (const id of ['dimensions', 'aspect-ratio', 'format', 'file-size-max']) {
      expect(check(result, id)?.status).toBe('not-run')
    }
  })

  it('supports within-mode dimension checks for signatures', () => {
    const requirements: ImageRequirements = {
      id: 'x',
      label: 'X',
      dimensions: { width: 300, height: 100 },
    }
    const fits = validateOutput(requirements, { ...FACTS, width: 280, height: 93 }, {
      dimensionMode: 'within',
    })
    expect(check(fits, 'dimensions')?.status).toBe('pass')

    const tooBig = validateOutput(requirements, FACTS, { dimensionMode: 'within' })
    expect(check(tooBig, 'dimensions')?.status).toBe('attention')
  })

  it('never uses official-acceptance language', () => {
    const result = validateOutput(
      { id: 'x', label: 'X', dimensions: { width: 1, height: 1 }, format: 'png' },
      FACTS,
    )
    const serialized = JSON.stringify(result).toLowerCase()
    expect(serialized).not.toContain('guarantee')
    expect(serialized).not.toContain('approved')
    expect(serialized).not.toContain('official')
  })
})
