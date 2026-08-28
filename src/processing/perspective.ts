import type { DrawableSource } from './crop'
import { defaultCanvasFactory, type CanvasLike } from './crop'

export interface Point {
  x: number
  y: number
}

export interface Quad {
  tl: Point
  tr: Point
  br: Point
  bl: Point
}

/**
 * Compute affine transform that maps src triangle to dest triangle.
 * Returns [a, b, c, d, e, f] for ctx.setTransform(a, b, c, d, e, f) where
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 */
function affineForTriangle(
  src0: Point,
  src1: Point,
  src2: Point,
  dest0: Point,
  dest1: Point,
  dest2: Point,
): [number, number, number, number, number, number] {
  // Solve for a,c,e from x' equations and b,d,f from y' equations
  // Using matrix inversion for 3 points (affine has 6 unknowns, 6 equations)
  const A11 = src0.x
  const A12 = src0.y
  const A13 = 1
  const A21 = src1.x
  const A22 = src1.y
  const A23 = 1
  const A31 = src2.x
  const A32 = src2.y
  const A33 = 1

  const det = A11 * (A22 * A33 - A23 * A32) - A12 * (A21 * A33 - A23 * A31) + A13 * (A21 * A32 - A22 * A31)
  if (Math.abs(det) < 1e-6) {
    // Degenerate triangle, fallback to identity
    return [1, 0, 0, 1, 0, 0]
  }
  const invDet = 1 / det
  // Inverse of src matrix
  const B11 = (A22 * A33 - A23 * A32) * invDet
  const B12 = (A13 * A32 - A12 * A33) * invDet
  const B13 = (A12 * A23 - A13 * A22) * invDet
  const B21 = (A23 * A31 - A21 * A33) * invDet
  const B22 = (A11 * A33 - A13 * A31) * invDet
  const B23 = (A13 * A21 - A11 * A23) * invDet
  const B31 = (A21 * A32 - A22 * A31) * invDet
  const B32 = (A12 * A31 - A11 * A32) * invDet
  const B33 = (A11 * A22 - A12 * A21) * invDet

  // Solve for a,c,e using dest x
  const a = B11 * dest0.x + B12 * dest1.x + B13 * dest2.x
  const c = B21 * dest0.x + B22 * dest1.x + B23 * dest2.x
  const e = B31 * dest0.x + B32 * dest1.x + B33 * dest2.x
  // Solve for b,d,f using dest y
  const b = B11 * dest0.y + B12 * dest1.y + B13 * dest2.y
  const d = B21 * dest0.y + B22 * dest1.y + B23 * dest2.y
  const f = B31 * dest0.y + B32 * dest1.y + B33 * dest2.y

  return [a, b, c, d, e, f]
}

function drawTri(
  ctx: CanvasRenderingContext2D,
  source: DrawableSource,
  srcTri: [Point, Point, Point],
  destTri: [Point, Point, Point],
): void {
  const [a, b, c, d, e, f] = affineForTriangle(srcTri[0], srcTri[1], srcTri[2], destTri[0], destTri[1], destTri[2])
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(destTri[0].x, destTri[0].y)
  ctx.lineTo(destTri[1].x, destTri[1].y)
  ctx.lineTo(destTri[2].x, destTri[2].y)
  ctx.closePath()
  ctx.clip()
  ctx.setTransform(a, b, c, d, e, f)
  ctx.drawImage(source as unknown as CanvasImageSource, 0, 0)
  ctx.restore()
}

/**
 * Perspective-correct a quadrilateral to a rectangle.
 * Splits the quad into two triangles and draws each with an affine transform,
 * which approximates the perspective warp without needing a full homography
 * or external library. Deterministic, no deps, testable.
 *
 * @param source - decoded image source
 * @param quad - 4 points in source pixel coordinates (tl, tr, br, bl)
 * @param targetWidth - output width in pixels
 * @param targetHeight - output height in pixels
 */
export function correctPerspective(
  source: DrawableSource,
  quad: Quad,
  targetWidth: number,
  targetHeight: number,
  createCanvas: (width: number, height: number) => CanvasLike = defaultCanvasFactory,
): CanvasLike {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // Dest rectangle
  const destTl: Point = { x: 0, y: 0 }
  const destTr: Point = { x: targetWidth, y: 0 }
  const destBr: Point = { x: targetWidth, y: targetHeight }
  const destBl: Point = { x: 0, y: targetHeight }

  // Fill white background (documents are on white)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  // Two triangles: tl-tr-br and tl-br-bl
  drawTri(ctx, source, [quad.tl, quad.tr, quad.br], [destTl, destTr, destBr])
  drawTri(ctx, source, [quad.tl, quad.br, quad.bl], [destTl, destBr, destBl])

  return canvas
}

/**
 * Default quad inset by 5% — useful as initial corners for the UI when
 * auto-detection is unavailable. Never touches image edges to make handles visible.
 */
export function defaultQuadForImage(width: number, height: number, insetRatio = 0.05): Quad {
  const insetX = width * insetRatio
  const insetY = height * insetRatio
  return {
    tl: { x: insetX, y: insetY },
    tr: { x: width - insetX, y: insetY },
    br: { x: width - insetX, y: height - insetY },
    bl: { x: insetX, y: height - insetY },
  }
}

/**
 * Clamp quad points inside the source image bounds.
 */
export function clampQuad(quad: Quad, width: number, height: number): Quad {
  const clamp = (point: Point): Point => ({
    x: Math.min(Math.max(point.x, 0), width),
    y: Math.min(Math.max(point.y, 0), height),
  })
  return {
    tl: clamp(quad.tl),
    tr: clamp(quad.tr),
    br: clamp(quad.br),
    bl: clamp(quad.bl),
  }
}
