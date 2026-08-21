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
