# MVP Release Audit — 2026-08-22

Full verification of the MVP against the PRD (`.agents/docs/PRD.md`), specs
(`.agents/specs/*`), release checklist (`.agents/docs/RELEASE_CHECKLIST.md`) and
the actual implementation in `src/`.

## Verdict

**MVP is release-ready.** All MVP features are implemented, all engineering
checks pass, privacy claims are verified accurate, and the two blockers found
during the audit were fixed in this pass (see "Fixes applied"). Remaining
issues are classified IMPORTANT or lower and deferred to V2.

## Engineering checks

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | 177/177 PASS |
| `npm run build` (production) | PASS (~77 KB gzip JS) |

## Feature verification

### Photo
- Upload: PASS (`IntakeStep` file picker + drag-and-drop; typed validation before decode)
- Camera capture: PASS (`CameraStep`: permission/denied/not-found/unsupported/error states, front/back switch, frames stay local)
- Fixed-ratio crop: PASS (`CropStep` box locked to target ratio via `cropBoxStyle`; pan/zoom with keyboard support)
- Resize: PASS (exact-dimension resize with stepped halving)
- Target/max file-size optimization: PASS (bounded binary search over encode quality)
- Format handling: PASS (JPEG/PNG/WebP output; input JPEG/PNG/WebP validated up front)
- Validation: PASS (FR-07 summary: dimensions, aspect ratio, format, size bounds)
- Download: PASS (blob URL + `download` attribute, client-side only)

### Signature
- Upload: PASS
- Drawing: PASS (pointer canvas, pen sizes, undo/clear, empty-canvas guard)
- Whitespace trimming: PASS (`trimToCanvas` ink-bounds detection; no-ink → clear error)
- Resize: PASS (fit-within, never upscales)
- Target/max file-size optimization: PASS
- Validation: PASS (`within` dimension mode via shared engine)
- Download: PASS

### Custom requirements
- Width / height: PASS (manual fields on both flows)
- Aspect ratio: PASS (derived from width/height and enforced by the crop stage)
- File size: PASS (Min + Max KB fields; min was added during this audit — see blocker B2)
- Output format: PASS (JPG/PNG/WebP)

### Privacy
- No image bytes uploaded: VERIFIED — zero `fetch`/XHR/sendBeacon calls in `src/`;
  no analytics of any kind; service worker is same-origin GET-only.
- Privacy messaging accurate: VERIFIED — "nothing is uploaded", "works offline
  after its first load", "100% on-device" all match implementation (self-hosted
  fonts, PWA precache). EXIF/GPS stripped by canvas re-encode. Object URLs
  revoked on session reset/unmount.

### Quality
- Mobile workflow: responsive shell with breakpoints at 52/64/40/34/30rem;
  camera uses `playsInline muted`; pointer events throughout.
- Desktop workflow: drag-and-drop intake, sidebar navigation.
- Large-image handling: stepped-halving downscale; bounded optimizer probes.
- Error states: actionable messages for empty/unsupported/corrupt files,
  encoder failures, camera failures, impossible size targets.
- Browser compatibility: ImageBitmap with `<img>` fallback; WebP failure
  surfaces a "try JPG" error; camera guarded by feature detection.
- Accessibility basics: `role="status"`/`role="alert"` live regions,
  labelled inputs, focus-visible styles, keyboard pan in crop stage,
  `prefers-reduced-motion` honored.

## Issues

### BLOCKER (fixed in this audit)

- **B1 — Manual edits ignored while a form preset is active (photo flow).**
  With `#/photo?preset=…`, `profile` always used the preset profile even after
  the user edited Width/Height/size fields, so visible edits had no effect on
  the processed file. Fixed: any manual edit now takes precedence
  (`PhotoView.tsx`, decision D035).
- **B2 — Minimum file sizes silently discarded.** Range presets (e.g. exam
  photo 20–50 KB) lost their minimum when autofilled into manual fields, so
  outputs below a form's real minimum passed validation unchecked. The engine
  already supported `minBytes`; both flows now expose a Min size (KB) field and
  preserve ranges end-to-end (decisions D035/D036).

### IMPORTANT (deferred to V2)

- I1 — PNG outputs cannot be size-optimized via quality search (PNG ignores
  quality) and the signature pipeline does not pass `allowedScales` even though
  its dimension mode is `within`; oversized PNGs surface as "too large"
  instead of being scaled to fit.
- I2 — Signature flow is not wired to Forms presets
  (`requirementsFromPreset(preset, 'signature')` unused in UI).

### MINOR

- M1 — EXIF orientation relies on modern browser defaults; very old browsers
  could rotate photos incorrectly.
- M2 — Size fields reject decimals silently (e.g. `20.5` KB parses as unset).
- M3 — Signature drawing canvas is pointer-only; keyboard users must use upload.
- M4 — Processing runs on the main thread; very large images can briefly block
  the UI (architecture permits workers "when practical").
- M5 — HEIC input rejected with a clear message rather than converted.

### NICE-TO-HAVE

- N1 — mm/cm + DPI physical-size inputs in the UI (engine math exists:
  `dimensionsFromPhysical`).
- N2 — Background-mode requirement support.
- N3 — Worker offload for encode/optimize loop.

## Release checkpoint

MVP declared complete 2026-08-22. Manual on-device verification (real mobile
camera, offline reload/install per `.agents/docs/RELEASE_CHECKLIST.md`) remains
an operational gate before any public deployment and is tracked as task T011.
