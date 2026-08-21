# T009 — PWA and Privacy Hardening

Status: DONE

## Objective

Make the app resilient/offline-friendly and verify privacy boundaries.

## Acceptance criteria

- [x] Service worker/PWA setup is functional.
- [x] Core preparation flow works after initial app load where technically supported.
- [x] No image bytes appear in analytics.
- [x] Object URLs are cleaned up.
- [x] Privacy messaging matches actual implementation.

## Implementation notes

- PWA: `public/manifest.webmanifest` (name, standalone display, theme/background colors, SVG icon) linked from `index.html`; `public/sw.js` implements a versioned cache (`avedan-v1`) with precache of the shell, stale-while-revalidate for same-origin GETs only, old-cache cleanup on activate, and explicit non-GET/cross-origin passthrough. Registered in `main.tsx` only in production builds.
- Offline: after first load, the shell and all static assets are served from cache; all processing is client-side, so the full photo/signature preparation flow works offline.
- EXIF/metadata: every export passes through canvas decode → drawImage → `toBlob` re-encoding, which by design does not carry over EXIF/GPS metadata (DECISIONS D020). No original bytes are ever copied to output.
- Analytics: the app contains no analytics or telemetry of any kind — there is no network call that could carry image bytes. Guarded by tests asserting the service worker and manifest reference no third-party endpoints.
- Object URLs: centralized `releaseSessionAssets` utility revokes preview + result URLs on session reset and unmount for both flows; regression-tested including missing-API tolerance.
- Messaging: footer now states local processing, offline capability, and that files are never sent anywhere — matching actual behavior.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 157 tests pass (8 new): manifest required fields + no network endpoints, SW GET-only/same-origin/versioned-cache/no-third-party assertions, session release revocation and API-tolerance
- `npm run build` — succeeds; `dist/` contains `sw.js`, `manifest.webmanifest`, `favicon.svg`, and the manifest link

## Known limitations

- Service worker behavior itself is not exercisable in jsdom; verify install/offline reload manually in a production build before release.
- SVG-only icon: acceptable to modern browsers/install prompts; add 192/512 PNG icons if broader install UI support is needed.
