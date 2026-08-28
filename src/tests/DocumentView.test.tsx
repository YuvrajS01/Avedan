import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentView } from '../features/document/DocumentView'
import { loadPhotoSource } from '../features/photo/processPhoto'
import { processDocument } from '../features/document/processDocument'
import type { ProcessedAsset } from '../domain/jobs/result'

vi.mock('../features/photo/processPhoto', () => ({
  loadPhotoSource: vi.fn(),
  revokeObjectUrl: vi.fn(),
}))

vi.mock('../features/document/processDocument', () => ({
  processDocument: vi.fn(),
}))

const mockedLoad = vi.mocked(loadPhotoSource)
const mockedProcess = vi.mocked(processDocument)

function fakeAsset(): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
    url: '',
    fileName: 'doc-avedan.jpg',
    width: 800,
    height: 1100,
    format: 'jpeg',
    sizeBytes: 3,
    quality: 0.85,
    outcome: 'ok',
    validation: { status: 'pass', checks: [{ id: 'dimensions', label: '800 × 1100 px', status: 'pass' }] },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = '#/document'
})

describe('DocumentView (T030)', () => {
  it('renders intake with requirements and upload', () => {
    render(<DocumentView />)
    expect(screen.getByRole('heading', { name: /document scan/i })).toBeInTheDocument()
    expect(screen.getByText(/Target:/i)).toBeInTheDocument()
    expect(screen.getByText(/Upload document/i)).toBeInTheDocument()
  })

  it('shows preset context when a preset is active', async () => {
    window.location.hash = '#/document?preset=example-exam-413x531'
    render(<DocumentView />)
    expect(await screen.findByText(/Form preset:/i)).toBeInTheDocument()
    window.location.hash = '#/document'
  })

  it('opens adjust step after uploading a document', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1000, height: 800 } as never,
      previewUrl: '',
      fileName: 'doc.jpg',
    })
    render(<DocumentView />)
    const input = screen.getByLabelText(/upload document image/i) as HTMLInputElement
    await user.upload(input, new File(['x'], 'doc.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByRole('heading', { name: /adjust corners/i })).toBeInTheDocument()
    expect(screen.getByText(/Drag the 4 handles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset corners/i })).toBeInTheDocument()
  })

  it('processes document and shows result', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1000, height: 800 } as never,
      previewUrl: '',
      fileName: 'doc.jpg',
    })
    mockedProcess.mockResolvedValue(fakeAsset())
    render(<DocumentView />)
    const input = screen.getByLabelText(/upload document image/i) as HTMLInputElement
    await user.upload(input, new File(['x'], 'doc.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('heading', { name: /adjust corners/i })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: /your document is ready/i })).toBeInTheDocument()
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'doc.jpg' }),
    )
  })

  it('surfaces processing errors', async () => {
    const user = userEvent.setup()
    mockedLoad.mockResolvedValue({
      source: { width: 1000, height: 800 } as never,
      previewUrl: '',
      fileName: 'doc.jpg',
    })
    mockedProcess.mockRejectedValue(new Error('Document processing failed.'))
    render(<DocumentView />)
    const input = screen.getByLabelText(/upload document image/i) as HTMLInputElement
    await user.upload(input, new File(['x'], 'doc.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('heading', { name: /adjust corners/i })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/document processing/i)
  })
})
