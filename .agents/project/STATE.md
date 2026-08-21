# Project State

## Snapshot

**Project:** Avedan  
**Stage:** MVP complete / optional intelligence next  
**Last updated:** 2026-08-21  
**Status:** T001–T009 complete; T010 (optional) active

## Product goal

Create a browser-based tool that prepares application photos and signatures to exact technical constraints such as aspect ratio, pixel dimensions, physical dimensions, format, and file-size ranges.

## Current capabilities

- Product concept, MVP scope, and UX direction defined.
- Vite + React 19 + TypeScript (strict) project with ESLint 9, Vitest 3 (jsdom), typecheck, and production build.
- Responsive application shell with dependency-free hash navigation across Home, Photo, Signature, Forms, and Custom views.
- Placeholder feature views under `src/features/` and module boundaries scaffolded (`src/processing/`, `src/workers/`, `src/domain/requirements/types.ts`).
- Typed `ImageRequirements` domain model defined (data-driven requirements, FR-01).
- Framework-independent processing primitives under `src/processing/`: decode (ImageBitmap + img fallback), aspect-ratio crop with focus point, exact resize with stepped halving, JPEG/PNG/WebP encode, physical mm/DPI → pixel math, typed `ProcessingError`, injectable canvas factory for testability.
- Constraint-based file-size optimizer (`src/processing/optimize.ts`): bounded binary search over encode quality with optional allowed dimension scales; supports max/range/target byte modes with `ok`/`too-large`/`too-small` outcomes.
- End-to-end photo flow (`src/features/photo/`): upload/drag-drop intake, data-driven requirement profiles + custom settings, fixed-aspect crop with pan/zoom (pure math in `cropMath.ts`), processing orchestrator (`processPhoto.ts`), result view with metadata, validation checks and download.
- Signature flow (`src/features/signature/`): pointer/touch drawing canvas with pen sizes and undo/clear, upload intake, whitespace trim (`processing/trim.ts`), fit-resize without upscaling, same optimizer/validation/download pipeline. Shared result view (`components/ProcessedResult.tsx`) and shared asset types (`domain/jobs/result.ts`).
- Validation engine (`domain/validation/engine.ts`) implementing the VALIDATION spec shape (`pass`/`attention`/`not-run` checks) with exact/within dimension modes; both flows delegate to it.
- Guided camera capture (`features/camera/`): getUserMedia lifecycle with permission/denied/not-found/unsupported states, front/back switching, local frame capture feeding the standard photo pipeline. Frames never leave the device.
- Form preset registry (`domain/presets/`): typed schema with runtime validation, load-time-validated seed registry with authority/source/last-verified metadata, freshness badges (verified/stale), `requirementsFromPreset` mapping, Forms browse/search view, and hash-based preset selection feeding the photo flow.
- PWA + privacy hardening: installable manifest, versioned service worker (same-origin GET-only, stale-while-revalidate), production-only registration; centralized session release of object URLs; canvas re-encode strips EXIF/GPS by design; no analytics exist at all. 157 unit tests passing.

## Not implemented yet

- Optional local intelligence (blur/lighting/face advisory checks) — T010

## Current focus

MVP scope is complete. T010 is optional progressive enhancement.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

`tasks/T010-advanced-intelligence.md` (optional)

## Continuity rule

Any agent finishing a task must update this file before handing off work.
