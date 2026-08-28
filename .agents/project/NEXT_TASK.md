# Next Task

## Active task

None in progress — V4 complete (T026–T030) on `feat/v4-power-user` (2026-08-28), 334 tests.

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 complete: T021–T025 on `feat/v3-form-intelligence` → `main` **v0.3.0** (281 tests, tag `v0.3.0`, PR #1 merged 04ec8f0).
- V4 Power User & Institution on `feat/v4-power-user` (branched from `main` at 756f037) **COMPLETE**:
  T026 batch photo foundation **DONE** (D052, 295 tests) — multi-file auto center-crop → sequential `processPhoto` + ZIP.
  T027 configurable naming **DONE** (D053, 308 tests) — `{original}_{index}_{kind}_{preset}_{ext}`, sanitize + dedupe, batch/kit ZIPs.
  T028 CSV dataset **DONE** (D054, 319 tests) — local `parseCSV` + `matchDatasetToFiles` + `FileNaming` `{csv.xxx}` + `BatchView` dataset import.
  T029 batch signature/thumb **DONE** (D055, 324 tests) — `processBatch` generic dispatch, `BatchView` kind switch (`photo`/`signature`/`thumb`) with `DEFAULT_CUSTOM_BY_KIND` and dynamic UI.
  T030 document scan **DONE** (D056, 334 tests, 4+5 new) — `perspective.ts` affine two-triangle warp + `DocumentView` `#/document?preset=id` with 4-corner draggable handles, `clampQuad`, preset-aware, privacy-local, no deps.
  Branch is integration point for V4; all T026–T030 committed and verified (typecheck/lint/tests/build clean, no exam hardcoding, privacy-local).

## Backlog

1. Owner workflow — manually verified official presets (D003/D019): verify values against official portal/notification and add a real preset to `seedPresets.ts` per checklist. Agent must not guess.
2. Future work (ROADMAP Phase 4/5): PDF generation/compression, OCR where appropriate — scope as new tasks in `.agents/tasks/` and index in `TASK_INDEX.md`.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. V4 complete (T026–T030) — STATE.md, DECISIONS D052–D056, and this file updated; branch `feat/v4-power-user`; next is owner verification / v0.4.0 tag.
