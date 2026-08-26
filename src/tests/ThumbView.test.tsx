import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThumbView } from '../features/thumb/ThumbView'
import { loadPhotoSource } from '../features/photo/processPhoto'
import { processThumb } from '../features/thumb/processThumb'
import type { ProcessedAsset } from '../domain/jobs/result'

vi.mock('../features/photo/processPhoto', () => ({
  loadPhotoSource: vi.fn(),
  revokeObjectUrl: vi.fn(),
}))

vi.mock('../features/thumb/processThumb', () => ({
  processThumb: vi.fn(),
}))

const mockedLoad = vi.mocked(loadPhotoSource)
const mockedProcess = vi.mocked(processThumb)

function fakeResult(overrides: Partial<ProcessedAsset> = {}): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array(10240)], { type: 'image/jpeg' }),
    url: 'blob:thumb',
    fileName: 'thumb-avedan.jpg',
    width: 240,
    height: 240,
    format: 'jpeg',
    sizeBytes: 10240,
    quality: 0.8,
    outcome: 'ok',
    validation: {
      status: 'pass',
      checks: [
        { id: 'dimensions', label: '240 × 240 px', status: 'pass', details: 'Within 240 × 240 px' },
        { id: 'file-size-max', label: '10 KB — limit 30 KB', status: 'pass' },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => {
  mockedLoad.mockReset()
  mockedProcess.mockReset()
})

describe('ThumbView flow', () => {
  it('offers upload with the target summary', () => {
    render(<ThumbView />)
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument()
    expect(screen.getByText(/Target:/i)).toHaveTextContent('240 × 240 px · JPEG · ≤ 30 KB')
  })

  it('processes an uploaded thumb impression through the engine', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 800, height: 800 } as never,
      previewUrl: 'blob:preview',
      fileName: 'thumb.jpg',
    })
    mockedProcess.mockResolvedValue(fakeResult())
    render(<ThumbView />)

    await user.upload(
      screen.getByLabelText(/upload thumb impression image/i),
      new File(['x'], 'thumb.jpg', { type: 'image/jpeg' }),
    )

    expect(
      await screen.findByRole('heading', { name: /check your thumb impression/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: /your thumb impression is ready/i })).toBeInTheDocument()
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'thumb.jpg' }),
    )
  })

  it('returns to the start via Make another', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 400, height: 400 } as never,
      previewUrl: 'blob:preview',
      fileName: 'thumb.jpg',
    })
    mockedProcess.mockResolvedValue(fakeResult())
    render(<ThumbView />)

    await user.upload(
      screen.getByLabelText(/upload thumb impression image/i),
      new File(['x'], 'thumb.jpg', { type: 'image/jpeg' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('button', { name: 'Make another' }))

    expect(
      await screen.findByRole('heading', { name: /prepare a thumb impression/i }),
    ).toBeInTheDocument()
  })

  it('surfaces processing errors', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 500, height: 500 } as never,
      previewUrl: 'blob:preview',
      fileName: 'thumb.jpg',
    })
    mockedProcess.mockRejectedValue(new Error('No thumb content was found.'))
    render(<ThumbView />)

    await user.upload(
      screen.getByLabelText(/upload thumb impression image/i),
      new File(['x'], 'thumb.jpg', { type: 'image/jpeg' }),
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no thumb content/i)
  })

  it('shows preset context when a thumb preset is active', async () => {
    window.location.hash = '#/thumb?preset=example-thumb-kit'
    render(<ThumbView />)
    expect(await screen.findByText(/Form preset:/i)).toBeInTheDocument()
    expect(screen.getByText(/Example application kit with thumb impression/i)).toBeInTheDocument()
    window.location.hash = '#/'
  })
})
