import type { GuidanceHint } from './framing'

/**
 * Face positioning assistance (V2, T013).
 *
 * Progressive enhancement over the browser-native `FaceDetector` API where
 * available: no model downloads, no new dependencies, everything stays on the
 * device. Guidance derives purely from bounding-box geometry so it can be
 * unit-tested without a real detector. Advisory only — never blocks capture.
 *
 * Browsers without a native detector simply never see the face-framing toggle;
 * the T012 quality hints remain the fallback.
 */

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

interface NativeDetection {
  boundingBox: FaceBox
}

/** Minimal structural type for whatever the platform detector returns. */
export interface FaceDetectorLike {
  detect(source: CanvasImageSource): Promise<NativeDetection[]>
}

export function isFaceDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'FaceDetector' in window
}

export function createNativeFaceDetector(): FaceDetectorLike | null {
  if (!isFaceDetectorSupported()) return null
  try {
    const ctor = (
      window as unknown as {
        FaceDetector?: new (options?: {
          fastMode?: boolean
          maxDetectedFaces?: number
        }) => FaceDetectorLike
      }
    ).FaceDetector
    return ctor ? new ctor({ fastMode: true, maxDetectedFaces: 1 }) : null
  } catch {
    return null
  }
}

/** Map the first detected face to plain geometry. Throws if detection fails. */
export async function detectFaceBox(
  detector: FaceDetectorLike,
  source: CanvasImageSource,
): Promise<FaceBox | null> {
  const faces = await detector.detect(source)
  const box = faces[0]?.boundingBox
  if (!box) return null
  return { x: box.x, y: box.y, width: box.width, height: box.height }
}

/*
 * Passport-style framing bands, expressed as ratios of the frame:
 * the face should occupy roughly a quarter to two-thirds of the frame
 * height, sit near the horizontal centre, and not drift too high/low.
 */
const MIN_FACE_HEIGHT_RATIO = 0.22
const MAX_FACE_HEIGHT_RATIO = 0.7
const MAX_CENTER_X_OFFSET = 0.15
const MAX_CENTER_Y_OFFSET = 0.18

/** One actionable positioning hint from face geometry alone. */
export function deriveFaceHint(
  box: FaceBox | null,
  frameWidth: number,
  frameHeight: number,
): GuidanceHint {
  if (!box || frameWidth <= 0 || frameHeight <= 0) {
    return {
      id: 'face-absent',
      severity: 'attention',
      message: 'No face detected — center yourself in the frame.',
    }
  }

  const heightRatio = box.height / frameHeight
  if (heightRatio < MIN_FACE_HEIGHT_RATIO) {
    return { id: 'face-size', severity: 'attention', message: 'Move closer — your face looks small.' }
  }
  if (heightRatio > MAX_FACE_HEIGHT_RATIO) {
    return { id: 'face-size', severity: 'attention', message: 'Move back a little — your face fills the frame.' }
  }

  const centerX = (box.x + box.width / 2) / frameWidth
  if (Math.abs(centerX - 0.5) > MAX_CENTER_X_OFFSET) {
    return { id: 'face-center-x', severity: 'attention', message: 'Center your face horizontally.' }
  }

  const centerY = (box.y + box.height / 2) / frameHeight
  if (Math.abs(centerY - 0.5) > MAX_CENTER_Y_OFFSET) {
    return {
      id: 'face-center-y',
      severity: 'attention',
      message: centerY > 0.5 ? 'Move up a little.' : 'Move down a little.',
    }
  }

  return { id: 'face-ok', severity: 'ok', message: 'Framing looks good.' }
}

/**
 * Merge live-quality and face hints into one message.
 * Light/blur problems outrank face hints (they also make detection
 * unreliable); face hints outrank contrast; anything else falls through.
 */
export function combineHints(
  quality: GuidanceHint | null,
  face: GuidanceHint | null,
): GuidanceHint | null {
  if (!quality && !face) return null
  const qualityAttention = quality?.severity === 'attention'
  const faceAttention = face?.severity === 'attention'

  if (qualityAttention && (quality.id === 'light' || quality.id === 'steady')) {
    return quality
  }
  if (faceAttention) return face
  if (qualityAttention) return quality
  return quality ?? face
}
