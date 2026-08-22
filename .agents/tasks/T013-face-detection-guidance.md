# T013 — Face detection and positioning assistance (V2)

**Priority:** P1 (next V2 task after T012)
**Depends on:** T005 camera capture, T012 framing guidance, PRIVACY spec
**V2 objectives covered:** face detection (2), face positioning assistance (3), head-angle guidance (6), automatic crop suggestions (7 — partial).

## Goal

Detect a single face in the camera preview / captured photo locally and guide
the user toward standard passport-style framing: face present, roughly
centered, filling an appropriate share of the frame, level head.

## Privacy gate (hard requirement)

Face detection requires a client-side model. Per the PRIVACY spec and D033:
- The model must be loaded **opt-in only**, with explicit UI before the first
  download.
- Model assets must state where they are fetched from; image pixels never
  leave the device.
- If no opt-in: all existing flows keep working unchanged (T012 hints remain).
- No analytics on model usage or detections.

## Candidate approach (decide during task start)

1. `FaceDetector` API (`window.FaceDetector`) where available — zero payload,
   Chrome/Android only.
2. Bundled lightweight WASM/TFJS face detector (~hundreds of KB) loaded
   lazily on opt-in, cached by the service worker for offline use.

Prefer 1 as a free progressive enhancement, then evaluate 2; do not add heavy
dependencies without recording a DECISIONS entry with payload numbers.

## Scope

- `src/features/camera/faceGuidance.ts`: framework-independent detection +
  guidance logic (face found/not found, too far/close, off-center, tilt) from
  bounding-box geometry alone — unit-testable without a real model.
- Live hint line extends T012's status area (e.g. "Move closer", "Center your
  face in the oval").
- Optional auto-crop suggestion: when a face is detected in a captured frame,
  pre-position the crop stage focus so eyes land at the canonical height;
  user can still adjust freely (FR-04 preserved).

## Non-goals

- Identity/recognition of any kind; storing biometric templates; server calls.
- Background quality/white background processing (later V2 tasks).

## Acceptance criteria

- [ ] Guidance states implemented and tested with synthetic bounding boxes.
- [ ] Model download is opt-in, disclosed, and skippable; flows work without it.
- [ ] Auto-crop suggestion never overrides manual adjustments.
- [ ] Typecheck/lint/tests/build pass.
