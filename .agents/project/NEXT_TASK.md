# Next Task

## Active task

None in progress — T021 complete on `feat/v3-form-intelligence` (2026-08-26).
Next agent should start **T022 — V3 thumb impression preparation flow**.

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 Form Intelligence started 2026-08-26 on branch `feat/v3-form-intelligence`:
  T021 preset engine & data model **DONE** — schema now `photo|signature|thumbImpression` (D047), `FormsView` data-driven over `PRESET_ASSET_KINDS`, one illustrative thumb-kit preset (`example-thumb-kit`). 250 tests passing; typecheck/lint/build clean. No exam rules hardcoded; disclaimer + freshness + source link preserved. Branch is the integration point for V3.

## Backlog (V3 incremental — TASK_INDEX)

1. **T022 — V3 thumb impression preparation flow** (P1, depends on T021) — **next**. Dedicated thumb pipeline reusing trim/fit-within/optimizer/validation; route `#/thumb?preset=id`; data-driven Forms wiring. See `.agents/tasks/T022-v3-thumb-impression-flow.md`.
2. T023 — V3 requirement validation (preset-aware) (P1, depends on T021)
3. T024 — V3 Application Kit view (P1, depends on T021,T022,T023)
4. T025 — V3 kit export (ZIP / batch guidance) (P2, depends on T024)
5. Owner workflow — manually verified official presets (D003/D019): human verification against official sources into `seedPresets.ts`. V3 keeps illustrative presets labelled; never claim authority without a current official source.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. T021 updated STATE.md, DECISIONS D047, and this file.
