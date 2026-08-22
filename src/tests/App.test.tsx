import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../app/App'

describe('App shell', () => {
  it('renders the home view with the privacy message', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /make your photo and signature/i }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/your image stays on this device/i).length,
    ).toBeGreaterThan(0)
  })

  it('renders navigation for all sections', () => {
    render(<App />)
    for (const name of ['Home', 'Photo', 'Signature', 'Forms']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('switches to the photo view when navigated', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Photo' }))
    expect(
      screen.getByRole('heading', { name: 'Prepare a photo' }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('#/photo')
  })

  it('switches to the signature view when navigated', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Signature' }))
    expect(
      screen.getByRole('heading', { name: 'Prepare a signature' }),
    ).toBeInTheDocument()
  })

  it('marks the active navigation item with aria-current', async () => {
    const user = userEvent.setup()
    render(<App />)
    const formsButton = screen.getByRole('button', { name: 'Forms' })
    await user.click(formsButton)
    expect(formsButton).toHaveAttribute('aria-current', 'page')
  })

  it('returns home from a section via the brand link', async () => {
    window.location.hash = '#/forms'
    const user = userEvent.setup()
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Form requirements' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /avedan/i }))
    expect(
      screen.getByRole('heading', { name: /make your photo and signature/i }),
    ).toBeInTheDocument()
  })
})
