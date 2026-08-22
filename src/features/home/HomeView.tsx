import { useHashRoute } from '../../hooks/useHashRoute'
import type { Route } from '../../app/routes'

const ACTIONS: Array<{ route: Route; label: string; hint: string }> = [
  { route: 'photo', label: 'Photo', hint: 'Prepare a form-ready photograph' },
  {
    route: 'signature',
    label: 'Signature',
    hint: 'Create or prepare a signature',
  },
  { route: 'forms', label: 'Forms', hint: 'Choose an application preset' },
]

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg className="index-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}

export function HomeView() {
  const { navigate } = useHashRoute()

  return (
    <section className="view" aria-labelledby="home-title">
      <h1 id="home-title">Make your photo and signature form&#8209;ready.</h1>
      <p className="lede">
        Crop, resize, compress and validate to the exact requirements of your
        application form. No uploads, no tracking — everything runs in your
        browser.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        <span className="badge badge-verified">100% on-device</span>
        <span className="badge badge-verified">Works offline</span>
      </div>
      <ul className="index-list">
        {ACTIONS.map((action, index) => (
          <li key={action.route}>
            <button
              type="button"
              className="index-row"
              onClick={() => navigate(action.route)}
            >
              <span className="index-num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="index-label">{action.label}</span>
              <ArrowIcon />
              <span className="index-hint">{action.hint}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="privacy-note">
        <ShieldIcon />
        Your image is processed on your device — nothing is uploaded.
      </p>
    </section>
  )
}
