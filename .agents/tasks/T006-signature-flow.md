# T006 — Signature Upload and Drawing

Status: DONE

## Objective

Implement signature upload and a lightweight drawing canvas.

## Acceptance criteria

- [x] User can draw a signature with a pointer/touch input.
- [x] Clear/undo/reset works.
- [x] Uploaded signatures can be cropped.
- [x] Empty margins can be trimmed.
- [x] Output is passed through the same requirement/validation engine.

## Implementation notes

- `src/processing/trim.ts`: `computeInkBounds` (pure RGBA scan with luminance + alpha thresholds; null for blank input) and `trimToCanvas` (renders source, reads pixels, crops to ink bounds). Covers the "all-white/empty signature" edge case from the processing spec with a friendly `invalid-input` error.
- `geometry.ts`: added `computeFitDimensions` — shrink-to-fit preserving aspect ratio, never upscales (DECISIONS D015).
- `src/features/signature/DrawCanvas.tsx`: pointer-event drawing (touch/stylus/mouse via Pointer Events + `touch-action: none`), stroke-list model enabling undo/clear, three pen sizes, fixed logical resolution scaled by CSS.
- `processSignature.ts` follows the PROCESSING_ENGINE signature order: trim → fit resize → encode → optimize (`optimizeEncoding`) → checks. Uploaded images go through the identical pipeline.
- `SignatureView`: choose (upload/draw) → draw or preview → shared result view. Data-driven signature profiles in `profiles.ts` plus custom max-KB/format option.
- Refactor: result view generalized to `components/ProcessedResult.tsx` (noun prop) and asset result types moved to `domain/jobs/result.ts`; photo flow reuses both.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 109 tests pass (26 new): ink-bounds edge cases (blank, transparent, single pixel, corner ink, thresholds, tiny inputs), trim cropping via pixel-capable fake canvases, fit-dimension math, and SignatureView flow tests (draw → finish → result, undo-to-empty, upload path through the same engine, blank-signature error surfacing)
- `npm run build` — succeeds

## Known limitations

- No threshold/ink-cleanup step yet (spec lists it as optional "if enabled"); trim works on grayscale/anti-aliased scans within the default luminance threshold.
- Real stroke rendering requires a browser (jsdom canvas is stubbed); manual verification recommended before release.
- Undo granularity is per-stroke (no partial-stroke erase).
