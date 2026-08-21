import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignatureView } from '../features/signature/SignatureView'
import { loadPhotoSource } from '../features/photo/processPhoto'
import { processSignature } from '../features/signature/processSignature'
import type { ProcessedAsset } from '../domain/jobs/result'

vi.mock('../features/photo/processPhoto', () => ({
  loadPhotoSource: vi.fn(),
  revokeObjectUrl: vi.fn(),
}))

vi.mock('../features/signature/processSignature', () => ({
  processSignature: vi.fn(),
}))

const mockedLoad = vi.mocked(loadPhotoSource)
const mockedProcess = vi.mocked(processSignature)

function fakeResult(overrides: Partial<ProcessedAsset> = {}): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array(10240)], { type: 'image/jpeg' }),
    url: 'blob:sig',
    fileName: 'signature-avedan.jpg',
    width: 300,
    height: 100,
    format: 'jpeg',
    sizeBytes: 10240,
    quality: 0.8,
    outcome: 'ok',
    checks: [{ label: '10 KB — under the 20 KB limit', pass: true }],
    ...overrides,
  }
}

beforeEach(() => {
  mockedLoad.mockReset()
  mockedProcess.mockReset()
})

describe('SignatureView flow', () => {
  it('offers upload and draw options with the target summary', () => {
    render(<SignatureView />)
    expect(screen.getByRole('button', { name: /upload signature/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /draw signature/i })).toBeInTheDocument()
    expect(screen.getByText(/Target:/i)).toHaveTextContent('300 × 100 px · JPEG · ≤ 20 KB')
  })

  it('shows the drawing canvas with disabled undo/clear before drawing', async () => {
    const user = userEvent.setup()
    render(<SignatureView />)
    await user.click(screen.getByRole('button', { name: /draw signature/i }))

    const canvas = screen.getByLabelText(/signature drawing area/i)
    expect(canvas).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('enables finishing after a stroke and passes the canvas to processing', async () => {
    const user = userEvent.setup()
    mockedProcess.mockResolvedValue(fakeResult())
    render(<SignatureView />)
    await user.click(screen.getByRole('button', { name: /draw signature/i }))

    const canvas = screen.getByLabelText(/signature drawing area/i)
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: /your signature is ready/i })).toBeInTheDocument()
    expect(mockedProcess).toHaveBeenCalledTimes(1)
  })

  it('supports undo back to an empty canvas', async () => {
    const user = userEvent.setup()
    render(<SignatureView />)
    await user.click(screen.getByRole('button', { name: /draw signature/i }))

    const canvas = screen.getByLabelText(/signature drawing area/i)
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('processes an uploaded signature through the same engine', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 800, height: 400 } as never,
      previewUrl: '',
      fileName: 'sig.jpg',
    })
    mockedProcess.mockResolvedValue(fakeResult())
    render(<SignatureView />)

    await user.click(screen.getByRole('button', { name: /upload signature/i }))
    await user.upload(
      screen.getByLabelText(/upload signature image/i),
      new File(['x'], 'sig.jpg', { type: 'image/jpeg' }),
    )

    expect(
      await screen.findByRole('heading', { name: /check your signature/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: /your signature is ready/i })).toBeInTheDocument()
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'sig.jpg' }),
    )
  })

  it('returns to the start via Start over', async () => {
    const user = userEvent.setup()
    mockedProcess.mockResolvedValue(fakeResult())
    render(<SignatureView />)
    await user.click(screen.getByRole('button', { name: /draw signature/i }))

    const canvas = screen.getByLabelText(/signature drawing area/i)
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('button', { name: 'Start over' }))

    expect(
      await screen.findByRole('button', { name: /draw signature/i }),
    ).toBeInTheDocument()
  })

  it('surfaces processing errors, e.g. a blank signature', async () => {
    const user = userEvent.setup()
    mockedProcess.mockRejectedValue(
      new Error('No signature content was found. Draw or upload a signature with visible ink.'),
    )
    render(<SignatureView />)
    await user.click(screen.getByRole('button', { name: /draw signature/i }))

    const canvas = screen.getByLabelText(/signature drawing area/i)
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no signature content/i)
  })
})
