# T007 — Technical Validation UI

Status: DONE

## Objective

Expose deterministic output checks and clear advisory guidance.

## Acceptance criteria

- [x] Dimensions are reported.
- [x] Aspect ratio is reported.
- [x] Format is reported.
- [x] File size is reported.
- [x] Passing and attention states are distinct.
- [x] No official-acceptance guarantee language is used.

## Implementation notes

- `src/domain/validation/engine.ts` implements the VALIDATION spec result shape exactly: `ValidationCheck { id, label, status: 'pass' | 'attention' | 'not-run', details? }` and `ValidationResult { status, checks }`.
- `validateOutput(requirements, facts, options)` deterministically reports all four categories (dimensions, aspect ratio, format, file size). Unconstrained categories are `not-run` with explanatory details rather than omitted.
- Aspect-ratio comparison uses a documented tolerance (`ASPECT_TOLERANCE = 0.02`) and small-integer ratio labels (e.g. `3:4`).
- Dimension modes: `exact` (photo semantics) and `within` (signature fit semantics, D015). Aspect check only applies in exact mode unless a ratio is explicitly required.
- File-size checks split into max/target and minimum entries; target bytes act as an upper bound.
- Both processors (`processPhoto`, `processSignature`) now delegate to the engine; their duplicated local check builders were removed.
- `ProcessedAsset` carries `validation: ValidationResult`; `ProcessedResult` renders a status banner ("Technical checks passed" / "Attention needed on some checks"), per-check states with distinct styling (green pass / amber attention / muted not-run), details text, and retains the no-guarantee disclaimer (D004).

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 119 tests pass (10 new): compliant output, dimension/aspect/format/size mismatches, tolerance boundary, ratio labeling, min/max/target handling, not-run behavior, within-mode checks, and a serialized-language test asserting no guarantee/approved/official wording
- `npm run build` — succeeds

## Known limitations

- Background and face checks from the spec remain future advisory work (T010); no heuristics are claimed here.
