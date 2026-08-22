# Architecture & Product Decisions

## D001 — Client-side image processing

**Decision:** All core image processing runs in the browser.

**Reason:** Government application photos/signatures are sensitive personal data. The app's primary trust proposition is that images do not need to leave the user's device.

## D002 — Requirements are configuration data

**Decision:** Form requirements are represented as typed data objects.

**Reason:** Exam/application requirements change independently from processing algorithms and UI.

## D003 — Presets need source metadata

**Decision:** Every public form preset carries authority, source URL/reference, and last-verified date.

**Reason:** Stale application requirements can cause real-world submission problems.

## D004 — No acceptance guarantee

**Decision:** Validation is described as technical compatibility guidance, not official acceptance.

**Reason:** The downstream portal may enforce undocumented or changing rules.

## D005 — Processing engine separate from UI

**Decision:** Pure processing functions should not depend on React components.

**Reason:** Makes unit testing, worker execution, and future reuse much easier.

## D006 — Optimize to constraints

**Decision:** The compressor prioritizes satisfying required format/dimensions/file-size constraints while maximizing quality.

**Reason:** Users care about the portal's constraints, not JPEG quality numbers.

## D007 — Advanced features are progressive enhancement

**Decision:** Face guidance, background removal, and ML-based checks should not block basic photo preparation.

**Reason:** Core utility should remain fast and broadly compatible.

## D008 — Hash-based navigation without a router library

**Decision:** The shell uses a small hash router (`src/app/routes.ts` + `useHashRoute`) instead of React Router or similar.

**Reason:** The MVP has five flat views; a router dependency adds bundle weight without UX benefit. Browser back/forward still works via `hashchange`. Revisit only if nested routes or URL state are needed.

## D009 — Toolchain: Vite + React 19 + Vitest, no UI framework

**Decision:** Build with Vite 7/TypeScript strict, test with Vitest + jsdom + Testing Library, style with plain mobile-first CSS custom properties (no Tailwind/component library).

**Reason:** Matches the recommended stack in the technical architecture, keeps dependencies minimal, and keeps processing code free to be framework-independent.

## D010 — Canvas creation is injectable in processing code

**Decision:** All canvas-creating processing functions accept a `CanvasFactory` parameter (defaulting to `document.createElement('canvas')`).

**Reason:** Unit tests can verify crop/resize/encode behavior without a real canvas implementation (jsdom has none), and the same seam will allow OffscreenCanvas inside a Web Worker later without rewriting the engine.

## D011 — Processing errors are typed codes, not raw exceptions

**Decision:** The processing layer throws `ProcessingError` with stable machine codes (`unsupported-type`, `empty-file`, `decode-failed`, `encode-failed`, `invalid-input`, `canvas-unavailable`) and user-actionable messages.

**Reason:** Keeps error UX (per UI spec: tell users what to do next) decoupled from failure mechanics, and lets the UI layer map codes to copy without parsing messages.

## D012 — Optimizer takes an injected encoder function

**Decision:** `optimizeEncoding` receives an `EncodeAt(quality, scale)` callback instead of touching canvases directly; `createCanvasEncoder` is a thin adapter.

**Reason:** The search logic is unit-testable with deterministic fake codecs, the same optimizer serves any encoder (canvas now, OffscreenCanvas in a worker later), and dimension-reduction policy stays explicit via `allowedScales` rather than hidden inside the loop.

## D013 — T004 ships generic example profiles, not form presets

**Decision:** The photo flow's requirement selector offers a few generic example profiles (portrait 3:4, square 1:1, small exam photo) plus custom fields, explicitly labeled as unverified examples. Authority-backed presets with source/verification metadata remain T008.

**Reason:** The photo flow needs data-driven targets now (FR-01/D002), but shipping unverified "presets" would violate D003/D004. Generic templates avoid implying official endorsement.

## D014 — Crop state maps viewport to source pixels via pure math

**Decision:** The cropper renders pan/zoom as CSS transforms over a cover-fit image and derives the source-pixel crop rect with pure functions (`cropMath.ts`) only at confirm time.

**Reason:** Keeps per-frame interaction cheap (no canvas redraws while dragging), keeps all geometry unit-testable without a DOM canvas, and produces an exact source rect for the engine pipeline.

## D015 — Signatures fit within dimensions; never upscaled

**Decision:** Signature outputs are resized to fit *within* the required box while preserving their natural post-trim aspect ratio, and small sources are never enlarged.

**Reason:** Trimmed signatures have unpredictable aspect ratios; forcing exact dimensions would distort strokes, and upscaling degrades quality. Photo outputs keep exact-dimension semantics because portals mandate them there.

## D016 — Shared result model for all asset flows

**Decision:** `ProcessedAsset`/`ValidationCheck` live in `domain/jobs/result.ts` and one shared result component renders metadata, checks, and download for every asset type.

**Reason:** Photo and signature flows must stay consistent (FR-07) without duplicating UI, and future asset types (thumb impressions, documents) plug into the same contract.

## D017 — Validation engine follows the spec result shape verbatim

**Decision:** `validateOutput` emits the exact check/result shape from `.agents/specs/VALIDATION.md` (`pass`/`attention`/`not-run`), reports all four categories deterministically (unconstrained ones as `not-run`), and supports `exact` vs `within` dimension modes.

**Reason:** A single deterministic engine keeps photo/signature semantics explicit, makes the no-guarantee language testable, and gives T010's advisory checks a ready-made place to land.

## D018 — Camera capture reuses the file intake path

**Decision:** Captured camera frames are encoded locally to a JPEG `File` and passed through the same intake function as uploads, rather than introducing a separate camera pipeline.

**Reason:** One processing path means one set of guarantees (crop → optimize → validate → download), simpler tests, and zero new privacy surface: frames only ever exist in local canvases/blobs.

## D019 — Seed presets are illustrative until manually verified

**Decision:** The preset registry ships only clearly-labeled illustrative templates with full verification metadata (authority, source URL, last-verified date). Real exam/recruitment entries are added only after manual verification against official sources.

**Reason:** Shipping plausible-looking but unverified "official" values would violate D003/D004 and could cause real submission failures. The schema and freshness UI make stale or unverified data visible instead of authoritative.

## D020 — Canvas re-encode is the EXIF stripping mechanism

**Decision:** All exports are produced by decoding the source, drawing it to a canvas and re-encoding via `toBlob`; original file bytes are never copied to output.

**Reason:** Browser canvas re-encoding does not carry EXIF/GPS metadata into the result, satisfying the privacy spec's metadata-stripping goal with zero extra dependencies or code paths.

## D021 — Service worker caches static shell only

**Decision:** The service worker precaches the app shell and uses stale-while-revalidate for same-origin GET requests only; cross-origin and non-GET requests bypass caching entirely.

**Reason:** Guarantees no user image data can ever enter a cache while keeping the full client-side flow available offline after first load.

## D022 — Crop box sizing lives in pure math, not CSS width/max-height

**Decision:** The crop box is sized via `cropBoxStyle()` in `cropMath.ts` (`aspect-ratio` plus `width: min(100%, calc(60vh * ratio))`); `.crop-box` CSS no longer sets `width` or `max-height`.

**Reason:** `width: 100%` combined with `max-height: 60vh` silently broke the target aspect ratio whenever the derived height exceeded the viewport cap (typical for portrait targets on desktop). The visible box then had a different ratio than the export target, and exact-dimension resize distorted faces. Sizing in pure math keeps FR-04 (cropper maintains target aspect ratio) testable and layout-independent.

## D023 — Visual redesign: token system, real dark theme, step-scoped chrome

**Decision:** All UI styling is driven by design tokens in `src/styles/global.css` (`:root` light values, `[data-theme="dark"]` overrides). Theme is a two-state toggle (light/dark) initialized from `prefers-color-scheme`, persisted in `localStorage` under `avedan-theme`, and applied pre-paint by an inline bootstrap script in `index.html` to avoid flashes. The requirements panel renders only on intake/choose steps; crop/camera/result screens carry the target in their own context instead. The signature draw canvas intentionally keeps a light "paper" surface in both themes because signature output must be dark ink on a light background.

**Reason:** A single token source keeps both themes feeling like one product and makes contrast/hierarchy auditable. Step-scoped chrome follows the progressive-disclosure principle (only controls relevant to the current step) and fixes the hierarchy problem of a settings panel appearing above the page heading. The paper canvas avoids an invisible-ink failure in dark mode without complicating the processing pipeline. Two-state theme (instead of a three-state system option) was chosen for simplicity; first visit still respects the OS preference.

**Consequence:** Test copy updated in two places only — the result-screen reset button was renamed from "Start over" to "Make another" (PhotoView.test, SignatureView.test assert the new name); all other tested labels, roles, and flows are unchanged.

## D024 — Visual identity: "Document Desk" editorial aesthetic

**Decision:** The UI commits to a paper-and-ink identity: OKLCH tokens tinted toward green ink (light = warm paper, dark = deep green-charcoal), Fraunces Variable for display type and Public Sans Variable (a typeface designed for government use) for UI text, self-hosted via Fontsource so the PWA stays fully offline. The home screen is an editorial numbered index with hairline rules instead of card grids; the photo flow gains an Add → Frame → Ready stepper; the result preview is presented as a printed photograph (matte frame + caption). One orchestrated staggered entrance per view (`rise`, ease-out-quint), disabled under `prefers-reduced-motion`.

**Reason:** The redesign brief asked for a calm, trustworthy document tool that still feels deliberately designed. A serif display face gives quiet authority without marketing energy; Public Sans reinforces the civic-document context; hairline-index navigation removes the generic "SaaS card grid" look. Fonts are the only new dependencies and are static assets, not code.

**Consequence:** No behavior, processing, or accessibility changes — all 160 tests pass unchanged. `color-mix`/OKLCH require a modern browser (2023+), matching the existing canvas/getUserMedia baseline.

## D025 — SaaS application shell: 2-column desktop, single-column mobile

**Decision:** The app shell is a CSS grid with a persistent 272px sidebar + flexible main column on desktop (`--sidebar-width` / `--content-max`), collapsing to a single column on mobile where the sidebar becomes a top bar with horizontal nav. Inside the main, workspaces are also 2-column on desktop: `home-layout` (intro left sticky, index right), `intake-grid` (requirements left, drop zone right), `workspace` (crop stage left sticky, controls right), `forms-layout` (search left, 2-col preset grid right), `result-layout` (figure left sticky, metadata right). The sidebar nav uses outline icons with SaaS active state (soft accent background on desktop, underline on mobile). The main footer is hidden on desktop (sidebar bottom carries the privacy note) to avoid duplication.

**Reason:** The brief asked for a proper SaaS-style webapp that is 2-column on desktop and single-column on mobile. A sidebar + main shell gives the SaaS information architecture while the inner 2-column workspaces keep the primary task (prepare → validate → download) obvious and reduce scrolling on desktop. Sticky panels keep context visible.

**Consequence:** No routing, processing, or test changes — only layout. `160/160` tests still pass; the single brand link / single NavBar avoids duplicate accessible names.

## D026 — Sidebar + single-column content; manual-first requirements with preset autofill

**Decision:** All pages render as sidebar + single column (the 2-col inner workspace grids from D025 were removed). The Photo page leads with a "Load preset" dropdown that autofills the always-visible manual fields (Width, Height, Max size KB, Format) — the fields are the default state and there is no separate "Custom…" mode. The Custom route was removed entirely (`ROUTES` is now Home/Photo/Signature/Forms); the preset dropdown resets to its placeholder after selection so it reads as an autofill action, not a mode switch. Forms page keeps the search bar on top with preset cards stacked below in the body.

**Reason:** Consistency: every page shares the sidebar + single-column rhythm like the signature page (one large card + smaller cards below). Requirement-first editing means the manual fields are always visible and editable; presets are shortcuts that fill them rather than hidden modes. Removing the placeholder Custom route eliminates a dead end.

**Consequence:** `routes.ts`, `NavBar.tsx`, `HomeView.tsx` updated; `src/features/custom/` deleted. Tests updated where they asserted the old flows (routes test dropped `#/custom`; App test uses Forms for the brand-return path; PhotoView custom-dimensions test replaced by a "load preset autofills fields" test). 160/160 tests pass.

## D027 — Signature preview is WYSIWYG (trimmed)

**Decision:** When a signature image is uploaded, the "Check your signature" preview now renders the *trimmed* result (`trimToCanvas` → PNG blob URL) instead of the raw uploaded file; the original file object URL is revoked immediately. If no ink is found at preview time, the raw preview is kept and the friendly `invalid-input` error still surfaces on Continue.

**Reason:** Previously the preview showed the untouched scan/photo — a small signature appeared as a tiny mark floating inside large white paper margins, which read as if the app had padded the canvas with white. Showing the trimmed output makes the preview match the exported file exactly.

**Consequence:** Preview object URL lifecycle unchanged for cleanup (`releaseSessionAssets` still revokes `loaded.previewUrl`, which now points at the trimmed blob). 160/160 tests pass.

## D028 — Result matte hugs the image; caption removed

**Decision:** The result preview no longer renders a `<figcaption>` inside `.result-figure`. The filename and size remain in the meta tiles below. `.result-figure` stays `width: fit-content` + paper-white (`oklch(99.2% 0.004 100)`) with light border and shadow, so the matte always hugs the image. The previous caption's intrinsic width was wider than small signatures and forced the white card to grow, which read as artificial side padding.

**Reason:** The screenshots showed white side-fill that was not in the downloaded file. The caption duplicated data already shown in the meta tiles and, via `fit-content`, stretched the matte. Removing it makes the preview and the download visually identical.

**Consequence:** No processing change; purely presentational. The matte now matches the image exactly.

## D029 — Result matte width is capped to displayed image

**Decision:** `.result-figure` now has `max-width: min(340px, 100%)` and `width: fit-content`; `.result-preview` uses `max-width: 100%` instead of `min(300px, 100%)`. The caption was already removed in D028, but the figure's `fit-content` still used the image's intrinsic width (e.g., 1200px scan) while the image was displayed at 300px, leaving hundreds of pixels of white matte to the right. Capping the figure to the displayed width makes the matte hug the preview on all viewports.

**Reason:** Screenshots showed white side-fill in both the preview (raw upload) and the result (narrow signature 231×100 inside a 278px matte). The matte should match the downloaded file, which has no padding.

**Consequence:** Visual only; no processing change. Preview and result now show identical tight bounds.

## D030 — Signature manual-first requirements

**Decision:** The signature page now mirrors the photo page: a "Load preset" dropdown sits above always-visible manual fields (Width, Height, Max size KB, Format). Selecting a preset autofills those fields; there is no separate "Custom…" mode. Default manual values are 300×100, 20KB, JPEG (matching the Standard profile).

**Reason:** Consistency — every requirements editor is sidebar + single column with one large card on top and smaller cards below; manual fields are always editable and presets are shortcuts, not hidden modes.

**Consequence:** `SignatureView.tsx` now uses `profileFromCustom` like `PhotoView`; tests still expect the initial "300 × 100 px · JPEG · ≤ 20 KB" summary, which the new defaults preserve.

## D031 — Preset loader shows the selected preset

**Decision:** The "Load preset" `<select>` in both Photo and Signature is now controlled (`value={presetSelect}` / `onChange={setPresetSelect}`) and retains the chosen preset label after autofill. Previously it used `defaultValue=""` and reset to `""` on every change, so the placeholder "— Choose a preset to autofill —" remained visible even after a preset had been applied.

**Reason:** Users reported the loader appeared stuck on the placeholder. A preset loader should read as an action that leaves a visible selection.

**Consequence:** No test change needed; the new PhotoView test asserts the autofill via the controlled select.

## D032 — Preview and result mattes match the page background

**Decision:** `.result-figure` (used for both the "Check your signature" preview and the "Your signature/photo is ready" result) now uses `background: var(--surface)` and `border: 1px solid var(--border)` instead of paper-white `oklch(99.2% ...)`. The image itself remains opaque white (draw canvas fills `#FFFEFB`, pipeline `flattenToWhite()`), so the signature's white paper is the image data, while the matte's padding matches the page.

**Reason:** The screenshots showed a wide white card around a narrow signature (the figcaption's intrinsic width stretched the matte, and `fit-content` used the image's intrinsic width). With the caption removed in D028 and the matte capped to the displayed image width in D029, the remaining white was the matte's own background. Matching it to the page makes the image's white determine the bounds.

**Consequence:** Visual only, in both themes. Draw preview already used trimmed PNGs (D027), so preview and download are now identical.

## D033 — Quality intelligence uses deterministic heuristics; face detection deferred

**Decision:** Advisory blur/lighting/contrast hints come from deterministic pixel statistics (Rec.709 luma, mean/stddev, Laplacian variance) computed on a downscaled render — no ML model is downloaded. Face-position guidance remains future work requiring an explicit opt-in client-side model per the PRIVACY spec.

**Reason:** Satisfies T010's optionality/no-blocking/no-external-inference criteria by construction: nothing to load lazily, nothing that can fail the core flow (assessment is wrapped and returns undefined on any failure), zero new dependencies. Skin-tone-based face heuristics were rejected as unreliable and biased.

## D034 — Advisory hints are separate from technical validation

**Decision:** Quality hints attach to `ProcessedAsset.advisory` and render in their own "Optional quality hints" section, never merged into the pass/fail `ValidationResult` nor affecting the download action.

**Reason:** Keeps FR-07 technical checks objective and deterministic, while still giving users actionable guidance (per VALIDATION spec: advisory unless objectively required).

## D035 — Manual edits take precedence over an active form preset

**Decision:** In the photo flow, editing any manual requirement field (width, height, min/max size, format) while a form preset is active via `#/photo?preset=…` now switches the job to the edited manual settings (`manualEdited` flag). Previously `profile` always used the preset profile in that state, so visible edits silently had no effect on the processed output.

**Reason:** Found in the 2026-08-22 MVP release audit (blocker B1). Editable controls that do not affect the result can produce files that differ from what the user configured — unacceptable for a compliance tool.

**Consequence:** Preset context (source link, verification date) remains visible; the target summary now reflects edits immediately. Regression-tested in `PhotoView.test.tsx`.

## D036 — Minimum file size is a first-class manual field

**Decision:** Both photo and signature flows expose an optional "Min size (KB)" field alongside Max. Ranged presets (e.g. exam photo 20–50 KB) autofill both bounds, and switching to generic settings preserves the full range instead of collapsing it to the max.

**Reason:** Found in the MVP release audit (blocker B2). The engine and validation already supported `minBytes`; only the UI dropped it, so outputs below a form's real minimum could pass validation unchecked — PRD §5 lists minimum/maximum bytes under MVP custom requirements.

**Consequence:** The optimizer reports `too-small` with an explanatory note when the minimum cannot be reached naturally. 177/177 tests pass.

## MVP release checkpoint (2026-08-22)

MVP scope (T001–T010) audited against the PRD, specs, and implementation; declared **release-ready**. Engineering gates: typecheck ✓, lint ✓, tests 177/177 ✓, production build ✓. Privacy claims verified against source (no network calls, no analytics). Audit details: `.agents/project/MVP_RELEASE_AUDIT.md`. Two blockers found during audit were fixed (D035/D036). V2 begins at T011 (manual on-device verification gate).

## D037 — Camera stream attaches after the video element mounts

**Decision:** `CameraStep` now attaches the `MediaStream` in an effect keyed on the ready state, after the `<video>` has mounted, instead of inside `begin()` while the state was still `starting` (when `videoRef.current` is always null). Playback start is guarded for environments where `play()` does not return a promise.

**Reason:** Post-release defect report: camera light turned on but the preview stayed blank. The `<video>` only renders in the ready state, so the pre-mount `attachStream` call never found an element; the stream ran with no visible preview. Regression-tested by asserting `video.srcObject === stream`.

**Consequence:** Preview now displays as soon as permission is granted; switch/retry flows re-attach on each transition to ready. 178/178 tests pass.

## T011 outcome (2026-08-22)

Manual verification passed on real hardware; MVP release checkpoint cleared;
`v0.1.0-mvp` tagged and published.

## D038 — Live camera guidance reuses the deterministic quality engine

**Decision:** Capture-time framing hints (T012) are computed by sampling the live video into a ~160 px canvas every 700 ms and running the existing `assessImageQuality` heuristics (`processing/quality.ts`). Hints collapse to one message with priority dark > bright > blurry > flat > good, render as a single advisory `role="status"` line, and never block or gate capture.

**Reason:** Highest-priority V2 item ("camera framing guidance") achievable with zero new dependencies, zero model downloads, and bounded CPU cost — consistent with D033 (no ML until opt-in) and D034 (advisory separate from validation).

**Consequence:** Face-position guidance (T013) will extend the same hint surface once an opt-in detector is chosen.

## D039 — Face guidance uses the native FaceDetector; bundled models deferred

**Decision:** Face positioning assistance (T013) is a progressive enhancement over the browser-native `FaceDetector` API, behind an explicit opt-in toggle ("Face framing") shown only where the API exists. No model is downloaded and no new dependency is added. Guidance derives from bounding-box geometry only (absent / too far / too close / off-center). The bundled-WASM model path is deferred until native coverage proves insufficient; if ever added it must pass the PRIVACY opt-in gate with disclosed payload numbers.

**Reason:** Satisfies V2 priorities 2/3 with zero privacy surface change and bounded CPU cost (detection piggybacks on the T012 700 ms sampling loop, guarded against overlapping runs). Hint priority merges as light/blur > face positioning > contrast, since poor light or blur also makes detection unreliable.

**Consequence:** Head-angle (roll) guidance needs landmarks — deferred with the same privacy gate. Auto-crop pre-positioning from a detected face is deferred to a follow-up so this task changes no crop behavior.

## D040 — Background handling is advisory + opt-in heuristics, no segmentation

**Decision:** Background quality (T014) is an advisory check from border-band uniformity statistics (band 8% of the smaller side, RGB distance ≤30 to the border mean, plain ≥0.6). White-background mode is opt-in per job (`ImageRequirements.background: 'white'`), implemented as an edge-seeded flood fill that whitens only background-like regions connected to the border; enclosed areas and out-of-tolerance subject pixels are never touched. Whitening failures fall back to the unmodified photo, and the result screen labels the effect "best effort — check the preview".

**Reason:** Completes V2 priorities 8–9 with deterministic, testable pixel math and zero privacy surface change. VALIDATION spec requires background checks stay advisory unless objectively measurable — whitening is never claimed as compliance.

**Consequence:** ML matting remains a V3/V4 concern. The requirement field is data, so presets can carry `background: 'white'` later without UI changes.
