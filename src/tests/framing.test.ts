import { describe, expect, it } from 'vitest'
import { deriveFramingHint, sampleVideoFraming } from '../features/camera/framing'
import type { QualityCheck } from '../processing/quality'
import type { CanvasLike } from '../processing/crop'

function check(id: string, status: QualityCheck['status'], label?: string): QualityCheck {
  return { id, label: label ?? id, status }
}

describe('deriveFramingHint', () => {
  it('prioritizes darkness over blur and contrast', () => {
    const hint = deriveFramingHint([
      check('brightness', 'attention', 'The photo looks dark'),
      check('sharpness', 'attention', 'The photo may be blurry'),
      check('contrast', 'attention', 'flat'),
    ])
    expect(hint.id).toBe('light')
    expect(hint.severity).toBe('attention')
    expect(hint.message).toMatch(/dark/i)
  })

  it('distinguishes too bright from too dark', () => {
    const hint = deriveFramingHint([
      check('brightness', 'attention', 'The photo looks very bright'),
    ])
    expect(hint.id).toBe('light')
    expect(hint.message).toMatch(/bright/i)
  })

  it('reports blur when lighting is fine', () => {
    const hint = deriveFramingHint([
      check('brightness', 'ok'),
      check('contrast', 'ok'),
      check('sharpness', 'attention', 'The photo may be blurry'),
    ])
    expect(hint.id).toBe('steady')
    expect(hint.severity).toBe('attention')
  })

  it('reports flat contrast before the all-clear', () => {
    const hint = deriveFramingHint([
      check('brightness', 'ok'),
      check('contrast', 'attention', 'washed out'),
      check('sharpness', 'ok'),
    ])
    expect(hint.id).toBe('contrast')
  })

  it('returns an ok hint when every check passes', () => {
    const hint = deriveFramingHint([
      check('brightness', 'ok'),
      check('contrast', 'ok'),
      check('sharpness', 'ok'),
    ])
    expect(hint.severity).toBe('ok')
    expect(hint.id).toBe('ok')
  })
})

describe('sampleVideoFraming', () => {
  function fakeVideo(videoWidth: number, videoHeight: number) {
    return { videoWidth, videoHeight } as HTMLVideoElement
  }

  it('returns null for a video that has no frame yet', () => {
    expect(sampleVideoFraming(fakeVideo(0, 0))).toBeNull()
  })

  it('returns null instead of throwing when pixel data is unavailable', () => {
    // Canvas factory without a 2D context; fail-safe must hold.
    const noContextCanvas = () =>
      ({
        width: 160,
        height: 120,
        getContext: () => null,
      }) as unknown as CanvasLike
    expect(sampleVideoFraming(fakeVideo(640, 480), noContextCanvas)).toBeNull()
  })
})
