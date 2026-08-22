import { assessImageQuality, type QualityCheck } from '../../processing/quality'
import { defaultCanvasFactory } from '../../processing/crop'

/**
 * Capture-time framing guidance (V2, T012).
 *
 * Advisory-only feedback computed from the live video preview with the same
 * deterministic pixel heuristics as post-process quality hints — no ML model,
 * nothing leaves the device. Guidance never blocks capture (see D034).
 */

/** Shared shape for all capture-time advisory hints. */
export interface GuidanceHint {
  id: string
  severity: 'attention' | 'ok'
  message: string
}

export interface FramingHint extends GuidanceHint {
  id: 'light' | 'steady' | 'contrast' | 'ok'
}

/** Collapse quality checks into one capture-time hint, most actionable first. */
export function deriveFramingHint(checks: QualityCheck[]): FramingHint {
  const byId = new Map(checks.map((check) => [check.id, check]))
  const brightness = byId.get('brightness')
  const sharpness = byId.get('sharpness')
  const contrast = byId.get('contrast')

  if (brightness?.status === 'attention') {
    return brightness.label.includes('dark')
      ? { id: 'light', severity: 'attention', message: 'Too dark — face a window or brighter light.' }
      : { id: 'light', severity: 'attention', message: 'Too bright — avoid strong light behind you.' }
  }
  if (sharpness?.status === 'attention') {
    return { id: 'steady', severity: 'attention', message: 'Hold steady — the preview looks blurry.' }
  }
  if (contrast?.status === 'attention') {
    return { id: 'contrast', severity: 'attention', message: 'Low contrast — try a plainer background.' }
  }
  return { id: 'ok', severity: 'ok', message: 'Looks good — hold steady and capture.' }
}

const SAMPLE_WIDTH = 160

export interface FramingSample {
  checks: QualityCheck[]
  hint: FramingHint
}

/**
 * Draw the current video frame small and assess it locally.
 * Returns null when there is nothing to assess yet or pixel data is
 * unavailable — guidance must never break the camera flow.
 */
export function sampleVideoFraming(
  video: HTMLVideoElement,
  createCanvas: (width: number, height: number) => ReturnType<typeof defaultCanvasFactory> = defaultCanvasFactory,
): FramingSample | null {
  try {
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    if (!sourceWidth || !sourceHeight) return null

    const width = SAMPLE_WIDTH
    const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * SAMPLE_WIDTH))
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx || typeof ctx.getImageData !== 'function') return null

    ctx.drawImage(video, 0, 0, width, height)
    const image = ctx.getImageData(0, 0, width, height)
    const checks = assessImageQuality(image.data, width, height)
    return { checks, hint: deriveFramingHint(checks) }
  } catch {
    return null
  }
}
