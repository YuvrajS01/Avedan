# T028 — V4 Institution dataset import (CSV)

**Status:** DONE (2026-08-28)
**Priority:** P1
**Depends on:** T026 (batch foundation), T027 (naming)
**Architecture references:** PRIVACY (no upload, local CSV parse), D002 (requirements as data), PRD secondary users

## Problem

An institute with 100 applicants currently drags 100 files and manually renames ZIP entries. They already have a spreadsheet (roll number, name, email, photo file name). Without a dataset import, batch remains a file-list without applicant context.

## Goal

Let a power user import a **local CSV** (parsed entirely in the browser, no upload) that maps applicant identifiers to photo/signature/thumb file names. The batch queue then shows per-applicant rows with identifier + validation status, and ZIP naming can use `{id}`/`{name}` tokens from the dataset.

## Scope

1. **CSV intake:** file picker for `.csv`, local parse via a tiny csv parser (no new dep if <5 KB, otherwise evaluate), columns auto-detected: `id`/`roll`/`name` + `photo`/`signature`/`thumb` filename columns. Preview table (first 5 rows) before confirming.
2. **Matching:** drag-drop photo files are matched to CSV rows by filename (case-insensitive basename). Unmatched files/rows show `missing file` / `extra file` attention, never blocks.
3. **Naming:** extend T027 template to include `{csv.id}`, `{csv.name}` when dataset present.
4. **Privacy:** CSV never leaves device; parsed rows kept in memory, cleared on Reset; no IndexedDB persistence in this task.
5. **UX:** Batch view gains “Import dataset (CSV)” disclosure above file intake; shows matched count “32 of 35 applicants matched”.

## Non-goals

- Server-side institution workflows / multi-user
- Excel `.xlsx` parsing (CSV covers 90%; xlsx deferred)

## Acceptance criteria

- [x] CSV parsed locally, preview, matched vs unmatched clearly indicated.
- [x] Batch processing uses matched rows for per-file naming + validation grouping.
- [x] Tests for CSV parse, matching, missing/extra handling, privacy (no network).
- [x] Typecheck/lint/tests/build pass.

## Outcome (2026-08-28)

Implemented on `feat/v4-power-user`:
- `src/domain/dataset/csv.ts` — `parseCSV` (quoted commas, escaped `""`, trims, lowercases headers, skips empty lines, handles extra columns as `_extra_*`) + `matchDatasetToFiles` (normalizes basenames case-insensitive, matches by full filename or basename without ext, first-row-wins for duplicates, returns `matched`/`unmatchedFiles`/`unmatchedRows`).
- `src/domain/naming/fileNaming.ts` — extended `NamingContext.csv` + `renderFileName` now replaces `{csv.xxx}` (case-insensitive keys via `/\{csv\.([^}]+)\}/gi`, sanitized) for institution naming.
- `src/features/batch/BatchView.tsx` — added `dataset`/`datasetError` state + `datasetInputRef`, `datasetMatch` memo (`matchDatasetToFiles` when dataset+files present), `handleDatasetFile` (File.text with FileReader fallback, `parseCSV`, error handling, privacy note) + `handleClearDataset`, disclosure “Import dataset (CSV) — optional” with file input, preview table (headers + first 5 rows), matched count `X of Y files matched · Y unmatched files · Z unmatched rows`, per-file preview when dataset present; `handleDownloadZip` now uses `datasetMatch` to pass `csvRow` to `renderFileName` for `{csv.id}` etc., with `dedupeFileNames`.
- Tests: `src/tests/csv.test.ts` (8) parse, quoted, empty, matching, unmatched, basename fallback, duplicate handling; `src/tests/fileNaming.test.ts` extended with `csv` token test (case-insensitive, missing → `file` fallback); `src/tests/BatchView.test.tsx` extended with CSV import preview + matching tests (2). 319 tests passing; typecheck/lint/build clean (80 modules, 303 KB).

## Verification

- `typecheck` clean, `lint` clean (control regex disabled), `test` 319/319, `build` 80 modules. Manual: import `applicants.csv` (2 rows), drop 2 matching photos → preview + “2 of 2 files matched”, ZIP with `{csv.id}_{original}` yields `1_rahul.jpg` etc., all local.
