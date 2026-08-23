# T017 — Physical size (mm/DPI) requirement inputs (V2)

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

- [ ] mm/cm + DPI inputs derive correct pixels (property-tested against `dimensionsFromPhysical`).
- [ ] Derived values are editable; invalid input never blocks the flow.
- [ ] Typecheck/lint/tests/build pass.
