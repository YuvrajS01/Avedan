# T005 — Guided Camera Capture

Status: DONE

## Objective

Add a browser camera capture experience with clear permission handling and capture guidance.

## Acceptance criteria

- [x] Camera permission request is handled gracefully.
- [x] Capture works on supported browsers.
- [x] Unsupported/denied camera access provides upload fallback.
- [x] Captured frame feeds into the existing photo processing pipeline.
- [x] No camera frame is uploaded to a server.

## Implementation notes

- `src/features/camera/camera.ts`: support probe (`isCameraSupported`), `startCamera` via `getUserMedia` (facing mode + ideal 1080p, audio off), `captureFrame` (video frame → local canvas at intrinsic size), `frameToFile` (local JPEG encode → `File`), and `describeCameraError` mapping `NotAllowedError`/`SecurityError` → denied, `NotFoundError`/`NotReadableError`/`OverconstrainedError` → not-found.
- `CameraStep.tsx`: state machine `starting → ready | denied | not-found | unsupported | error`; live preview with framing guidance; Capture, Switch camera (user/environment toggle), and per-state fallbacks ("Use upload instead", "Try again"). Stream tracks are stopped on capture completion and unmount.
- Integration: the captured `File` re-enters the standard intake path (`loadPhotoSource`), so camera output flows through the same crop → optimize → validate → download pipeline. Frames are only ever drawn to local canvases — nothing is transmitted (privacy architecture).
- PhotoView gains a `camera` step; the "Take photo" button renders only when the API is supported.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 131 tests pass (12 new): frame capture math + typed empty-frame error, file wrapping/encode failure, error classification, unsupported fallback, denied fallback, successful capture feeding `onCaptured` with stream stop, retry after generic failure, stream stop on unmount
- `npm run build` — succeeds

## Known limitations

- Live preview/capture requires real hardware; jsdom coverage mocks the media APIs, so a manual browser check (Chrome/Firefox/Safari, Android/iOS) is recommended before release.
- No capture-quality heuristics (blur/lighting) — those belong to T010 advisory checks.
