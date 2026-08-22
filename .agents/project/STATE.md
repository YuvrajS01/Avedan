# Project State

## Snapshot

**Project:** Avedan  
**Stage:** All planned tasks complete (T001–T010)  
**Last updated:** 2026-08-22  
**Status:** T001–T010 complete; pre-release manual verification recommended

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
- End-to-end photo flow (`src/features/photo/`): upload/drag-drop intake, data-driven requirement profiles + custom settings, fixed-aspect crop with pan/zoom (pure math in `cropMath.ts`), processing orchestrator (`processPhoto.ts`), result view with metadata, validation checks and download. Crop-box sizing is pure math (`cropBoxStyle`) preserving the target aspect ratio under viewport height caps (bug fix, DECISIONS D022).
- Signature flow (`src/features/signature/`): pointer/touch drawing canvas with pen sizes and undo/clear, upload intake, whitespace trim (`processing/trim.ts`), fit-resize without upscaling, same optimizer/validation/download pipeline. Shared result view (`components/ProcessedResult.tsx`) and shared asset types (`domain/jobs/result.ts`).
- Validation engine (`domain/validation/engine.ts`) implementing the VALIDATION spec shape (`pass`/`attention`/`not-run` checks) with exact/within dimension modes; both flows delegate to it.
- Guided camera capture (`features/camera/`): getUserMedia lifecycle with permission/denied/not-found/unsupported states, front/back switching, local frame capture feeding the standard photo pipeline. Frames never leave the device.
- Form preset registry (`domain/presets/`): typed schema with runtime validation, load-time-validated seed registry with authority/source/last-verified metadata, freshness badges (verified/stale), `requirementsFromPreset` mapping, Forms browse/search view, and hash-based preset selection feeding the photo flow.
- PWA + privacy hardening: installable manifest, versioned service worker (same-origin GET-only, stale-while-revalidate), production-only registration; centralized session release of object URLs; canvas re-encode strips EXIF/GPS by design; no analytics exist at all.
- Visual redesign (2026-08-21, see DECISIONS D023): token-based design system in `src/styles/global.css` (spacing/radius/color primitives, light + dark themes via `[data-theme]`, single restrained teal accent), genuine dark theme with surface hierarchy, theme toggle persisted to localStorage with `prefers-color-scheme` default and no-flash bootstrap script in `index.html`, redesigned shell/home/intake drop zone/crop stage (rule-of-thirds guides + corner marks)/camera (framing oval + large capture button)/signature draw canvas (paper stays light in both themes, baseline guide, segmented pen control)/result screen (status icon, check list with icons, "Make another" + prominent download), requirements panel shown only on intake/choose steps for clearer hierarchy. No processing-engine changes; 160 tests passing.
- Visual identity pass (2026-08-21, see DECISIONS D024): "Document Desk" editorial aesthetic on OKLCH tokens (warm paper / green ink / postage-stamp accent), self-hosted Fraunces Variable + Public Sans Variable via Fontsource, home as numbered hairline index, Add → Frame → Ready stepper, printed-photo matte result preview. Fonts are the only new dependencies; 160 tests passing.
- SaaS shell + single-column content (2026-08-21, see DECISIONS D025/D026/D030): 2-column desktop shell (272px sidebar + flexible main) collapsing to single column on mobile; sidebar nav with outline icons and SaaS active states; every page is sidebar + single column (like the signature page: one large card + two cards below) — Home is single-column, Forms has top search + stacked cards, Photo and Signature are manual-first (Width/Height/Max size/Format always visible with a controlled "Load preset" dropdown that autofills them and retains the selection, no separate Custom mode). The Custom route was removed (ROUTES = Home/Photo/Signature/Forms). Preview/result mattes use `var(--surface)` so bounds match the page background, not paper-white. 160 tests passing.
- Signature preview/result are WYSIWYG (2026-08-22, see DECISIONS D027–D029/D032): upload preview renders the trimmed canvas (not the raw scan) so small signatures no longer float in white; the result matte is capped to the displayed image width (`max-width: min(340px,100%)` + caption removed) and now blends with the background. The draw canvas is opaque white and the pipeline flattens to white, fixing black-on-black in dark mode. 160 tests passing.
- Optional quality intelligence (2026-08-22, see DECISIONS D033/D034): advisory blur/lighting/contrast hints via deterministic pixel heuristics (`processing/quality.ts`, downscaled render ≤256px, fail-safe → undefined); attached as `ProcessedAsset.advisory` for the photo flow only; rendered in a separate "Optional quality hints" section that never affects validation status or download; no ML models downloaded; face detection deferred pending an opt-in client-side model.

## Not implemented yet

- Nothing planned — all indexed tasks (T001–T010) are done. New work needs new task definitions (see NEXT_TASK.md).

## Current focus

Pre-release manual verification (camera, crop, offline/install in real browsers) and the verified-presets workflow.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

None — define new tasks in `.agents/tasks/` and index them in `TASK_INDEX.md`.

## Continuity rule

Any agent finishing a task must update this file before handing off work.
