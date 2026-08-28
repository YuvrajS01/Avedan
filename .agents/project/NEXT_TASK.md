# Next Task

## Active task

**T027 — V4 configurable file naming** next on `feat/v4-power-user` (2026-08-28). T026 complete (295 tests).

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 plus T020 gate — tagged `v0.2.0` (245 tests).
- V3 complete: T021–T025 on `feat/v3-form-intelligence` → `main` **v0.3.0** (281 tests, tag `v0.3.0`, PR #1 merged 04ec8f0).
- V4 Power User & Institution on `feat/v4-power-user` (branched from `main` at 756f037):
  T026 batch photo foundation **DONE** (D052, 295 tests, 77 modules) — multi-file auto center-crop `computeCropRect` → sequential `processPhoto` (worker+watchdog) + per-file validation + ZIP via `createZipBlob` STORE, privacy-local, bounded memory, no new deps, Forms Batch photos button, Nav Batch.
  T027 configurable naming **NEXT** (P1) — tiny template, sanitization + collision dedupe, batch/kit ZIPs.
  T028 CSV dataset (P1), T029 batch signature/thumb (P2), T030 document scan deferred (P2) queued incrementally.

## Backlog (V4 incremental)

1. **T027 — V4 configurable file naming** (P1, depends on T026) — **next**, template `{original}_{index}_{kind}_{preset}_{ext}`, no eval, sanitize + dedupe, UI preview + per-preset localStorage.
2. T028 — V4 institution dataset import (CSV) (P1, depends on T026)
3. T029 — V4 batch signature / thumb extension (P2, depends on T026)
4. T030 — V4 document scan / perspective correction (deferred) (P2, depends on T026)
5. Owner workflow — manually verified official presets (D003/D019): still pure data entry into `seedPresets.ts`; V3+ keeps illustrative presets labelled.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started. V4 T026 complete — STATE.md, DECISIONS D052, and this file updated; branch `feat/v4-power-user`; next is T027.
