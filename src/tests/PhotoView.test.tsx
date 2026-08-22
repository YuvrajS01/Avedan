import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoView } from '../features/photo/PhotoView'
import { loadPhotoSource, processPhoto } from '../features/photo/processPhoto'
import type { ProcessedPhoto } from '../features/photo/processPhoto'

vi.mock('../features/photo/processPhoto', () => ({
  loadPhotoSource: vi.fn(),
  processPhoto: vi.fn(),
  revokeObjectUrl: vi.fn(),
}))

const mockedLoad = vi.mocked(loadPhotoSource)
const mockedProcess = vi.mocked(processPhoto)

function fakeResult(overrides: Partial<ProcessedPhoto> = {}): ProcessedPhoto {
  return {
    blob: new Blob([new Uint8Array(20480)], { type: 'image/jpeg' }),
    url: 'blob:processed',
    fileName: 'photo-avedan.jpg',
    width: 300,
    height: 400,
    format: 'jpeg',
    sizeBytes: 20480,
    quality: 0.82,
    outcome: 'ok',
    validation: {
      status: 'pass',
      checks: [
        { id: 'dimensions', label: '300 × 400 px', status: 'pass', details: 'Required 300 × 400 px' },
        { id: 'file-size-max', label: '20 KB — limit 50 KB', status: 'pass' },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => {
  mockedLoad.mockReset()
  mockedProcess.mockReset()
})

describe('PhotoView flow', () => {
  it('starts at intake with a privacy message and target requirements', () => {
    render(<PhotoView />)
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
    expect(screen.getByText(/never uploaded/i)).toBeInTheDocument()
    expect(screen.getByText(/Target:/i)).toHaveTextContent('300 × 400 px · JPEG')
  })

  it('moves to the crop step after choosing a file', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1200, height: 1600 } as never,
      previewUrl: 'blob:source',
      fileName: 'me.jpg',
    })
    render(<PhotoView />)

    await user.upload(
      screen.getByLabelText(/upload photo/i),
      new File(['image'], 'me.jpg', { type: 'image/jpeg' }),
    )

    expect(await screen.findByRole('heading', { name: 'Crop your photo' })).toBeInTheDocument()
    expect(mockedLoad).toHaveBeenCalledTimes(1)
  })

  it('shows an error when the file cannot be opened', async () => {
    const user = userEvent.setup()
    mockedLoad.mockRejectedValue(
      Object.assign(new Error('This file is empty. Choose a valid image file.'), {
        name: 'ProcessingError',
      }),
    )
    render(<PhotoView />)

    await user.upload(
      screen.getByLabelText(/upload photo/i),
      new File([], 'empty.jpg', { type: 'image/jpeg' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(/this file is empty/i)
  })

  it('produces a result with metadata and a download link', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1200, height: 1600 } as never,
      previewUrl: 'blob:source',
      fileName: 'me.jpg',
    })
    mockedProcess.mockResolvedValue(fakeResult())
    render(<PhotoView />)

    await user.upload(
      screen.getByLabelText(/upload photo/i),
      new File(['image'], 'me.jpg', { type: 'image/jpeg' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Your photo is ready' })).toBeInTheDocument()
    expect(screen.getAllByText('300 × 400 px').length).toBeGreaterThan(0)
    expect(screen.getByText('20.0 KB')).toBeInTheDocument()
    const download = screen.getByRole('link', { name: /download/i })
    expect(download).toHaveAttribute('download', 'photo-avedan.jpg')
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'me.jpg' }),
    )
  })

  it('returns to intake from the result via Make another', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1200, height: 1600 } as never,
      previewUrl: '',
      fileName: 'me.jpg',
    })
    mockedProcess.mockResolvedValue(fakeResult())
    render(<PhotoView />)

    await user.upload(
      screen.getByLabelText(/upload photo/i),
      new File(['image'], 'me.jpg', { type: 'image/jpeg' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('button', { name: 'Make another' }))

    expect(
      await screen.findByRole('button', { name: 'Upload photo' }),
    ).toBeInTheDocument()
  })

  it('autofills manual fields when a preset is loaded', async () => {
    const user = userEvent.setup()
    render(<PhotoView />)

    await user.selectOptions(screen.getByLabelText(/load preset/i), 'portrait-3x4')

    expect(screen.getByText(/Target:/i)).toHaveTextContent('300 × 400 px · JPEG')
  })

  it('reflects the white-background option in the target summary', async () => {
    const user = userEvent.setup()
    render(<PhotoView />)

    expect(screen.queryByText(/white bg/i)).not.toBeInTheDocument()
    await user.click(screen.getByLabelText(/lighten a plain background/i))

    expect(screen.getByText(/Target:/i)).toHaveTextContent('white bg')
  })
})

describe('PhotoView with form presets', () => {
  it('uses the preset requirements when the hash carries a preset id', () => {
    window.location.hash = '#/photo?preset=example-exam-413x531'
    render(<PhotoView />)
    expect(screen.getByText(/form preset:/i)).toHaveTextContent('Example exam form (35 × 45 mm)')
    expect(screen.getByText(/Target:/i)).toHaveTextContent('413 × 531 px · JPEG · ≥ 20 KB · ≤ 50 KB')
    expect(screen.getByRole('button', { name: /use generic settings instead/i })).toBeInTheDocument()
    window.location.hash = '#/'
  })

  it('autofills both size bounds from a ranged preset', () => {
    window.location.hash = '#/photo?preset=example-exam-413x531'
    render(<PhotoView />)
    expect(screen.getByLabelText('Min size (KB)')).toHaveValue(20)
    expect(screen.getByLabelText('Max size (KB)')).toHaveValue(50)
    window.location.hash = '#/'
  })

  it('keeps the full size range when switching to generic settings', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/photo?preset=example-exam-413x531'
    render(<PhotoView />)
    await user.click(screen.getByRole('button', { name: /use generic settings instead/i }))
    expect(await screen.findByText(/Target:/i)).toHaveTextContent(
      '413 × 531 px · JPEG · ≥ 20 KB · ≤ 50 KB',
    )
    window.location.hash = '#/'
  })

  it('applies manual edits while a form preset is active', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/photo?preset=example-exam-413x531'
    render(<PhotoView />)
    await user.clear(screen.getByLabelText('Width (px)'))
    await user.type(screen.getByLabelText('Width (px)'), '350')
    expect(screen.getByText(/Target:/i)).toHaveTextContent('350 × 531 px')
    window.location.hash = '#/'
  })
})
