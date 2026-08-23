# T015 — Auto-crop suggestion from detected face (V2)

**Status:** DONE (2026-08-22)

**Priority:** P2 (next V2 task after T014)
**Depends on:** T013 face guidance (native FaceDetector), crop stage (FR-04)
**V2 objective covered:** automatic crop suggestions (7) — completing the deferred T013 item.

## Goal

When a face is detected on the captured photo, pre-position the crop stage so
the head lands at a canonical passport-style placement (eyes roughly one third
from the top of the frame). The user can always adjust freely — the suggestion
only sets the initial framing and never overrides manual changes (FR-04).

## Privacy gate

Same as T013: native `FaceDetector` only, opt-in "Face framing" toggle already
exists. If the user has not enabled it — or the platform lacks the API — the
crop stage opens centered exactly as today. No models, no downloads.

## Scope

1. Camera capture path: when face framing is on and a face box exists at
   capture time, pass the normalized face geometry along with the captured
   file to the photo flow.
2. Crop stage: compute initial pan/zoom from the face rect so the head sits at
   the canonical position within the target aspect ratio; pure math function in
   `features/photo/cropMath.ts` (e.g. `faceCropFocus`) with unit tests.
3. A small "Auto-framed from your face" note on the crop step; dismissed as
   soon as the user pans or zooms.

## Non-goals

- Landmarks/roll estimation; background work (T014 done); batch processing.

## Acceptance criteria

- [x] `faceCropFocus` math tested: canonical placement, clamped inside image bounds.
- [x] Without face data or opt-in, behavior is byte-for-byte unchanged.
- [x] Manual pan/zoom overrides the suggestion immediately.
- [x] Typecheck/lint/tests/build pass.

## Results

Implemented 2026-08-22:
- `cropMath.faceFraming()`: pure math placing the face center horizontally and
  at 42% box height, sizing the face to ~55% of crop-box height; zoom clamped
  to the slider range [1,3]; offsets clamped via existing `clampPan`.
- Camera capture: when face framing is enabled, the last normalized face box
  from the sampling loop is passed with the captured file (undefined without
  opt-in/detection — upload path untouched).
- Crop step: suggestion applied once after box measurement, before any manual
  interaction; an "Auto-framed from your face — adjust freely." note shows and
  dismisses on first pointer/keyboard pan or zoom change (FR-04 preserved).
- Head-angle guidance remains deferred (needs landmarks). 220/220 tests pass;
  typecheck/lint/build clean.
