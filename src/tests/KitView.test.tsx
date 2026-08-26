import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KitView } from '../features/kit/KitView'
import { FORM_PRESETS } from '../domain/presets/registry'

describe('KitView', () => {
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
    expect(screen.getByText(preset.name)).toBeInTheDocument()
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
})
