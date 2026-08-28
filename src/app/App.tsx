import type { ComponentType } from 'react'
import { useHashRoute } from '../hooks/useHashRoute'
import { NavBar } from '../components/NavBar'
import { ThemeToggle } from '../components/ThemeToggle'
import { HomeView } from '../features/home/HomeView'
import { PhotoView } from '../features/photo/PhotoView'
import { SignatureView } from '../features/signature/SignatureView'
import { ThumbView } from '../features/thumb/ThumbView'
import { KitView } from '../features/kit/KitView'
import { FormsView } from '../features/forms/FormsView'

const VIEWS: Record<string, ComponentType> = {
  home: HomeView,
  photo: PhotoView,
  signature: SignatureView,
  thumb: ThumbView,
  kit: KitView,
  forms: FormsView,
}

export function App() {
  const { route, navigate } = useHashRoute()
  const View = VIEWS[route] ?? HomeView

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="sidebar-top">
          <a className="brand" href="#/" onClick={() => navigate('home')}>
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span className="brand-name">Avedan</span>
          </a>
          <ThemeToggle />
        </div>
        <NavBar active={route} onNavigate={navigate} />
        <div className="sidebar-bottom">
          <p>Your image stays on this device — nothing is uploaded.</p>
          <p>Avedan works offline after its first load.</p>
        </div>
      </aside>

      <div className="app-main">
        <main id="main" className="shell-main">
          <View />
        </main>
        <footer className="shell-footer">
          <p>
            Your image stays on this device while you process it — nothing is
            uploaded, and Avedan works offline after its first load.
          </p>
        </footer>
      </div>
    </div>
  )
}
