# T023 — V3 Requirement validation (preset-aware)

**Status:** DONE (2026-08-26)
**Priority:** P1
**Depends on:** T021 (preset engine)
**Architecture references:** VALIDATION spec, DECISIONS D004/D017 (no guarantee, spec-shaped result), D035 (manual precedence)

## Goal

Make validation explicitly preset-aware: given a selected preset, validate each asset's output against that preset's technical constraints and present a clear, non-misleading result.

## Scope

1. **Preset completeness check:** for a preset, list required asset kinds (photo, signature, thumbImpression where present) and whether each has been prepared in this session (session-local, no persistence).
2. **Per-asset validation reuse:** delegate to existing `validateOutput` (spec shape `pass`/`attention`/`not-run`) with correct `dimensionMode` (`exact` for photos, `within` for signature/thumb — D015/D042). Do not claim acceptance.
3. **UI presentation:** surface checks as "Technical checks passed / Attention needed" per asset, with the standard disclaimer ("Technical checks passed does not guarantee acceptance… Always confirm against the official source.").
4. **Data-driven:** derive everything from the preset object; no hardcoded exam thresholds.

## Non-goals

- Thumb pipeline itself (T022).
- Kit view aggregation/layout (T024).
- Batch/ZIP export.

## Acceptance criteria

- [x] Helper to summarize preset requirement coverage (which kinds required, which optional).
- [x] Preset-aware validation surfaced on photo/signature/thumb result screens when a preset is active (e.g. "Validating against {preset.name}").
- [x] No "officially approved" language.
- [x] Tests for preset coverage + validation wiring.
- [x] Typecheck/lint/tests/build pass.

## Outcome (2026-08-26)

Implemented on `feat/v3-form-intelligence`:
- `src/domain/presets/helpers.ts` — `requiredAssetKinds` (filters `PRESET_ASSET_KINDS` data-driven), `assetLabel`, `dimensionModeForKind` (`photo→exact`, others→`within` D015/D042), `presetKindsSummary`.
- `src/components/ProcessedResult.tsx` — added optional `preset?: FormPreset` prop; when present renders "Validated against {name} · {authority}" + lastVerified + Official source link + "always confirm" disclaimer above the meta list, reinforcing D004 no-guarantee rule.
- `src/features/photo/PhotoView.tsx`, `signature/SignatureView.tsx`, `thumb/ThumbView.tsx` — pass `activePreset` to `ProcessedResult` so result validation is explicitly preset-aware; manual precedence (D035) unchanged.
- Tests: `src/tests/presetHelpers.test.ts` (4) covers required kinds, labels/modes, summary, seed registry data-driven; `src/tests/ProcessedResult.test.tsx` (2) covers banner absent/present with link. 263 tests passing; typecheck/lint/build clean.

## Verification

- `npm run typecheck` clean, `npm run lint` clean, `npm test` 263/263, `npm run build` clean (no bundle regression beyond helpers).
