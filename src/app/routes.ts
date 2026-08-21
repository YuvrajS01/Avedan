export const ROUTES = ['home', 'photo', 'signature', 'forms', 'custom'] as const

export type Route = (typeof ROUTES)[number]

const ROUTE_BY_PATH: Record<string, Route> = {
  '/': 'home',
  '/photo': 'photo',
  '/signature': 'signature',
  '/forms': 'forms',
  '/custom': 'custom',
}

const PATH_BY_ROUTE: Record<Route, string> = {
  home: '#/',
  photo: '#/photo',
  signature: '#/signature',
  forms: '#/forms',
  custom: '#/custom',
}

export function routeFromHash(hash: string): Route {
  const path = hash.replace(/^#/, '')
  return ROUTE_BY_PATH[path] ?? 'home'
}

export function hashForRoute(route: Route): string {
  return PATH_BY_ROUTE[route]
}
