# T002 — Image Processing Primitives

Status: DONE

## Objective

Implement tested, framework-independent operations for decode, crop, resize, format conversion, and metadata extraction.

## Acceptance criteria

- [x] Supported local images can be decoded.
- [x] Crop calculations produce the requested aspect ratio.
- [x] Resize produces exact requested pixel dimensions.
- [x] Format conversion works for required MVP formats.
- [x] Tests cover edge cases.
- [x] Processing functions have no React/UI dependencies.

## Implementation notes

- All code lives under `src/processing/` with zero React/DOM-framework imports; the only DOM touchpoints are `document.createElement('canvas')` in `defaultCanvasFactory` and image decoding APIs.
- Modules:
  - `geometry.ts` — pure math: `computeCropRect` (aspect-ratio crop with focus point + clamping), `computeResizeDimensions` (exact/proportional), `dimensionsFromPhysical` (mm + DPI → pixels).
  - `crop.ts` — `cropToCanvas`, `cropToAspectRatio`; canvas creation is injectable via `CanvasFactory` (DECISIONS D010) so canvas ops are unit-testable without a real canvas.
  - `resize.ts` — `resizeToCanvas` with stepped halving for high-quality large downscales; exact target dimensions guaranteed.
  - `encode.ts` — `encodeCanvas` for JPEG/PNG/WebP via `canvas.toBlob`, quality applied to lossy formats only, friendly error messages per UI spec.
  - `decode.ts` — `decodeImage` (`createImageBitmap` with `<img>` fallback), `assertDecodableFile` pre-flight checks (empty file, unsupported MIME).
  - `metadata.ts` — `inspectImage` returns dimensions/MIME/byte size without uploading anything.
  - `errors.ts` — typed `ProcessingError` codes for later user-facing messaging.
- Barrel export at `src/processing/index.ts`.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 48 tests pass (38 new): crop rect edge cases (tiny images, extreme ratios, focus clamping, invalid input), exact/proportional resize, physical-size determinism, halving-step downscale sequence, encode MIME/quality/error paths, decode pre-flight rejection
- `npm run build` — succeeds

## Known limitations

- Real pixel-level encode/decode behavior cannot be exercised in jsdom; browser verification of actual blobs happens with T003/T004 integration. The spec allows implementation variance at byte level.
- WebP encoding depends on browser support (universally available in current evergreen browsers); no explicit capability probe yet.
