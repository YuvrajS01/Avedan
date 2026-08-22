# T010 — Optional Local Intelligence

Status: DONE

## Objective

Add face/blur/lighting guidance without weakening the base flow.

## Acceptance criteria

- [x] ML features are optional.
- [x] Basic processing works if the model fails to load.
- [x] Model assets do not block first meaningful paint unnecessarily.
- [x] Guidance is clearly advisory.
- [x] No image data is sent to external inference services.

## Implementation notes

- `src/processing/quality.ts`: deterministic, dependency-free quality heuristics — Rec.709 luma conversion, mean/standard-deviation lighting and contrast analysis, and 4-neighbour Laplacian variance for sharpness. Documented thresholds (`minMeanLuma`, `maxMeanLuma`, `minLumaStdDev`, `minSharpness`) with custom overrides.
- `assessCanvasQuality` runs on a downscaled (≤256 px) render of the processed output, wrapped in try/catch: any failure returns `undefined` so the core flow is completely unaffected (D007). No ML models are downloaded at all — nothing loads lazily or eagerly, satisfying the no-blocking-paint criterion by construction.
- Face detection is deliberately deferred (DECISIONS D022): shipping a real face model would add heavy payload and remote assets, conflicting with the optional/no-blocking criteria. The advisory-check infrastructure is in place for it to land later behind explicit opt-in per the PRIVACY spec.
- Integration: the photo pipeline attaches optional `advisory: QualityCheck[]` to `ProcessedAsset`; signatures skip assessment. `ProcessedResult` renders an "Optional quality hints" section labelled advisory-only, visually distinct from technical checks.
- Advisory hints never affect validation status or the download action; they use no guarantee/official language (tested).

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 174 tests pass (17 new): luma conversion/statistics, Laplacian variance on flat vs checkerboard input, brightness/contrast/sharpness flagging with custom thresholds, canvas assessment incl. context/getImageData failure tolerance returning undefined, no-guarantee language
- `npm run build` — succeeds

## Known limitations

- Heuristics are simple global statistics; uneven lighting or busy backgrounds can produce false positives/negatives — hence advisory framing only.
- Real face-position guidance remains future work requiring an opt-in client-side model per D022 and the PRIVACY spec's third-party-model rules.
