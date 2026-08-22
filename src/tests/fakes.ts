import { vi } from 'vitest'
import type { CanvasFactory, CanvasLike, DrawableSource } from '../processing'

export function createFakeContext() {
  return {
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    fillStyle: '',
    strokeStyle: '',
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 1,
    imageSmoothingEnabled: false,
  }
}

export type FakeCanvas = CanvasLike & { ctx: ReturnType<typeof createFakeContext> }

export function createFakeCanvas(width: number, height: number): FakeCanvas {
  const ctx = createFakeContext()
  return {
    width,
    height,
    getContext: vi.fn(() => ctx),
    ctx,
  } as unknown as FakeCanvas
}

export function createRecordingFactory() {
  const canvases: FakeCanvas[] = []
  const factory: CanvasFactory = (width, height) => {
    const canvas = createFakeCanvas(width, height)
    canvases.push(canvas)
    return canvas
  }
  return { factory, canvases }
}

/**
 * Fake canvas whose 2D context returns a solid-color (or custom) RGBA
 * buffer from getImageData, for exercising pixel-reading code paths.
 */
export function createPixelCanvas(
  width: number,
  height: number,
  isWhite: (x: number, y: number) => boolean,
): CanvasLike {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const white = isWhite(x, y)
      data[i] = white ? 255 : 20
      data[i + 1] = white ? 255 : 20
      data[i + 2] = white ? 255 : 20
      data[i + 3] = 255
    }
  }
  const ctx = {
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    getImageData: vi.fn(() => ({ data, width, height })),
    fillStyle: '',
    strokeStyle: '',
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 1,
    imageSmoothingEnabled: false,
  }
  return {
    width,
    height,
    getContext: vi.fn(() => ctx),
    ctx,
  } as unknown as FakeCanvas
}

export function fakeSource(width: number, height: number): DrawableSource {
  return { width, height } as unknown as DrawableSource
}
