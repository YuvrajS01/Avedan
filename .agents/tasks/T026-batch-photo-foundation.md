# T026 — V4 Batch photo processing foundation (Power User)

**Status:** DONE (2026-08-28)
**Priority:** P0 — first V4 task
**Depends on:** V3 complete (T025), photo flow (T004), worker offload (T018), ZIP helper (T025)
**Architecture references:** D001 (client-side), D002 (requirements as data), D005 (engine separate from UI), D006 (optimize to constraints), D044/D046 (worker + watchdog), D051 (STORE ZIP), PRIVACY, PRD secondary users (coaching institutes, placement cells)

## Problem

Secondary users (coaching institutes, colleges, placement cells, recruitment agencies — PRD §3) routinely prepare the *same* form photo for 20–100 applicants. The current single-file Photo flow forces one-by-one upload → manual crop → download, which is slow and error-prone. Institutions need a predictable, local, batch mode that reuses the existing photo pipeline without turning Avedan into a generic document-management system.

## Goal

Provide the smallest useful batch facility: drop **multiple** photo files, pick one set of requirements (manual or preset, data-driven), process them **sequentially** with an **auto center-crop** to the target aspect ratio (no per-file manual crop in this task), show per-file progress + validation, allow per-file download + **ZIP of all successful outputs** (reuse `utils/zip` STORE). Keep everything client-side, bounded memory, excellent UX.

## Existing architecture

- Photo pipeline: `decodeImage → cropToCanvas(cropRect) → resizeToCanvas(dimensions) → (optional whitenBackground) → optimizeEncoding → validateOutput → Export Blob` via `computePhotoOutput` (shared main/worker, T018). Crop is currently manual via `CropStep` → `sourceCropRect` → `computePhotoOutput(cropRect)`.
- `computeCropRect(sourceW, sourceH, aspectRatio)` (geometry) already implements largest centered rectangle of requested ratio — exactly the auto-crop needed for batch.
- Worker client `processWithOptionalWorker` with 15 s watchdog already guarantees fallback and bounded UI freeze.
- Batch has no UI yet; kit store (`domain/kit/store.ts`) is single-preset single-asset, not a queue.

## Scope

### 1. New route `#/batch` + Nav entry
- Add `batch` to `ROUTES`, `App.tsx` views, `NavBar` (icon: stacked photos), hash `?preset=id` support via `findFormPreset` → `requirementsFromPreset` (same D035 manual-precedence pattern as Photo/Signature/Thumb).

### 2. Requirements panel (reuse Photo)
- Manual Width/Height/Min/Max/Format + Load preset dropdown (photo profiles) + Physical size advanced + White BG toggle — same logic as `PhotoView` (prefill from preset, manual edits win). Data-driven, no hardcoding. Shows `describeRequirements` target summary.

### 3. Multi-file intake
- File input `multiple` + drag-and-drop zone, accepts `image/jpeg,image/png,image/webp`, rejects others with user-actionable `ProcessingError`.
- Stores `File[]` queue in state; displays count; allows Clear.

### 4. Batch processor (`features/batch/batchProcess.ts`)
- For each file sequentially (not parallel — bounds memory/CPU):
  1. `decodeImage(file)` → `source`
  2. Compute auto `cropRect = computeCropRect(source.width, source.height, profile.aspectRatio ?? source.width/source.height)` — center crop, no focus point.
  3. `computePhotoOutput({source, cropRect, profile, fileName})` → `ProcessedAsset` data (via worker when supported, same watchdog fallback).
  4. Capture `ProcessedAsset` (with validation) or `ProcessingError` per file.
  5. Revoke transient object URLs, release `ImageBitmap` references promptly (PERFORMANCE strategy).
- Returns array of per-file results with `status: 'done'|'error'`, `asset?`, `error?`, `validation`.
- No IndexedDB persistence; session-local only.

### 5. Progress & results UI
- Before processing: file list with names + sizes.
- During: `Processing 3/20 — filename` + spinner, per-file `busy` flag.
- After per-file: row shows thumbnail (object URL from `asset.blob` or `asset.url`), dimensions, format, file size, validation badge (`pass`/`attention`), download link (`-avedan` filename already from pipeline), error alert if any.
- Summary banner: `X of Y passed / Y processed`.
- Per-file “Download” already; plus “Download all as ZIP” (see below).

### 6. ZIP export (reuse)
- Reuse `createZipBlob` + `blobToUint8Array` (T025) with `STORE`.
- Button “Download all as ZIP” enabled when ≥1 success; collects successful `asset.blob` + `asset.fileName`, builds ZIP, creates object URL, triggers download, shows Re-download link, revokes on replace/unmount. Fallback remains per-file downloads if ZIP unavailable. Privacy: no upload, URLs revoked.

### 7. Trust & privacy
- Privacy note: “Your images stay on this device — nothing is uploaded. Batch runs entirely in your browser.” Visible in intake and results.
- No analytics of image bytes (PRIVACY spec).

## Non-goals (deferred)

- Per-file manual crop adjustment (future T0xx — would require a per-file CropStep queue, deferred to keep T026 small)
- Batch signature/thumb (T029 — reuse batch foundation after photo batch proves the queue)
- Configurable file naming templates (T027 — currently filenames are `original-avedan.{ext}` deterministically from `computePhotoOutput`)
- CSV/dataset import (T028)
- Parallel processing (sequential is simpler, bounds memory; revisit only if profiling shows need)

## Acceptance criteria

- [x] Route `#/batch` and `#/batch?preset=id` work; Nav “Batch” visible; Forms preset can open batch with preset prefilled.
- [x] Multi-file intake (picker + drag-drop) queues files, shows count, allows Clear, rejects unsupported types with actionable error.
- [x] Batch processes sequentially with auto center-crop → `computePhotoOutput` → validation; per-file status, thumbnail, validation badge, per-file download; sequential (not parallel) verified by test (no concurrent worker calls).
- [x] `DescribeRequirements` target summary reflects preset/manual with manual-precedence; `physicalSize`/`background` flow end-to-end (reuse T019 mapping) is preserved.
- [x] “Download all as ZIP” builds ZIP of successful assets via `createZipBlob` (STORE) with correct filenames/extensions, triggers download, shows Re-download, revokes URLs; enabled only when ≥1 success.
- [x] Privacy note visible; no network calls; memory bounded (no concurrent high-res copies, URLs revoked on Clear/unmount).
- [x] Tests for batch processor (auto crop, sequential, validation, error handling) + BatchView (intake → process → per-file results → ZIP) + routes/Nav; `typecheck`/`lint`/`test`/`build` pass.

## Verification

- `npm run typecheck` clean, `lint` clean, `test` 295/295 (5 batchProcess + 7 BatchView new), `build` clean (77 modules, 295 KB JS, 87.3 KB gz, worker 13.95 KB, no new deps).
- Manual: drop 5 photos (mix JPEG/PNG), pick preset `example-exam-413x531`, Process — verify each result shows correct dimensions/format/size within preset, thumbnails, downloads, ZIP contains 5 files with `-avedan` names, all on-device.

## Outcome (2026-08-28)

Implemented on `feat/v4-power-user`:
- `src/features/batch/batchProcess.ts` — `processSinglePhoto` (decode → `computeCropRect` center crop → `processPhoto`) + `processBatchPhotos` sequential loop with per-file `BatchItem` (`queued`→`processing`→`done`|`error`), `onProgress` callback, error capture, no parallel workers, session-local.
- `src/features/batch/BatchView.tsx` — `#/batch` + `?preset=id` (findFormPreset→requirementsFromPreset, manual precedence), requirements panel (Width/Height/Min/Max/Format + Load preset + Physical advanced + White BG, same as Photo), multi-file intake (`multiple`, drag-drop, filter `image/jpeg|png|webp`, count, Clear), sequential Process via `processBatchPhotos`, per-file rows (thumbnail via `asset.url`, dimensions/format/size, validation badge `Passed`/`Needs attention`, `attention` details, Download link, error), summary banner `X of Y passed`, Download all ZIP (collect successful `asset.blob`→`blobToUint8Array`→`createZipBlob` STORE → object URL → download + Re-download, busy/error, enabled only when ≥1 success), privacy notes, URL revocation on Clear/unmount.
- `src/app/routes.ts` + `App.tsx` + `components/NavBar.tsx` — added `batch` route, BatchView, stacked-photos icon, hash `?preset=id`.
- `src/features/forms/FormsView.tsx` — added `Batch photos` button per photo preset (data-driven) navigating to `batch?preset=id`.
- Tests: `batchProcess.test.ts` (5) auto crop, full-image fallback, sequential, error capture, onProgress; `BatchView.test.tsx` (7) intake, queue, preset context, sequential results + ZIP, error handling, ZIP re-download, Clear; `App.test` + `routes.test` + `FormsView.test` updated for Batch. 295 tests passing; typecheck/lint/build clean. No exam hardcoding; all requirements data-driven.

## Handoff

- `DECISIONS.md` D052, `STATE.md`, `NEXT_TASK.md`, `TASK_INDEX.md` updated. Next is T027 configurable naming (P1) — tiny template `{original}_{index}_{kind}` that keeps default `{original}-avedan` unchanged.
