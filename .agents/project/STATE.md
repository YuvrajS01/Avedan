# Project State

## Snapshot

**Project:** Avedan  
**Stage:** Processing primitives done / optimizer next  
**Last updated:** 2026-08-21  
**Status:** T001 + T002 complete; T003 active

## Product goal

Create a browser-based tool that prepares application photos and signatures to exact technical constraints such as aspect ratio, pixel dimensions, physical dimensions, format, and file-size ranges.

## Current capabilities

- Product concept, MVP scope, and UX direction defined.
- Vite + React 19 + TypeScript (strict) project with ESLint 9, Vitest 3 (jsdom), typecheck, and production build.
- Responsive application shell with dependency-free hash navigation across Home, Photo, Signature, Forms, and Custom views.
- Placeholder feature views under `src/features/` and module boundaries scaffolded (`src/processing/`, `src/workers/`, `src/domain/requirements/types.ts`).
- Typed `ImageRequirements` domain model defined (data-driven requirements, FR-01).
- Framework-independent processing primitives under `src/processing/`: decode (ImageBitmap + img fallback), aspect-ratio crop with focus point, exact resize with stepped halving, JPEG/PNG/WebP encode, physical mm/DPI → pixel math, typed `ProcessingError`, injectable canvas factory for testability. 48 unit tests passing.

## Not implemented yet

- Constraint-based file-size optimizer — T003
- Photo upload flow — T004
- Camera capture — T005
- Signature drawing — T006
- Validation UI — T007
- Preset registry — T008
- PWA/offline packaging — T009

## Current focus

Implement the constraint-based file-size optimizer (`src/processing/optimize/`) on top of the T002 primitives.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

`tasks/T003-size-optimizer.md`

## Continuity rule

Any agent finishing a task must update this file before handing off work.
