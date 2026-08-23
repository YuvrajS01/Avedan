# T016 — Preset fidelity: PNG size optimization and signature preset wiring (V2)

**Status:** DONE (2026-08-22)

**Priority:** P1 (next V2 task after T015)
**Depends on:** T003 optimizer, T006 signature flow, MVP audit findings I1/I2

## Goal

Close the two IMPORTANT findings from the MVP release audit:

1. **I1 — `within`-mode outputs can shrink to fit.** When dimensions are not
   exact-mandatory (signature flow uses `within` validation), the optimizer
   should try progressively smaller scales (`allowedScales`) before giving up.
   This mainly fixes PNG signatures, where quality search is a no-op because
   PNG encoding ignores the quality parameter.
2. **I2 — Signature flow is not wired to Forms presets.**
   `requirementsFromPreset(preset, 'signature')` exists but the signature page
   never receives a preset from Forms.

## Scope

- `processSignature`: pass `allowedScales` (e.g. `[1, 0.9, 0.8, 0.7, 0.6]`)
  whenever the profile has no exact-dimension mandate; keep scale 1 preferred
  (optimizer already returns the first successful scale).
- Forms → signature: navigate with `{ presetId }`; SignatureView reads
  `useHashRoute().presetId`, resolves via `requirementsFromPreset(preset,
  'signature')`, shows the preset context panel (authority/source/verified),
  autofills manual fields, and supports "Use generic settings instead".
  Manual edits must take precedence (D035 pattern).
- Validation stays honest: dimension checks continue in `within` mode, so
  scaled-down results still pass when allowed.

## Non-goals

- Min-size padding tricks (architecture forbids artificial inflation).
- Photo-flow scaling (exact dimensions are mandatory there).

## Acceptance criteria

- [x] Optimizer tests cover multi-scale fallback for an unsatisfiable max size.
- [x] Signature honors a Forms preset end-to-end (summary, context panel, edit precedence).
- [x] Exact-dimension flows never scale (regression test — photo flow untouched, no `allowedScales`).
- [x] Typecheck/lint/tests/build pass.

## Results

Implemented 2026-08-22:
- **I1 closed:** `processSignature` passes `allowedScales = [1 … 0.5]` whenever a
  file-size constraint exists (signature semantics are "fit within"); reported
  width/height now reflect the optimizer's actual encoded scale. Optimizer
  gained three multi-scale tests including a too-large-after-all-scales case.
  Photo flow unchanged — exact dimensions are mandatory there.
- **I2 closed:** Forms cards expose "Prepare signature" → `#/signature?preset=…`;
  SignatureView resolves the preset via `requirementsFromPreset(preset,
  'signature')`, shows the context panel (name/authority/last-verified/source
  link + "Use generic settings instead"), autofills manual fields including
  min/max KB, and manual edits take precedence per D035.
- 225/225 tests pass; typecheck/lint/build clean.
