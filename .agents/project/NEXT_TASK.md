# Next Task

## Active task

None in progress — V3 complete (T021–T025) on `feat/v3-form-intelligence` (2026-08-26), 281 tests.

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 Form Intelligence on branch `feat/v3-form-intelligence` **COMPLETE**:
  T021 engine **DONE** (D047) — schema photo|signature|thumbImpression, data-driven Forms, thumb-kit example (250 tests).
  T022 thumb flow **DONE** (D048) — `#/thumb` + ThumbView + worker `thumb`, THUMB_PROFILES, Nav + Forms buttons (257 tests).
  T023 validation **DONE** (D049) — `helpers.ts` + preset-aware `ProcessedResult` banner, 263 tests.
  T024 kit view **DONE** (D050) — `#/kit?preset=id` KitView (metadata + required assets data-driven + Prepare CTAs), Forms View kit button, Nav Kit, 269 tests.
  T025 kit export **DONE** (D051) — minimal STORE ZIP (`src/utils/zip.ts`, ~2 KB, no deps) + session-local kit store, per-asset + ZIP downloads in KitView, fallback to individual downloads, 281 tests.
  Branch is the integration point for V3; all T021–T025 committed and verified (typecheck/lint/tests/build clean, no exam hardcoding, disclaimer + source + freshness preserved).

## Backlog

1. Owner workflow — manually verified official presets (D003/D019): verify values against official portal/notification and add a real preset to `seedPresets.ts` per checklist (replace/extend the illustrative `example-thumb-kit` after checking current official source). Agent must not guess.
2. Future work (ROADMAP): batch CSV/institution mode, document/PDF utilities — scope as new tasks in `.agents/tasks/` and index in `TASK_INDEX.md`.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. V3 complete (T021–T025) updated STATE.md, DECISIONS D047–D051, and this file. Next is owner verification / v0.3.0 tag.
