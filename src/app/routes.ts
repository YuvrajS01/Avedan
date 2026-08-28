export const ROUTES = ['home', 'photo', 'signature', 'thumb', 'kit', 'forms'] as const

export type Route = (typeof ROUTES)[number]

const ROUTE_BY_PATH: Record<string, Route> = {
  '/': 'home',
  '/photo': 'photo',
  '/signature': 'signature',
  '/thumb': 'thumb',
  '/kit': 'kit',
  '/forms': 'forms',
}

const PATH_BY_ROUTE: Record<Route, string> = {
  home: '#/',
  photo: '#/photo',
  signature: '#/signature',
  thumb: '#/thumb',
  kit: '#/kit',
  forms: '#/forms',
}

export interface RouteState {
  route: Route
  presetId?: string
}

export function parseHash(hash: string): RouteState {
  const [pathPart, queryPart] = hash.replace(/^#/, '').split('?')
  const route = ROUTE_BY_PATH[pathPart || '/'] ?? 'home'
  const presetId = new URLSearchParams(queryPart ?? '').get('preset') ?? undefined
  return { route, presetId: presetId || undefined }
}

export function hashForRoute(route: Route, presetId?: string): string {
  const base = PATH_BY_ROUTE[route]
  return presetId ? `${base}?preset=${encodeURIComponent(presetId)}` : base
}

export function routeFromHash(hash: string): Route {
  return parseHash(hash).route
}
