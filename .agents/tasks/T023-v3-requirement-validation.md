# T023 — V3 Requirement validation (preset-aware)

**Status:** PLANNED
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

- [ ] Helper to summarize preset requirement coverage (which kinds required, which optional).
- [ ] Preset-aware validation surfaced on photo/signature/thumb result screens when a preset is active (e.g. "Validating against {preset.name}").
- [ ] No "officially approved" language.
- [ ] Tests for preset coverage + validation wiring.
- [ ] Typecheck/lint/tests/build pass.
