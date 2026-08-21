import type { ComponentType } from 'react'
import { useHashRoute } from '../hooks/useHashRoute'
import { NavBar } from '../components/NavBar'
import { HomeView } from '../features/home/HomeView'
import { PhotoView } from '../features/photo/PhotoView'
import { SignatureView } from '../features/signature/SignatureView'
import { FormsView } from '../features/forms/FormsView'
import { CustomView } from '../features/custom/CustomView'

const VIEWS: Record<string, ComponentType> = {
  home: HomeView,
  photo: PhotoView,
  signature: SignatureView,
  forms: FormsView,
  custom: CustomView,
}

export function App() {
  const { route, navigate } = useHashRoute()
  const View = VIEWS[route] ?? HomeView

  return (
    <div className="shell">
      <header className="shell-header">
        <a className="brand" href="#/" onClick={() => navigate('home')}>
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span className="brand-name">Avedan</span>
        </a>
        <p className="brand-tagline">Form-ready photos &amp; signatures</p>
      </header>
      <NavBar active={route} onNavigate={navigate} />
      <main id="main" className="shell-main">
        <View />
      </main>
      <footer className="shell-footer">
        <p>Your image stays on this device while you process it.</p>
      </footer>
    </div>
  )
}
