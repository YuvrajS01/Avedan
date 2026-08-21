import { useCallback, useEffect, useState } from 'react'
import { hashForRoute, parseHash, type Route } from '../app/routes'

function readState() {
  return parseHash(window.location.hash)
}

export function useHashRoute() {
  const [state, setState] = useState(readState)

  useEffect(() => {
    const onHashChange = () => setState(readState())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback(
    (route: Route, options?: { presetId?: string }) => {
      window.location.hash = hashForRoute(route, options?.presetId)
    },
    [],
  )

  return { route: state.route, presetId: state.presetId, navigate }
}
