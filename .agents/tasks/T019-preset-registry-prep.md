# T019 — Verified-preset registry preparation (V2)

**Priority:** P1 (next V2 task after T018)
**Depends on:** preset registry (T008), physical-size inputs (T017), worker offload (T018)
**Architecture reference:** DECISIONS D003 (source metadata), D019 (illustrative until manually verified), D043 (physical size derives pixels).

## Goal

Prepare the preset registry so an **owner** can add manually verified official
presets with zero code changes beyond data entry — without shipping any
unverified values presented as official.

## Scope

1. **Complete schema → engine mapping:** `requirementsFromPreset` currently
   drops `background`, `physicalSizeMm`, and `dpi`. Map them into
   `ImageRequirements` (new optional `physicalSizeMm` + `dpi` fields).
   Validation stays pixel-based (D043); these fields are descriptive inputs.
2. **Preset autofill parity:** selecting a preset on the photo page prefills
   the physical-size fields (mm value, unit mm, DPI) and the white-background
   toggle from the preset, exactly like width/height/format/file-size already
   do. Manual-edit precedence (D035) is unchanged.
3. **Owner-ready seed module:** extract the seed presets into
   `src/domain/presets/seedPresets.ts` carrying a written verification
   checklist (official source URL, last-verified date, what to record) so
   adding a verified entry is pure data entry.

## Constraints

- No real official preset values may be added (D019 — owner workflow only).
- No UI changes beyond the existing requirements panel behaving correctly
  when a preset carries physical/background data.
- `describeRequirements` may surface `mm @ DPI`, but validation output must
  remain pixel-based.

## Acceptance criteria

- [x] `requirementsFromPreset` maps format, dimensions, aspect ratio, file
      size, background ('white' only), physicalSizeMm, and dpi; covered by
      tests.
- [x] Photo page prefills physical/background fields from a selected preset;
      manual edits still take precedence; covered by tests.
- [x] Seed presets live in their own documented module; registry load-time
      validation unchanged.
- [x] Typecheck/lint/tests/build pass.

## Outcome (2026-08-22)

Implemented as D045. `ImageRequirements` gained optional descriptive
`physicalSizeMm`/`dpi`; `requirementsFromPreset` now maps background
('white' only), physical size, and DPI. The photo page prefills the
physical-size fields, DPI, and white-background toggle from both hash-route
presets and the "Load preset" dropdown, with manual-edit precedence
unchanged (D035); `describeRequirements` surfaces `mm @ DPI` descriptively.
Seed data moved to `src/domain/presets/seedPresets.ts` with an owner
verification checklist; one new illustrative template exercises the
white-background flag end-to-end. 244 tests passing; typecheck, lint, and
build pass.
