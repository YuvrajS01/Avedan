# T004 — Photo Upload, Crop and Export Flow

Status: DONE

## Objective

Build the end-to-end photo workflow using the processing engine.

## Acceptance criteria

- [x] Upload works on desktop and mobile.
- [x] Fixed-aspect crop works.
- [x] User sees target requirements.
- [x] Output metadata is shown.
- [x] User can download the generated file.
- [x] Reset returns the app to intake state.

## Implementation notes

- Flow state machine in `src/features/photo/PhotoView.tsx`: intake → crop → result, with full reset (object URLs revoked) back to intake.
- `IntakeStep`: file picker (`accept` limited to JPEG/PNG/WebP) plus drag-and-drop; privacy message shown at intake; pre-flight errors surfaced via `ProcessingError` messages.
- Requirement selection is data-driven (`src/domain/requirements/profiles.ts`): three generic example profiles + a Custom option (width/height/max KB/format). Profiles are explicitly labeled as examples pending the verified preset registry (T008) — see DECISIONS D013.
- `CropStep`: fixed-aspect box (CSS aspect-ratio), pointer-drag panning with clamping, zoom slider (1–3×), keyboard arrow nudging, reset framing. Pure math lives in `cropMath.ts` (`coverScale`, `clampPan`, `sourceCropRect`) mapping the visible box back to source-pixel rect.
- `processPhoto.ts` orchestrates engine calls only: decode → crop rect → exact resize → `optimizeEncoding` → object URL + metadata + lightweight validation checks. No UI imports.
- `ResultStep`: metadata grid (dimensions/format/size), check list (✓/✗), download anchor with generated filename, "Start over" reset, no-acceptance-guarantee note (D004).

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 83 tests pass (22 new): crop-math edge cases (cover scale, pan clamping, zoom/pan matrix bounds, degenerate boxes), profile data integrity, requirement summary formatting, and PhotoView flow tests (intake → crop → result → reset, error surfacing, custom dimensions) with the processing pipeline mocked at module boundary
- `npm run build` — succeeds

## Known limitations

- Real browser crop/encode behavior (actual pixels through canvas) is not exercised by jsdom tests; requires manual/browser verification pass.
- Camera capture is intentionally absent (T005); paste-from-clipboard intake deferred.
- Example profiles are not authority-verified; official preset registry remains T008.
