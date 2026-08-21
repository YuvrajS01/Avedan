# T003 — Constraint-Based File Size Optimizer

Status: DONE

## Objective

Build an optimizer that meets file-size constraints with the best practical quality.

## Acceptance criteria

- [x] Maximum byte size can be satisfied when a valid candidate exists.
- [x] Minimum/maximum ranges are supported.
- [x] Exact dimensions remain unchanged when mandated.
- [x] Search converges quickly.
- [x] Failure states explain that the requested constraints may be impossible.
- [x] Unit tests cover multiple image sizes and target limits.

## Implementation notes

- `src/processing/optimize.ts`:
  - `optimizeEncoding(encodeAt, options)` performs a bounded binary search over encode quality (default bounds 0.3–0.95, epsilon 0.01, ≤8 refinement steps per scale → ≤10 encodes per scale).
  - The encoder is injected as `EncodeAt(quality, scale)`, so the optimizer is fully decoupled from canvas/codec details and is worker-ready.
  - Modes: `maxBytes` (maximize quality under cap), `targetBytes` (approach target from below), `minBytes` (reject undersized results; no artificial padding per architecture rules), and combinations.
  - Dimensions are never changed unless `allowedScales` is provided; scales are tried in order only when the mandatory-quality floor cannot satisfy the size cap.
  - Outcomes: `ok`, `too-large` (returns smallest candidate produced), `too-small` (returns largest candidate); callers can explain impossibility per the UI error spec.
  - `createCanvasEncoder(canvas, format)` adapts a real canvas to `EncodeAt`, rendering resized copies for sub-1 scales.
- Monotonicity assumption (size non-decreasing in quality) holds for JPEG/WebP; PNG has no quality knob so it resolves via the first probe or scale fallback.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 61 tests pass (13 new): max-only, immediate fit, range, target-from-below, too-small (both variants incl. discontinuous codec), too-large with smallest-candidate retention, allowed-scale dimension reduction, no-dimension-change guarantee, determinism, bounded convergence, invalid options
- `npm run build` — succeeds

## Known limitations

- Real-codec behavior (non-monotonic blips near extreme qualities) is not exercised in unit tests; integration verification happens in T004.
- Minimum-size satisfaction relies on natural encoder output; no byte inflation is performed.
