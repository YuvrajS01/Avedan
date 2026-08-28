import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BatchView } from '../features/batch/BatchView'
import * as batchProcessModule from '../features/batch/batchProcess'
import type { ProcessedAsset } from '../domain/jobs/result'

vi.mock('../features/batch/batchProcess', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/batch/batchProcess')>()
  return {
    ...actual,
    processBatchPhotos: vi.fn(),
  }
})

const mockedBatch = vi.mocked(batchProcessModule.processBatchPhotos)

function fakeAsset(name: string): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
    url: `blob:${name}`,
    fileName: `${name}-avedan.jpg`,
    width: 300,
    height: 400,
    format: 'jpeg',
    sizeBytes: 3,
    quality: 0.85,
    outcome: 'ok',
    validation: { status: 'pass', checks: [{ id: 'dimensions', label: '300 × 400 px', status: 'pass' }] },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = '#/batch'
})

describe('BatchView (T026)', () => {
  it('renders intake with requirements and drop zone', () => {
    render(<BatchView />)
    expect(screen.getByRole('heading', { name: /batch photos/i })).toBeInTheDocument()
    expect(screen.getByText(/Target:/i)).toBeInTheDocument()
    expect(screen.getByText(/Add photos/i)).toBeInTheDocument()
    expect(screen.getByText(/your images stay on this device/i)).toBeInTheDocument()
  })

  it('queues multiple files and shows count', async () => {
    const user = userEvent.setup()
    render(<BatchView />)
    const input = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' })]
    await user.upload(input, files)
    expect(screen.getAllByText(/2 files queued/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/a\.jpg/i)).toBeInTheDocument()
    expect(screen.getByText(/b\.jpg/i)).toBeInTheDocument()
  })

  it('shows preset context when a preset is active', async () => {
    window.location.hash = '#/batch?preset=example-exam-413x531'
    render(<BatchView />)
    expect(await screen.findByText(/Form preset:/i)).toBeInTheDocument()
    expect(screen.getByText(/Example exam form/i)).toBeInTheDocument()
    window.location.hash = '#/batch'
  })

  it('processes batch sequentially and shows per-file results + ZIP', async () => {
    const user = userEvent.setup()
    mockedBatch.mockImplementation(async (files) => {
      return files.map((file, index) => ({
        id: `${file.name}-${index}`,
        file,
        status: 'done' as const,
        asset: fakeAsset(file.name),
      }))
    })
    render(<BatchView />)
    const input = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(input, [new File(['x'], 'a.jpg', { type: 'image/jpeg' }), new File(['y'], 'b.jpg', { type: 'image/jpeg' })])
    await user.click(screen.getByRole('button', { name: /process 2 photos/i }))
    expect(await screen.findByText(/2 of 2 passed/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Passed$/i).length).toBe(2)
    expect(screen.getAllByRole('link', { name: /download/i }).length).toBe(2)
    expect(screen.getByRole('button', { name: /download zip/i })).toBeEnabled()
  })

  it('shows per-file errors without aborting', async () => {
    const user = userEvent.setup()
    mockedBatch.mockImplementation(async (files) => {
      return [
        { id: 'a', file: files[0], status: 'done' as const, asset: fakeAsset(files[0].name) },
        { id: 'b', file: files[1], status: 'error' as const, error: 'Corrupt file' },
      ]
    })
    render(<BatchView />)
    const input = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(input, [new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' })])
    await user.click(screen.getByRole('button', { name: /process 2 photos/i }))
    expect(await screen.findByText(/1 of 2 passed/i)).toBeInTheDocument()
    expect(screen.getByText(/corrupt file/i)).toBeInTheDocument()
  })

  it('creates ZIP from successful assets and shows re-download', async () => {
    const user = userEvent.setup()
    mockedBatch.mockImplementation(async (files) =>
      files.map((file, i) => ({ id: `${i}`, file, status: 'done' as const, asset: fakeAsset(file.name) })),
    )
    const originalCreate = global.URL.createObjectURL
    const originalRevoke = global.URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:zip-test') as unknown as typeof URL.createObjectURL
    global.URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL
    render(<BatchView />)
    const input = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(input, [new File(['x'], 'a.jpg', { type: 'image/jpeg' })])
    await user.click(screen.getByRole('button', { name: /process 1 photos/i }))
    await screen.findByText(/1 of 1 passed/i)
    await user.click(screen.getByRole('button', { name: /download zip/i }))
    expect(await screen.findByText(/re-download zip/i)).toBeInTheDocument()
    global.URL.createObjectURL = originalCreate
    global.URL.revokeObjectURL = originalRevoke
  })

  it('clears batch on Clear', async () => {
    const user = userEvent.setup()
    render(<BatchView />)
    const input = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(input, [new File(['x'], 'a.jpg', { type: 'image/jpeg' })])
    expect(screen.getAllByText(/1 files queued/i).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /^clear$/i }))
    expect(screen.queryAllByText(/1 files queued/i).length).toBe(0)
  })

  it('imports CSV dataset and shows preview and matching', async () => {
    const user = userEvent.setup()
    render(<BatchView />)
    // Open dataset disclosure
    await user.click(screen.getByText(/Import dataset \(CSV\)/i))
    const csvInput = screen.getByLabelText(/Import dataset CSV/i) as HTMLInputElement
    const csvContent = 'id,name,photo\n1,Rahul,rahul.jpg\n2,Anita,anita.jpg'
    const csvFile = new File([csvContent], 'data.csv', { type: 'text/csv' })
    await user.upload(csvInput, csvFile)
    expect(await screen.findByText(/2 rows, columns: id, name, photo/i)).toBeInTheDocument()
    expect(screen.getByText('Rahul')).toBeInTheDocument()
    // Now add matching files
    const photoInput = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(photoInput, [new File(['a'], 'rahul.jpg', { type: 'image/jpeg' }), new File(['b'], 'anita.jpg', { type: 'image/jpeg' })])
    expect(await screen.findByText(/2 of 2 files matched/i)).toBeInTheDocument()
    expect(screen.getByText(/0 unmatched files/i)).toBeInTheDocument()
  })

  it('reports unmatched files and rows', async () => {
    const user = userEvent.setup()
    render(<BatchView />)
    await user.click(screen.getByText(/Import dataset \(CSV\)/i))
    const csvInput = screen.getByLabelText(/Import dataset CSV/i) as HTMLInputElement
    const csvFile = new File(['id,photo\n1,rahul.jpg'], 'data.csv', { type: 'text/csv' })
    await user.upload(csvInput, csvFile)
    await screen.findByText(/1 rows/i)
    const photoInput = screen.getByLabelText(/upload batch photos/i) as HTMLInputElement
    await user.upload(photoInput, [new File(['a'], 'rahul.jpg', { type: 'image/jpeg' }), new File(['b'], 'extra.jpg', { type: 'image/jpeg' })])
    expect(await screen.findByText(/1 of 2 files matched/i)).toBeInTheDocument()
    expect(screen.getByText(/1 unmatched files/i)).toBeInTheDocument()
  })
})
