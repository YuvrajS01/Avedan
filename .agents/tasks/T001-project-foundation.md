# T001 — Project Foundation and Application Shell

Status: DONE

## Objective

Create the base TypeScript web application and shell required for subsequent processing features.

## Acceptance criteria

- [x] App installs and runs locally.
- [x] Production build succeeds.
- [x] Type-check passes.
- [x] Lint passes.
- [x] Test runner is configured.
- [x] Responsive shell exists.
- [x] Navigation or view switching exists for Photo, Signature, Forms, and Custom.
- [x] No backend is required for the shell.
- [x] `project/STATE.md` and `project/NEXT_TASK.md` are updated.

## Implementation notes

- Stack: Vite 7 + React 19 + TypeScript (strict), per `architecture/TECHNICAL_ARCHITECTURE.md`.
- Tooling: ESLint 9 flat config (`npm run lint`), Vitest 3 with jsdom + Testing Library (`npm test`), `tsc -b` typecheck (`npm run typecheck`), production build (`npm run build`).
- Navigation is a dependency-free hash router (`src/app/routes.ts`, `src/hooks/useHashRoute.ts`) with browser back/forward support; a router library is deliberately deferred (see DECISIONS D008).
- Views: Home (per UI spec copy), plus placeholder views for Photo, Signature, Forms, and Custom under `src/features/`.
- Module boundaries scaffolded: `src/processing/`, `src/workers/`, `src/domain/requirements/types.ts` (typed `ImageRequirements` model, FR-01/D002).
- Mobile-first CSS in `src/styles/global.css`; no UI framework.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 10 tests pass (route parsing edge cases, shell rendering, navigation, aria-current)
- `npm run build` — succeeds
- Dev server smoke-tested over HTTP
