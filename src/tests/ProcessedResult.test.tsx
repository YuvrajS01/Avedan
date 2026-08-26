import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcessedResult } from '../components/ProcessedResult'
import type { ProcessedAsset } from '../domain/jobs/result'
import { FORM_PRESETS } from '../domain/presets/registry'

function fakeAsset(overrides: Partial<ProcessedAsset> = {}): ProcessedAsset {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
    url: 'blob:test',
    fileName: 'photo-avedan.jpg',
    width: 350,
    height: 450,
    format: 'jpeg',
    sizeBytes: 30000,
    quality: 0.85,
    outcome: 'ok',
    validation: { status: 'pass', checks: [{ id: 'dimensions', label: '350 × 450 px', status: 'pass' }] },
    ...overrides,
  }
}

describe('ProcessedResult preset-aware (T023)', () => {
  it('renders without preset banner when no preset given', () => {
    render(<ProcessedResult result={fakeAsset()} summary="350 × 450 px · JPEG · ≤ 50 KB" noun="photo" onReset={() => {}} />)
    expect(screen.queryByText(/Validated against/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Technical checks passed does not guarantee acceptance/i)).toBeInTheDocument()
  })

  it('renders preset banner when preset provided', () => {
    const preset = FORM_PRESETS.find((preset) => preset.thumbImpression)!
    render(
      <ProcessedResult
        result={fakeAsset()}
        summary="350 × 450 px · JPEG · ≤ 50 KB"
        noun="photo"
        onReset={() => {}}
        preset={preset}
      />,
    )
    expect(screen.getByText(/Validated against/i)).toBeInTheDocument()
    expect(screen.getByText(preset.name)).toBeInTheDocument()
    expect(screen.getByText(/always confirm against the official source/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /official source/i })).toHaveAttribute('href', preset.sourceUrl)
  })
})
