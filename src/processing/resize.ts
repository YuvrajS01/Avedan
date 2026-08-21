import { computeResizeDimensions, type Size } from './geometry'
import { defaultCanvasFactory, drawWithContext, type CanvasFactory, type CanvasLike, type DrawableSource } from './crop'

/**
 * Resize `source` to the exact target dimensions. Large downscales are
 * performed in repeated halving steps for better quality.
 */
export function resizeToCanvas(
  source: DrawableSource,
  target: Size,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): CanvasLike {
  const { width, height } = computeResizeDimensions(
    { width: source.width, height: source.height },
    target,
  )

  let current: DrawableSource = source
  let currentWidth = source.width
  let currentHeight = source.height

  while (currentWidth > width * 2 && currentHeight > height * 2) {
    const nextWidth = Math.max(width, Math.floor(currentWidth / 2))
    const nextHeight = Math.max(height, Math.floor(currentHeight / 2))
    const step = drawWithContext(createCanvas(nextWidth, nextHeight), (ctx) => {
      ctx.drawImage(current, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight)
    })
    current = step as unknown as DrawableSource
    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  return drawWithContext(createCanvas(width, height), (ctx) => {
    ctx.drawImage(current, 0, 0, currentWidth, currentHeight, 0, 0, width, height)
  })
}
