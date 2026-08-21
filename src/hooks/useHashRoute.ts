import { useCallback, useEffect, useState } from 'react'
import { hashForRoute, routeFromHash, type Route } from '../app/routes'

function readRoute(): Route {
  return routeFromHash(window.location.hash)
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.location.hash = hashForRoute(next)
  }, [])

  return { route, navigate }
}
