# Next Task

## Active task

**T030 — V4 document scan / perspective correction (deferred)** next on `feat/v4-power-user` (2026-08-28). T026–T029 complete (324 tests).

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 complete: T021–T025 on `feat/v3-form-intelligence` → `main` **v0.3.0** (281 tests, tag `v0.3.0`, PR #1 merged 04ec8f0).
- V4 Power User & Institution on `feat/v4-power-user` (branched from `main` at 756f037):
  T026 batch photo foundation **DONE** (D052, 295 tests) — multi-file auto center-crop → sequential `processPhoto` + ZIP.
  T027 configurable naming **DONE** (D053, 308 tests) — `{original}_{index}_{kind}_{preset}_{ext}`, sanitize + dedupe, batch/kit ZIPs.
  T028 CSV dataset **DONE** (D054, 319 tests) — local `parseCSV` + `matchDatasetToFiles` + `FileNaming` `{csv.xxx}` + `BatchView` dataset import.
  T029 batch signature/thumb **DONE** (D055, 324 tests, 4 new) — `processBatch` generic dispatch, `BatchView` kind switch (`photo`/`signature`/`thumb`) with `DEFAULT_CUSTOM_BY_KIND`, `presetKind`, kind-aware `profile`/`handlePresetSelect`/`handleProcess`/`handleDownloadZip`, dynamic headings/lede/drop-zone/process button/ZIP/privacy.
  T030 document scan **NEXT** (P2, deferred) — edge detection (no model), 4-corner manual fallback, perspective transform via canvas, reuses `ImageRequirements`, same validation/ZIP.

## Backlog (V4 incremental)

1. **T030 — V4 document scan / perspective correction (deferred)** (P2, depends on T026) — **next**, deterministic, no new deps, before/after + reset, never auto-crops without confirmation.
2. Owner workflow — manually verified official presets (D003/D019): still pure data entry into `seedPresets.ts`; V3+ keeps illustrative presets labelled.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. V4 T029 complete — STATE.md, DECISIONS D055, and this file updated; branch `feat/v4-power-user`; next is T030.
