# Project State

## Snapshot

**Project:** Avedan  
**Stage:** v0.3.0 — V3 Form Intelligence in progress (T021–T024 done, 2026-08-26)  
**Last updated:** 2026-08-26  
**Status:** `feat/v3-form-intelligence` branch; T021 engine + T022 thumb flow + T023 validation + T024 kit view complete (269 tests, typecheck/lint/build clean); V2 remains released as `v0.2.0`

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
- MVP release audit (2026-08-22, `.agents/project/MVP_RELEASE_AUDIT.md`): all MVP features verified against the PRD; privacy claims verified against source (zero network calls/analytics); typecheck/lint/tests/build all pass. Two blockers fixed: manual edits now take precedence over an active form preset (D035), and minimum file size is a first-class field on both flows (D036). 177 tests passing.
- Released as `v0.1.0-mvp` on GitHub (tag + release page). Post-release fix D037: camera preview now attaches the stream after the video mounts — the blank-preview defect is fixed; 178 tests passing. Candidate for a v0.1.1 patch tag.
- T011 manual verification passed (2026-08-22): photo/signature flows, camera, offline, and privacy confirmed on real hardware. MVP release checkpoint cleared.
- Camera framing guidance (2026-08-22, T012/D038): live advisory hints while the preview is ready — `features/camera/framing.ts` samples a 160 px frame every 700 ms through the existing quality heuristics; one actionable hint line (dark > bright > blurry > flat) above the shutter; never blocks capture, no models, no new dependencies. 187 tests passing.
- Face positioning assistance (2026-08-22, T013/D039): opt-in "Face framing" toggle using the native `FaceDetector` API where available — no model downloads; bounding-box geometry drives absent/too-far/too-close/off-center hints merged with quality hints (light/blur > face > contrast). Head-angle guidance and auto-crop pre-positioning deferred. 203 tests passing.
- Background quality + white-background processing (2026-08-22, T014/D040): advisory border-uniformity check on the photo result; opt-in "Lighten a plain background to white" mode (`ImageRequirements.background`) implemented as edge-seeded flood-fill whitening with subject preservation and best-effort fallback. No ML, no new dependencies. 214 tests passing.
- Auto-crop suggestion (2026-08-22, T015/D041): when camera face framing is on and a face was detected, the crop stage opens pre-positioned via pure `cropMath.faceFraming()` math; applied once before any manual interaction and dismissed on first adjustment; no-op without opt-in/detection. 220 tests passing.
- Preset fidelity (2026-08-22, T016/D042): signature pipeline scales down within `within` semantics when a file-size constraint demands it (fixes oversized PNGs); reported dims match encoded bytes. Forms preset cards expose "Prepare signature"; signature page resolves presets with context panel + D035 edit precedence. MVP audit IMPORTANT findings I1/I2 closed. 225 tests passing.
- Physical size inputs (2026-08-22, T017/D043): "Physical size (advanced)" disclosure in the photo panel — mm/cm + DPI derive pixel dimensions through the existing `dimensionsFromPhysical` math into the editable px fields; invalid input is inert; validation stays pixel-based; no DPI embedded in exports. 228 tests passing.
- Worker offload of the encode/optimize loop (2026-08-22, T018/D044): photo and signature pipelines split into serializable cores (`computePhotoOutput`/`computeSignatureOutput`) shared verbatim by a module worker (`src/workers/process.worker.ts` + `protocol.ts` + `handleProcessRequest.ts`) and the main thread; `src/workers/client.ts` uses the worker only when supported, transfers an `ImageBitmap` via structured clone, and silently falls back to the identical in-thread pipeline otherwise. A 15 s watchdog (D046, field-fix for a "stuck on Preparing your photo…" report unreproducible in headless Chrome) bounds any silent worker so the flow can never hang. `defaultCanvasFactory` falls back to `OffscreenCanvas`; `encodeCanvas` supports `convertToBlob`. 245 tests passing; typecheck/lint/build pass (worker chunk emitted).
- Verified-preset registry preparation (2026-08-22, T019/D045): `ImageRequirements` gained descriptive `physicalSizeMm`/`dpi`; `requirementsFromPreset` maps background ('white' only), physical size and DPI; photo page prefills physical fields + DPI + white-background toggle from presets (hash-route and dropdown) with manual-edit precedence intact; seed data extracted to documented `domain/presets/seedPresets.ts` with an owner verification checklist; new illustrative white-background template. Validation stays pixel-based (D043). 244 tests passing.
- v0.2.0 release (2026-08-24): T020 manual verification gate passed by the product owner on real hardware (V2 capture-guidance suite + MVP regressions). 245 tests passing; typecheck/lint/build clean. Tagged `v0.2.0`.
- V3 preset engine & data model (2026-08-26, T021/D047): schema extended to `photo | signature | thumbImpression` (spec parity), `validateFormPreset` and `requirementsFromPreset` handle thumbImpression identically, `FormsView` iterates data-driven over `PRESET_ASSET_KINDS` to render Photo/Signature/Thumb impression lines with shared freshness/source/disclaimer UI, one illustrative thumb-kit preset (`example-thumb-kit`: photo 350×450 white 20–50 KB + signature 10–20 KB + thumb 240×240 10–30 KB) satisfies the "one carefully selected example preset" rule without claiming authority. 250 tests passing; typecheck/lint/build clean.
- V3 thumb impression flow (2026-08-26, T022/D048): dedicated `#/thumb` route + `ThumbView` (upload drag-drop → trimmed preview → result), `processThumb`/`computeThumbOutput` (trim → fit-within never upscale → flatten white → optimize with THUMB_ALLOWED_SCALES → validate `within`), worker protocol extended to `thumb`, `THUMB_PROFILES` (240×240 JPEG ≤30KB, 200×200 PNG ≤20KB), NavBar thumb icon, Forms cards now offer Prepare signature + Prepare thumb data-driven per preset. 257 tests passing; typecheck/lint/build clean.
- V3 preset-aware validation (2026-08-26, T023/D049): `src/domain/presets/helpers.ts` (`requiredAssetKinds`, `assetLabel`, `dimensionModeForKind`, `presetKindsSummary`) and `ProcessedResult` now preset-aware (optional `preset` prop shows "Validated against {name} · {authority}" + lastVerified + Official source + always-confirm disclaimer). Photo/Signature/Thumb views forward `activePreset` to result. 263 tests passing; typecheck/lint/build clean.
- V3 Application Kit view (2026-08-26, T024/D050): `#/kit?preset=id` via `KitView` (findFormPreset + presetFreshness, summary card with name/authority/year/lastVerified/freshness badge/source link/stale warning + disclaimer, required assets iterated data-driven via `requiredAssetKinds` + `requirementsFromPreset` + `describeRequirements` + `assetLabel` with Prepare CTAs to photo/signature/thumb + `?preset=id`; empty preset handled with Browse forms). `FormsView` adds View kit button, NavBar/Routes/App include kit. 269 tests passing; typecheck/lint/build clean.

## Not implemented yet (backlog)

- V3 Form Intelligence remainder (see TASK_INDEX T025): kit ZIP/batch export (client-side ZIP of prepared assets for a kit, session-local, no upload, fallback to individual downloads if weight excessive).
- Manually verified official presets (D003/D019 **owner** workflow): pure data entry into `seedPresets.ts` following its checklist; no code changes expected. V3 keeps illustrative presets clearly labelled; never claim authority without a current official source.

## Current focus

V3 Form Intelligence: T021–T024 complete on `feat/v3-form-intelligence` branch; next is T025 kit export (ZIP / batch guidance) — client-side ZIP assembly for a kit, evaluating dependency weight, fallback to checklist if excessive.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

T025 — V3 kit export (ZIP / batch guidance) (depends on T024). Implement client-side ZIP generation for the current kit session (photo + signature + thumb blobs) with sensible filenames (`{preset-id}-photo.jpg` etc.), evaluating dependency weight (prefer small helper, fallback to individual downloads). Session-local only, no network, revoke URLs after reset. See `.agents/tasks/T025-v3-kit-export.md` and TASK_INDEX.

## Continuity rule

Any agent finishing a task must update this file before handing off work.
