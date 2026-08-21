import { vi } from 'vitest'
import type { CanvasFactory, CanvasLike, DrawableSource } from '../processing'

export function createFakeContext() {
  return {
    drawImage: vi.fn(),
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

export function fakeSource(width: number, height: number): DrawableSource {
  return { width, height } as unknown as DrawableSource
}
