import { ROUTES, type Route } from '../app/routes'

const LABELS: Record<Route, string> = {
  home: 'Home',
  photo: 'Photo',
  signature: 'Signature',
  thumb: 'Thumb',
  forms: 'Forms',
}

function NavIcon({ route }: { route: Route }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor' as const,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    className: 'nav-icon',
  }
  switch (route) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
        </svg>
      )
    case 'photo':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="13" rx="2" />
          <circle cx="12" cy="11.5" r="3" />
          <path d="M8 5 9.5 3h5L16 5" />
        </svg>
      )
    case 'signature':
      return (
        <svg {...common}>
          <path d="M12 19 5 12l3-3 7 7-3 3Z" />
          <path d="M14 6 18 2l2 2-4 4Z" />
          <path d="M5 19h7" />
        </svg>
      )
    case 'forms':
      return (
        <svg {...common}>
          <path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5H7Z" />
          <path d="M12 3v5h5" />
        </svg>
      )
    case 'thumb':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="7" rx="5" ry="4" />
          <path d="M8.5 10.5c-1 1.5-1.5 3.5-1 6" />
          <path d="M15.5 10.5c1 1.5 1.5 3.5 1 6" />
          <path d="M10 13c0 1.2 0.9 2 2 2s2-0.8 2-2" />
        </svg>
      )
  }
}

interface NavBarProps {
  active: Route
  onNavigate: (route: Route) => void
}

export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav className="shell-nav" aria-label="Primary">
      <ul className="nav-list">
        {ROUTES.map((route) => (
          <li key={route}>
            <button
              type="button"
              className={route === active ? 'nav-link is-active' : 'nav-link'}
              aria-current={route === active ? 'page' : undefined}
              onClick={() => onNavigate(route)}
            >
              <NavIcon route={route} />
              {LABELS[route]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
