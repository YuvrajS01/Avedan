import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormsView } from '../features/forms/FormsView'
import { FORM_PRESETS } from '../domain/presets/registry'

describe('FormsView', () => {
  it('lists presets with authority, summaries and verification badges', () => {
    render(<FormsView />)
    expect(screen.getByText(FORM_PRESETS[0].name)).toBeInTheDocument()
    expect(screen.getAllByText(/Example Authority|Example University|Example Recruitment Board/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^Verified$/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Needs re-verification')).toBeInTheDocument()
    expect(screen.getAllByText(/official source/i).length).toBeGreaterThan(0)
  })

  it('never claims official acceptance', () => {
    render(<FormsView />)
    expect(screen.getByText(/do not guarantee/i)).toBeInTheDocument()
    const text = document.body.textContent?.toLowerCase() ?? ''
    expect(text).not.toContain('guaranteed to be accepted')
    expect(text).not.toContain('officially approved')
  })

  it('filters presets by search query', async () => {
    const user = userEvent.setup()
    render(<FormsView />)
    await user.type(screen.getByLabelText(/search forms/i), 'university')
    expect(screen.getByText(FORM_PRESETS[1].name)).toBeInTheDocument()
    expect(screen.queryByText(FORM_PRESETS[0].name)).not.toBeInTheDocument()
  })

  it('navigates to the photo flow with the selected preset', async () => {
    const user = userEvent.setup()
    render(<FormsView />)
    await user.click(screen.getByText(FORM_PRESETS[0].name))
    expect(window.location.hash).toBe(`#/photo?preset=${FORM_PRESETS[0].id}`)
  })
})
