# Next Task

## Active task

**T029 — V4 batch signature / thumb impression extension** next on `feat/v4-power-user` (2026-08-28). T026–T028 complete (319 tests).

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 complete: T021–T025 on `feat/v3-form-intelligence` → `main` **v0.3.0** (281 tests, tag `v0.3.0`, PR #1 merged 04ec8f0).
- V4 Power User & Institution on `feat/v4-power-user` (branched from `main` at 756f037):
  T026 batch photo foundation **DONE** (D052, 295 tests) — multi-file auto center-crop → sequential `processPhoto` + ZIP.
  T027 configurable naming **DONE** (D053, 308 tests) — `{original}_{index}_{kind}_{preset}_{ext}`, sanitize + dedupe, batch/kit ZIPs.
  T028 CSV dataset **DONE** (D054, 319 tests, 8 new) — local `parseCSV` + `matchDatasetToFiles` + `FileNaming` `{csv.xxx}` + `BatchView` dataset import (preview, matched `X of Y` + ZIP `csv` naming), privacy-local, no upload.
  T029 batch signature/thumb **NEXT** (P2) — reuse batch foundation with kind switch, `within` + trim, `THUMB/SIGNATURE_PROFILES`.
  T030 document scan deferred (P2) queued incrementally.

## Backlog (V4 incremental)

1. **T029 — V4 batch signature / thumb extension** (P2, depends on T026) — **next**, kind switch Photo/Signature/Thumb, per-kind processor, validation, ZIP kind-aware.
2. T030 — V4 document scan / perspective correction (deferred) (P2, depends on T026)
3. Owner workflow — manually verified official presets (D003/D019): still pure data entry into `seedPresets.ts`; V3+ keeps illustrative presets labelled.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. V4 T028 complete — STATE.md, DECISIONS D054, and this file updated; branch `feat/v4-power-user`; next is T029.
