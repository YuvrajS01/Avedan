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
    checks: [
      { label: '300 × 400 px', pass: true },
      { label: '20 KB — under the 50 KB limit', pass: true },
    ],
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
    expect(screen.getByText('300 × 400 px')).toBeInTheDocument()
    expect(screen.getByText('20.0 KB')).toBeInTheDocument()
    const download = screen.getByRole('link', { name: /download/i })
    expect(download).toHaveAttribute('download', 'photo-avedan.jpg')
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'me.jpg' }),
    )
  })

  it('returns to intake from the result via Start over', async () => {
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
    await user.click(await screen.findByRole('button', { name: 'Start over' }))

    expect(
      await screen.findByRole('button', { name: 'Upload photo' }),
    ).toBeInTheDocument()
  })

  it('supports custom dimensions in the target summary', async () => {
    const user = userEvent.setup()
    render(<PhotoView />)

    await user.selectOptions(screen.getByLabelText(/target requirements/i), 'custom')
    await user.type(screen.getByLabelText(/width \(px\)/i), '413')
    await user.clear(screen.getByLabelText(/height \(px\)/i))
    await user.type(screen.getByLabelText(/height \(px\)/i), '531')

    expect(screen.getByText(/Target:/i)).toHaveTextContent('413 × 531 px')
  })
})
