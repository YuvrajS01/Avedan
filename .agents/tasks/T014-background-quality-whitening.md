# T014 — Background quality detection and white-background processing (V2)

**Priority:** P1 (next V2 task after T013)
**Depends on:** processing engine, validation engine, PRIVACY spec
**V2 objectives covered:** background quality detection (8), white-background processing (9).

## Goal

1. **Advisory background check:** detect whether the photo background is
   reasonably plain/uniform (edge density + color variance in border regions)
   and surface an advisory hint — never part of the pass/fail validation
   (VALIDATION spec: advisory unless objectively measurable).
2. **White-background mode (opt-in per job):** when a requirement or user
   choice asks for a white background, lighten/normalize near-uniform
   backgrounds toward white while preserving the subject. Deterministic pixel
   heuristics only in this task — no ML segmentation (that stays V3/V4).

## Constraints

- Framework-independent implementation under `src/processing/background.ts`
  with injectable canvas factory; UI wiring kept thin.
- Advisory hints follow D034/D038 patterns; never block download.
- White-background output must not fabricate compliance: if the result is
  imperfect, say so in the hint copy.
- All processing local; no models, no new dependencies.

## Scope

- `processing/background.ts`: border-region uniformity metrics;
  `whitenBackground(source, tolerance)` flood-fill-from-edges style lightening.
- Wire into the photo flow as an optional toggle shown only when relevant
  (e.g. "White background" checkbox), with an advisory hint on the result.
- Unit tests for both metric and whitening behavior on synthetic images.

## Non-goals

- ML-based matting/segmentation; hair-edge perfection claims.
- Signature flow changes.

## Acceptance criteria

- [ ] Uniformity metric tested on synthetic plain/noisy/border-heavy images.
- [ ] Whitening preserves dark subject pixels; tolerance documented and configurable.
- [ ] Advisory hint renders on the result screen; never affects validation status.
- [ ] Toggle is opt-in and off by default; typecheck/lint/tests/build pass.
