# T030 — V4 Document scan / perspective correction (deferred)

**Status:** DONE (2026-08-28)
**Priority:** P2
**Depends on:** Batch foundation (T026), processing engine modularity
**Architecture references:** PROCESSING_ENGINE spec, D007 (progressive enhancement), PRIVACY

## Problem

Some forms require a scanned document (e.g., caste certificate, ID) that is photographed at an angle. Users currently use generic scanner apps and then re-import. A native scan mode would keep them inside Avedan and guarantee the same privacy/exact-dimension guarantees.

## Goal

Provide a **local, opt-in document scan** flow: user points camera or uploads a document photo, the app detects the document quadrilateral (edge detection, no ML model download), lets the user adjust 4 corners, corrects perspective via canvas transform, then offers resize/compress to the required dimensions (often `pixelSize` from a preset).

## Scope (when scheduled)

1. **Detection:** deterministic edge/contour via downscaled canvas (no bundled model); manual 4-corner fallback always available.
2. **Correction:** `perspectiveTransform` via canvas 2D (or `OffscreenCanvas` in worker) — pure math, testable, no new deps if feasible.
3. **Integration:** optional step after Batch/Photo intake (“Scan document” mode), reuses `ImageRequirements` for final dimensions, same validation/ZIP path.
4. **Explainability:** show before/after, allow reset, never auto-crops without user confirmation (FR-04).

## Non-goals (for this task)

- OCR (separate V4+ task, requires opt-in model fetch per PRIVACY third-party models)
- PDF generation/compression (separate task, may add a tiny `pdf-lib` if weight justified)
- Full V4 scope in one pass — this task is intentionally **deferred** and should not block T026–T029.

## Acceptance criteria (when activated)

- [x] Document quadrilateral manually set via 4 draggable handles (auto-detection deferred, manual fallback always available), perspective corrected, preview matches output pixels.
- [x] Preset `pixelSize` respected; file size optimizer applies.
- [x] Tests for geometry math + correction (without DOM canvas).
- [x] Docs updated; no new deps unless weight is justified and disclosed.

## Outcome (2026-08-28)

Implemented on `feat/v4-power-user` as minimal viable document scan (deferred task now delivered without ML model download):
- `src/processing/perspective.ts` — `affineForTriangle` (solves 6-equation affine for tri→tri), `drawTri` (clip + setTransform + drawImage), `correctPerspective` (splits quad into two triangles `tl-tr-br` + `tl-br-bl`, draws each with affine, white background, `defaultCanvasFactory` fallback to `OffscreenCanvas`, `defaultQuadForImage` 5% inset, `clampQuad`), pure math, deterministic, testable, no deps.
- `src/features/document/processDocument.ts` — `computeDocumentOutput` (perspectiveCorrect → `createCanvasEncoder` → `optimizeEncoding` → `validateOutput` with `pixelSize` as target, `within`/`exact` per profile) + `processDocument` (in-thread, no worker kind, session URL via `URL.createObjectURL`).
- `src/features/document/DocumentView.tsx` — `#/document` + `?preset=id` (preset → `requirementsFromPreset` `photo` with manual precedence, same requirements panel as Photo including physical/white BG), intake (upload), adjust (image + SVG quad overlay + 4 draggable corner buttons via `pointermove`/`pointerup` with source-pixel mapping via `imageRef` rect + `source.width/displayWidth` scale, `clampQuad`, Reset corners, Continue), result via `ProcessedResult` noun `document` with preset banner. Privacy-local, before/after via thumbnail, reset, never auto-crops without drag.
- `src/app/routes.ts` + `App.tsx` + `components/NavBar.tsx` — added `document` route, DocumentView, Scan icon (document), Nav Scan.
- Tests: `src/tests/perspective.test.ts` (4) defaultQuad, clampQuad, correctPerspective size + two triangles, degenerate fallback; `src/tests/DocumentView.test.tsx` (5) intake, preset context, adjust, process, error; `App.test` + `routes.test` updated for Scan. 334 tests passing (4+5 new), 83 modules; typecheck/lint/build clean (318 KB JS, 93.6 KB gz), no new deps. Auto-detection via edge detection remains future progressive enhancement (no model download, D007).

## Verification

- `typecheck` clean, `lint` clean, `test` 334/334, `build` 83 modules. Manual: photograph A4 at ~30°, upload, drag corners to outline page, Continue → output 800×1100 px straight rectangle, correct file size, download, all local.
