# T017 — Physical size (mm/DPI) requirement inputs (V2)

**Status:** DONE (2026-08-22)

**Priority:** P2 (next V2 task after T016)
**Depends on:** `processing/geometry.ts#dimensionsFromPhysical` (already implemented and tested)

## Goal

Expose physical-size requirements in the photo flow UI: users can specify
width/height in millimeters (or cm) plus DPI, and the engine derives the pixel
target via the existing, tested `dimensionsFromPhysical` math (e.g. 35 × 45 mm
at 300 DPI → 413 × 531 px). This serves forms that state requirements in
physical units — common on government forms.

## Scope

1. Requirements panel: an "Advanced" disclosure with
   - unit select (mm | cm), physical width + height inputs,
   - DPI input (default 300).
   When filled, they override/augment manual px fields: derived pixels fill
   width/height automatically (editable afterwards), keeping one source of
   truth in `CustomSettings`.
2. `describeRequirements` gains no new tokens — the summary keeps showing the
   derived pixels; a note clarifies "35 × 45 mm at 300 DPI" when applicable.
3. Validation stays pixel-based (portals check pixels); no physical-DPI
   metadata is embedded in exports.

## Non-goals

- Embedding DPI metadata into exported files.
- Preset schema changes (schema already supports physicalSizeMm/dpi).

## Acceptance criteria

- [x] mm/cm + DPI inputs derive correct pixels (property-tested against `dimensionsFromPhysical`).
- [x] Derived values are editable; invalid input never blocks the flow.
- [x] Typecheck/lint/tests/build pass.

## Results

Implemented 2026-08-22 in the photo requirements panel under a collapsed
"Physical size (advanced)" disclosure:
- Unit (mm/cm) + physical width/height + DPI (default 300) inputs.
- A memo derives pixels through the existing `dimensionsFromPhysical` engine
  math and an effect fills the editable Width/Height fields; invalid or
  partial input leaves everything untouched.
- The derived-values note states exactly how the pixels were computed
  ("Derived 413 × 531 px from 35 × 45 mm at 300 DPI").
- Preset autofills clear the physical fields; validation remains pixel-based;
  no DPI metadata is embedded in exports. 228/228 tests pass.
