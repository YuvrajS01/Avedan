# T030 — V4 Document scan / perspective correction (deferred)

**Status:** PLANNED
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

- [ ] Document quadrilateral detected or manually set, perspective corrected, preview matches output pixels.
- [ ] Preset `pixelSize` respected; file size optimizer applies.
- [ ] Tests for geometry math + correction (without DOM canvas).
- [ ] Docs updated; no new deps unless weight is justified and disclosed.

## Verification

- Manual: photograph an A4 sheet at ~30° angle, correct to 800×1100 px, verify straight edges and correct dimensions.
