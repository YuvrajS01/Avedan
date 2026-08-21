import { useHashRoute } from '../../hooks/useHashRoute'
import type { Route } from '../../app/routes'

const ACTIONS: Array<{ route: Route; label: string; hint: string }> = [
  { route: 'photo', label: 'Prepare Photo', hint: 'Crop, resize and compress' },
  {
    route: 'signature',
    label: 'Prepare Signature',
    hint: 'Clean up and size your signature',
  },
  { route: 'forms', label: 'Select a Form', hint: 'Use known requirements' },
  { route: 'custom', label: 'Custom Requirements', hint: 'Set your own limits' },
]

export function HomeView() {
  const { navigate } = useHashRoute()

  return (
    <section className="view" aria-labelledby="home-title">
      <h1 id="home-title">Make your photo and signature form-ready.</h1>
      <p className="lede">Crop, resize, compress and validate in your browser.</p>
      <ul className="action-grid">
        {ACTIONS.map((action) => (
          <li key={action.route}>
            <button
              type="button"
              className="card action-card"
              onClick={() => navigate(action.route)}
            >
              <span className="action-label">{action.label}</span>
              <span className="action-hint">{action.hint}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="privacy-note">
        Your image stays on this device while you process it.
      </p>
    </section>
  )
}
