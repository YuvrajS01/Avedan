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

/* ---------------------------------------------------------------------- */
/* Auto-crop suggestion from a detected face (V2, T015)                    */
/* ---------------------------------------------------------------------- */

/** Face rectangle normalized to the full image (0–1 on both axes). */
export interface NormalizedFace {
  x: number
  y: number
  width: number
  height: number
}

/** Desired face height as a fraction of the crop-box height. */
export const CANONICAL_FACE_HEIGHT = 0.55
/** Desired vertical face-center position within the box (slightly high). */
export const FACE_TARGET_Y = 0.42
/** Zoom bounds mirror the crop slider. */
const MIN_ZOOM = 1
const MAX_ZOOM = 3

/**
 * Initial zoom + pan that places a detected face at a canonical
 * passport-style position. Pure math; the caller applies (and clamps) the
 * result. When the requested zoom falls outside the slider range it is
 * clamped, and the offsets follow from the clamped zoom.
 */
export function faceFraming(input: {
  boxWidth: number
  boxHeight: number
  imageWidth: number
  imageHeight: number
  face: NormalizedFace
}): { zoom: number; offsetX: number; offsetY: number } {
  const { boxWidth, boxHeight, imageWidth, imageHeight, face } = input

  const faceCenterX = (face.x + face.width / 2) * imageWidth
  const faceCenterY = (face.y + face.height / 2) * imageHeight
  const facePixelHeight = face.height * imageHeight

  const base = coverScale(boxWidth, boxHeight, imageWidth, imageHeight)
  const wantedZoom =
    facePixelHeight > 0
      ? (CANONICAL_FACE_HEIGHT * boxHeight) / facePixelHeight / base
      : MIN_ZOOM
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, wantedZoom))
  const scale = base * zoom

  return {
    zoom,
    // Screen position of the face center is boxCenter + offset +
    // (faceCenter - imageCenter) * scale; solve for the target placement.
    offsetX: scale * (imageWidth / 2 - faceCenterX),
    offsetY: scale * (imageHeight / 2 - faceCenterY) + (FACE_TARGET_Y - 0.5) * boxHeight,
  }
}
