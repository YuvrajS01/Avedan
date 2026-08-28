# T027 — V4 Configurable file naming for batch/kit exports

**Status:** PLANNED
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

- [ ] Template renders deterministically for batch/kit ZIP entries; collisions handled.
- [ ] UI preview updates live; persists per preset; default preserved.
- [ ] Tests for sanitization, collision dedupe, edge cases (empty, illegal chars, missing tokens).
- [ ] Typecheck/lint/tests/build pass; no new deps.

## Verification

- Manual: batch 3 files with template `{original}_{index}` → ZIP contains `photo1_1.jpg`, `photo2_2.jpg`, etc.; kit ZIP respects same template.
