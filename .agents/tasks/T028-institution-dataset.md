# T028 — V4 Institution dataset import (CSV)

**Status:** PLANNED
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

- [ ] CSV parsed locally, preview, matched vs unmatched clearly indicated.
- [ ] Batch processing uses matched rows for per-file naming + validation grouping.
- [ ] Tests for CSV parse, matching, missing/extra handling, privacy (no network).
- [ ] Typecheck/lint/tests/build pass.

## Verification

- Manual: import `applicants.csv` (id,name,photo), drop 3 photos named per CSV, verify matched rows show ids and ZIP uses `{id}_photo.jpg`.
