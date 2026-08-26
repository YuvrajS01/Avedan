import { describe, expect, it, beforeEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KitView } from '../features/kit/KitView'
import { FORM_PRESETS } from '../domain/presets/registry'
import { clearAllKits, setKitAsset } from '../domain/kit/store'

describe('KitView', () => {
  beforeEach(() => clearAllKits())

  it('shows not-found state when no preset is selected', () => {
    window.location.hash = '#/kit'
    render(<KitView />)
    expect(screen.getByRole('heading', { name: /application kit/i })).toBeInTheDocument()
    expect(screen.getByText(/no preset selected/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /browse forms/i })).toBeInTheDocument()
    window.location.hash = '#/'
  })

  it('renders preset metadata for a thumb kit preset', () => {
    const preset = FORM_PRESETS.find((p) => p.thumbImpression)!
    window.location.hash = `#/kit?preset=${preset.id}`
    render(<KitView />)
    expect(screen.getAllByText(preset.name).length).toBeGreaterThan(0)
    expect(screen.getByText(preset.authority)).toBeInTheDocument()
    expect(screen.getByText(/last verified/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /official source/i })).toHaveAttribute('href', preset.sourceUrl)
    expect(screen.getByText(/technical references only/i)).toBeInTheDocument()
    expect(screen.getByText(/always confirm against the official source/i)).toBeInTheDocument()
    window.location.hash = '#/'
  })

  it('renders required assets data-driven and offers prepare CTAs', async () => {
    const preset = FORM_PRESETS.find((p) => p.thumbImpression)!
    window.location.hash = `#/kit?preset=${preset.id}`
    const user = userEvent.setup()
    render(<KitView />)

    // Data-driven: Photo + Signature + Thumb impression lines
    expect(screen.getByText(/^Photo$/)).toBeInTheDocument()
    expect(screen.getByText(/^Signature$/)).toBeInTheDocument()
    expect(screen.getByText(/^Thumb impression$/)).toBeInTheDocument()
    expect(screen.getAllByText(/240 × 240 px/i).length).toBeGreaterThan(0)

    // Prepare CTAs route correctly
    await user.click(screen.getByRole('button', { name: /prepare photo/i }))
    expect(window.location.hash).toBe(`#/photo?preset=${preset.id}`)

    window.location.hash = `#/kit?preset=${preset.id}`
    await user.click(screen.getByRole('button', { name: /prepare signature/i }))
    expect(window.location.hash).toBe(`#/signature?preset=${preset.id}`)

    window.location.hash = `#/kit?preset=${preset.id}`
    await user.click(screen.getByRole('button', { name: /prepare thumb impression/i }))
    expect(window.location.hash).toBe(`#/thumb?preset=${preset.id}`)

    window.location.hash = '#/'
  })

  it('renders only photo for a photo-only preset', () => {
    const preset = FORM_PRESETS.find((p) => p.id === 'example-white-background')!
    window.location.hash = `#/kit?preset=${preset.id}`
    render(<KitView />)
    expect(screen.getByText(/^Photo$/)).toBeInTheDocument()
    expect(screen.queryByText(/^Signature$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Thumb impression$/)).not.toBeInTheDocument()
    window.location.hash = '#/'
  })

  it('navigates via Forms View kit button', async () => {
    window.location.hash = '#/forms'
    const { FormsView } = await import('../features/forms/FormsView')
    const user = userEvent.setup()
    render(<FormsView />)
    const viewKitButtons = screen.getAllByRole('button', { name: /view kit/i })
    expect(viewKitButtons.length).toBeGreaterThan(0)
    await user.click(viewKitButtons[0])
    expect(window.location.hash).toMatch(/^#\/kit\?preset=/)
    window.location.hash = '#/'
  })

  it('shows prepared status and enables ZIP when assets are stored', async () => {
    const preset = FORM_PRESETS.find((p) => p.thumbImpression)!
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' })
    setKitAsset(preset.id, 'photo', { blob, fileName: 'photo-avedan.jpg', sizeBytes: 4 })
    setKitAsset(preset.id, 'signature', { blob, fileName: 'sig-avedan.jpg', sizeBytes: 4 })
    window.location.hash = `#/kit?preset=${preset.id}`
    render(<KitView />)
    expect(screen.getByText(/2 of 3 prepared/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Prepared —/i).length).toBe(2)
    expect(screen.getAllByText(/Not yet prepared/i).length).toBe(1)
    expect(screen.getByRole('button', { name: /download kit zip/i })).toBeEnabled()
    // Individual download buttons appear for prepared assets
    expect(screen.getAllByRole('button', { name: /download photo/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /download signature/i }).length).toBeGreaterThan(0)
    window.location.hash = '#/'
  })

  it('disables ZIP when nothing prepared', async () => {
    const preset = FORM_PRESETS.find((p) => p.thumbImpression)!
    window.location.hash = `#/kit?preset=${preset.id}`
    render(<KitView />)
    const zipButton = screen.getByRole('button', { name: /download kit zip/i })
    expect(zipButton).toBeDisabled()
    window.location.hash = '#/'
  })

  it('creates ZIP and shows re-download after preparing one asset', async () => {
    const preset = FORM_PRESETS.find((p) => p.thumbImpression)!
    const blob = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' })
    setKitAsset(preset.id, 'photo', { blob, fileName: 'photo-avedan.jpg', sizeBytes: 3 })
    window.location.hash = `#/kit?preset=${preset.id}`
    const user = userEvent.setup()
    // jsdom's URL.createObjectURL may be no-op; stub for test
    const originalCreate = global.URL.createObjectURL
    const originalRevoke = global.URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:zip-test') as unknown as typeof URL.createObjectURL
    global.URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL
    render(<KitView />)
    const enabledZip = screen.getByRole('button', { name: /download kit zip/i })
    expect(enabledZip).toBeEnabled()
    await user.click(enabledZip)
    expect(await screen.findByText(/re-download zip/i)).toBeInTheDocument()
    window.location.hash = '#/'
    global.URL.createObjectURL = originalCreate
    global.URL.revokeObjectURL = originalRevoke
    cleanup()
  })
})
