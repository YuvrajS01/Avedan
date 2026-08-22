# T012 — Camera framing guidance (V2)

**Status:** DONE (2026-08-22)

**Priority:** P0 (first V2 task; highest-priority item on the V2 list)
**Depends on:** T005 camera capture, `processing/quality.ts` heuristics
**V2 objective covered:** "capture and prepare valid application photos" — live capture-time guidance.

## Goal

While the camera preview is live, show short, actionable, advisory hints so
users can fix the shot *before* capturing, instead of discovering problems in
post-processing. All analysis stays on-device with zero model downloads
(D033 constraint).

## Scope

1. New framework-independent module `src/features/camera/framing.ts`:
   - `sampleVideoFraming(video)` draws the current video frame into a small
     offscreen canvas (~160 px wide) and reuses `assessImageQuality`
     (luma statistics + Laplacian variance) from `processing/quality.ts`.
     Fail-safe: returns null on any error or missing pixel data.
   - `deriveFramingHint(checks)` collapses quality checks into ONE hint,
     priority: too dark > too bright > blurry > flat/low contrast > good.
   - Capture-tuned thresholds may differ slightly from post-process defaults.
2. `CameraStep` runs a lightweight sample loop (~700 ms interval) while the
   preview is ready; stops on unmount/status change; never blocks capture
   (advisory only, mirrors D034).
3. UI: single live status line above the capture controls
   (`role="status"`, polite). Hidden when nothing to say beyond "good".
4. Tests: unit tests for `deriveFramingHint` priority mapping and
   `sampleVideoFraming` fail-safety; CameraStep test asserting a dark-frame
   hint renders.

## Non-goals

- Face detection / positioning (next task, needs an opt-in client-side model
  per PRIVACY spec).
- Background quality detection, white background processing.
- Blocking capture or altering validation results.

## Acceptance criteria

- [x] Hint appears for dark/bright/blurry/flat synthetic frames and clears when quality is fine.
- [x] No capture-path behavior change: guidance never disables the shutter.
- [x] Sampling stops when leaving the step; no leaks (interval cleared, no retained frames).
- [x] Typecheck/lint/tests/build pass; mobile-first layout intact.

## Results

Implemented 2026-08-22. `src/features/camera/framing.ts` provides
`sampleVideoFraming` (160 px-wide local sample, reuses `assessImageQuality`)
and `deriveFramingHint` (priority: dark > bright > blurry > flat > good).
`CameraStep` samples every 700 ms while ready and renders a single
`role="status"` warning line above the shutter only for attention hints.
187/187 tests pass, including new unit + integration coverage.
