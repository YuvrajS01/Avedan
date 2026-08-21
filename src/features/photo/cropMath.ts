import type { Rect } from '../../processing/geometry'

export interface CropViewState {
  boxWidth: number
  boxHeight: number
  imageWidth: number
  imageHeight: number
  zoom: number
  offsetX: number
  offsetY: number
}

/**
 * Inline sizing for the crop box. Width is capped so the derived height
 * (`width / aspectRatio`) never exceeds the viewport cap — otherwise a CSS
 * max-height clamp would break the target aspect ratio and the exported
 * photo would come out distorted.
 */
export function cropBoxStyle(aspectRatio: number): {
  aspectRatio: string
  width: string
} {
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 3 / 4
  return {
    aspectRatio: String(ratio),
    width: `min(100%, calc(60vh * ${ratio}))`,
  }
}

/** Scale at which the image fully covers the box (CSS "cover"). */
export function coverScale(
  boxWidth: number,
  boxHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (boxWidth <= 0 || boxHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return 1
  }
  return Math.max(boxWidth / imageWidth, boxHeight / imageHeight)
}

/**
 * Clamp pan offsets so the image never reveals empty space:
 * the image must keep covering the box on both axes.
 */
export function clampPan(view: CropViewState): { offsetX: number; offsetY: number } {
  const s = coverScale(view.boxWidth, view.boxHeight, view.imageWidth, view.imageHeight) * view.zoom
  const slackX = (view.imageWidth * s - view.boxWidth) / 2
  const slackY = (view.imageHeight * s - view.boxHeight) / 2
  return {
    offsetX: Math.min(Math.max(view.offsetX, -slackX), slackX),
    offsetY: Math.min(Math.max(view.offsetY, -slackY), slackY),
  }
}

/**
 * Map the visible box area back to source-image pixel coordinates.
 * The returned rect always has the box's aspect ratio and lies inside
 * the source image.
 */
export function sourceCropRect(view: CropViewState): Rect {
  const scale = coverScale(view.boxWidth, view.boxHeight, view.imageWidth, view.imageHeight) * view.zoom

  if (
    view.boxWidth <= 0 ||
    view.boxHeight <= 0 ||
    !Number.isFinite(scale) ||
    scale <= 0
  ) {
    return { x: 0, y: 0, width: view.imageWidth, height: view.imageHeight }
  }

  const displayedWidth = view.imageWidth * scale
  const displayedHeight = view.imageHeight * scale
  const left = (view.boxWidth - displayedWidth) / 2 + view.offsetX
  const top = (view.boxHeight - displayedHeight) / 2 + view.offsetY

  let width = Math.round(view.boxWidth / scale)
  let height = Math.round(view.boxHeight / scale)
  let x = Math.max(0, Math.round(-left / scale))
  let y = Math.max(0, Math.round(-top / scale))

  if (x + width > view.imageWidth) x = view.imageWidth - width
  if (y + height > view.imageHeight) y = view.imageHeight - height
  if (width > view.imageWidth) width = view.imageWidth
  if (height > view.imageHeight) height = view.imageHeight

  return { x, y, width, height }
}
