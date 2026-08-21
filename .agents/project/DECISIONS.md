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
