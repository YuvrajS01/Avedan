# Project State

## Snapshot

**Project:** Avedan  
**Stage:** Foundation implemented / processing engine next  
**Last updated:** 2026-08-21  
**Status:** T001 complete; T002 active

## Product goal

Create a browser-based tool that prepares application photos and signatures to exact technical constraints such as aspect ratio, pixel dimensions, physical dimensions, format, and file-size ranges.

## Current capabilities

- Product concept, MVP scope, and UX direction defined.
- Vite + React 19 + TypeScript (strict) project with ESLint 9, Vitest 3 (jsdom), typecheck, and production build.
- Responsive application shell with dependency-free hash navigation across Home, Photo, Signature, Forms, and Custom views.
- Placeholder feature views under `src/features/` and module boundaries scaffolded (`src/processing/`, `src/workers/`, `src/domain/requirements/types.ts`).
- Typed `ImageRequirements` domain model defined (data-driven requirements, FR-01).

## Not implemented yet

- Image processing engine (decode/crop/resize/encode) — T002
- Constraint-based size optimizer — T003
- Photo upload flow — T004
- Camera capture — T005
- Signature drawing — T006
- Validation UI — T007
- Preset registry — T008
- PWA/offline packaging — T009

## Current focus

Implement the framework-independent image processing primitives (`src/processing/`) before building the polished UI.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

`tasks/T002-processing-primitives.md`

## Continuity rule

Any agent finishing a task must update this file before handing off work.
