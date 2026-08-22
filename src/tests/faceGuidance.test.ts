import { describe, expect, it, vi } from 'vitest'
import {
  combineHints,
  deriveFaceHint,
  detectFaceBox,
  type FaceBox,
  type FaceDetectorLike,
} from '../features/camera/faceGuidance'
import type { GuidanceHint } from '../features/camera/framing'

const FRAME_W = 640
const FRAME_H = 480

function centeredFace(heightRatio: number): FaceBox {
  const height = FRAME_H * heightRatio
  return {
    x: (FRAME_W - height * 0.75) / 2,
    y: (FRAME_H - height) / 2,
    width: height * 0.75,
    height,
  }
}

function hint(id: string, severity: GuidanceHint['severity']): GuidanceHint {
  return { id, severity, message: id }
}

describe('deriveFaceHint', () => {
  it('asks for a face when none is detected', () => {
    const hint = deriveFaceHint(null, FRAME_W, FRAME_H)
    expect(hint.severity).toBe('attention')
    expect(hint.id).toBe('face-absent')
  })

  it('handles degenerate frame sizes as no face', () => {
    expect(deriveFaceHint(centeredFace(0.5), 0, FRAME_H).id).toBe('face-absent')
  })

  it('asks the user to move closer for a small face', () => {
    const hint = deriveFaceHint(centeredFace(0.1), FRAME_W, FRAME_H)
    expect(hint.message).toMatch(/move closer/i)
  })

  it('asks the user to move back for a face that fills the frame', () => {
    const hint = deriveFaceHint(centeredFace(0.9), FRAME_W, FRAME_H)
    expect(hint.message).toMatch(/move back/i)
  })

  it('detects horizontal off-centering', () => {
    const box = centeredFace(0.4)
    const hint = deriveFaceHint({ ...box, x: box.x + FRAME_W * 0.5 }, FRAME_W, FRAME_H)
    expect(hint.message).toMatch(/horizontally/i)
  })

  it('suggests moving up when the face sits low', () => {
    const box = centeredFace(0.4)
    const hint = deriveFaceHint({ ...box, y: FRAME_H - box.height }, FRAME_W, FRAME_H)
    expect(hint.message).toMatch(/move up/i)
  })

  it('clears to an ok hint for a well-framed face', () => {
    const hint = deriveFaceHint(centeredFace(0.45), FRAME_W, FRAME_H)
    expect(hint.severity).toBe('ok')
    expect(hint.id).toBe('face-ok')
  })
})

describe('combineHints', () => {
  it('returns null when there is nothing to say', () => {
    expect(combineHints(null, null)).toBeNull()
  })

  it('prioritizes light and blur problems over face hints', () => {
    const combined = combineHints(
      hint('light', 'attention'),
      hint('face-size', 'attention'),
    )
    expect(combined?.id).toBe('light')
  })

  it('puts face hints ahead of contrast warnings', () => {
    const combined = combineHints(hint('contrast', 'attention'), hint('face-size', 'attention'))
    expect(combined?.id).toBe('face-size')
  })

  it('falls back to quality hints when detection is unavailable', () => {
    expect(combineHints(hint('contrast', 'attention'), null)?.id).toBe('contrast')
  })

  it('prefers the quality hint when everything is fine', () => {
    expect(combineHints(hint('steady', 'ok'), hint('face-ok', 'ok'))?.id).toBe('steady')
  })
})

describe('detectFaceBox', () => {
  it('maps the first bounding box and returns null without faces', async () => {
    const box: FaceBox = { x: 10, y: 20, width: 30, height: 40 }
    const detector: FaceDetectorLike = {
      detect: vi.fn(async () => [{ boundingBox: box }]),
    }
    await expect(detectFaceBox(detector, {} as CanvasImageSource)).resolves.toEqual(box)

    const empty: FaceDetectorLike = { detect: async () => [] }
    await expect(detectFaceBox(empty, {} as CanvasImageSource)).resolves.toBeNull()
  })

  it('propagates detector failures so callers can fall back', async () => {
    const failing: FaceDetectorLike = { detect: async () => Promise.reject(new Error('busy')) }
    await expect(detectFaceBox(failing, {} as CanvasImageSource)).rejects.toThrow('busy')
  })
})
