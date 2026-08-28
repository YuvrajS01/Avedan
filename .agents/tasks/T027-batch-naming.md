# T027 — V4 Configurable file naming for batch/kit exports

**Status:** DONE (2026-08-28)
**Priority:** P1
**Depends on:** T026 (batch foundation), T025 (kit ZIP)
**Architecture references:** D002 (requirements as data), PRIVACY

## Problem

Institutions need predictable filenames that match applicant identifiers (roll number, registration ID, email prefix). The current `-avedan.{ext}` suffix derived from original names is not configurable, forcing manual renaming after ZIP download.

## Goal

Add a tiny, data-driven naming template that never requires a backend: user types a pattern like `{name}_{index}` or `{original}_{kind}` and the batch/kit export applies it deterministically before writing the ZIP. Keep the default (`{original}-avedan`) unchanged for simple use.

## Scope

1. **Template syntax (minimal):** `{original}` (basename without ext), `{index}` (1-based), `{kind}` (photo/signature/thumb), `{preset}` (preset id or “manual”), `{ext}` — all optional, no code execution, no `eval`.
2. **UI:** small “File naming” disclosure above Batch/KIT ZIP buttons (input with placeholder `{original}-avedan`, live preview: `e.g. rahul_photo_1.jpg`), stored in `localStorage` per preset id, clearable.
3. **Engine:** pure function `renderFileName(template: string, context): string` (sanitizes illegal filesystem chars, dedupes collisions by appending `-2` etc.), unit-tested; batch processor calls it before `createZipBlob`, kit store can reuse.
4. **Validation:** sanitize, fallback to default on empty/invalid template, never include absolute paths.

## Non-goals

- CSV-driven naming (T028 covers dataset import)
- Per-file manual rename queue

## Acceptance criteria

- [x] Template renders deterministically for batch/kit ZIP entries; collisions handled.
- [x] UI preview updates live; persists per preset; default preserved.
- [x] Tests for sanitization, collision dedupe, edge cases (empty, illegal chars, missing tokens).
- [x] Typecheck/lint/tests/build pass; no new deps.

## Outcome (2026-08-28)

Implemented on `feat/v4-power-user`:
- `src/domain/naming/fileNaming.ts` — `sanitizeFileNamePart`, `renderFileName` (tokens `{original}` `{index}` `{kind}` `{preset}` `{ext}`, fallback to `{original}-avedan`, appends ext if missing, sanitizes illegal `<>:"/\\|?*` + control chars, preserves single dot), `dedupeFileNames` (case-insensitive `-2`/`-3`), `getNamingTemplate`/`setNamingTemplate` per preset via `localStorage` (`avedan-naming:${presetId}`), `NAMING_TEMPLATE_DEFAULT`.
- `src/components/FileNamingField.tsx` — disclosure `File naming` with input (`aria-label` File naming template, placeholder default), live preview `rahul_1.jpg` etc., tokens help, persists per preset via `onChange`.
- `src/features/batch/BatchView.tsx` — added `namingTemplate` state (from `getNamingTemplate` + `presetId` effect), `FileNamingField` in ZIP card, `handleDownloadZip` now renders names via `renderFileName` with context `{original: file.name base, index, kind: photo, preset, ext}` + `dedupeFileNames` before `createZipBlob` (filenames no longer hard-coded `asset.fileName`).
- `src/features/kit/KitView.tsx` — same `namingTemplate` state + `FileNamingField` in ZIP card, `handleDownloadKit` and `onDownloadSingle` now render via `renderFileName` (original stripped of `-avedan` and ext, kind, preset, ext) + `dedupeFileNames`, per-asset downloads also templated.
- Tests: `src/tests/fileNaming.test.ts` (13) sanitize, default, token replacement, ext handling, sanitize, dedupe collisions, storage per preset; existing Batch/Kit ZIP tests still pass (default template preserves `original-avedan`).

## Verification

- `typecheck` clean, `lint` clean, `test` 308/308 (13 new), `build` clean (77 modules, no new deps). Manual: batch 3 files with `{original}_{index}` → ZIP `a_1.jpg` etc.; kit ZIP respects `{kind}_{index}`.
