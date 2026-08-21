import { ROUTES, type Route } from '../app/routes'

const LABELS: Record<Route, string> = {
  home: 'Home',
  photo: 'Photo',
  signature: 'Signature',
  forms: 'Forms',
  custom: 'Custom',
}

interface NavBarProps {
  active: Route
  onNavigate: (route: Route) => void
}

export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav className="nav" aria-label="Primary">
      <ul className="nav-list">
        {ROUTES.map((route) => (
          <li key={route}>
            <button
              type="button"
              className={route === active ? 'nav-link is-active' : 'nav-link'}
              aria-current={route === active ? 'page' : undefined}
              onClick={() => onNavigate(route)}
            >
              {LABELS[route]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
