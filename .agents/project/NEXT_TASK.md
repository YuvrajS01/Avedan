# Next Task

## Active task

None in progress — T021–T023 complete on `feat/v3-form-intelligence` (2026-08-26).
Next agent should start **T024 — V3 Application Kit view**.

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 Form Intelligence on branch `feat/v3-form-intelligence`:
  T021 engine **DONE** (D047) — schema photo|signature|thumbImpression, data-driven Forms, thumb-kit example (250 tests).
  T022 thumb flow **DONE** (D048) — `#/thumb` + ThumbView + worker `thumb`, THUMB_PROFILES, Nav + Forms buttons (257 tests).
  T023 validation **DONE** (D049) — `helpers.ts` + preset-aware `ProcessedResult` banner (Validated against…), 263 tests.
  Branch is the integration point for V3; T021–T023 committed.

## Backlog (V3 incremental — TASK_INDEX)

1. **T024 — V3 Application Kit view** (P1, depends on T021,T022,T023) — **next**. `#/kit?preset=id` aggregating photo/signature/thumbImpression per `requiredAssetKinds`, with verification metadata, source link, freshness badge, disclaimer, per-asset `describeRequirements` + Prepare CTAs. Data-driven, session-local.
2. T025 — V3 kit export (ZIP / batch guidance) (P2, depends on T024)
3. Owner workflow — manually verified official presets (D003/D019): human verification against official sources into `seedPresets.ts`. V3 keeps illustrative presets labelled; never claim authority without a current official source.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. T023 updated STATE.md, DECISIONS D049, and this file.
