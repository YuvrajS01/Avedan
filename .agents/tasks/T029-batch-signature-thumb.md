# T029 — V4 Batch signature / thumb impression extension

**Status:** DONE (2026-08-28)
**Priority:** P2
**Depends on:** T026 (batch photo foundation), T022 (thumb flow), D015/D042 (within)
**Architecture references:** D005 (engine separate), `processSignature`/`processThumb` (trim→fit-within→optimize)

## Problem

After batch photos, institutions also need to prepare signatures and thumb impressions in bulk for the same applicants — same bottleneck, different pipeline (`within` dimensions, whitespace trim).

## Goal

Reuse the batch foundation to offer **batch signature** and **batch thumb** modes: same multi-file intake + sequential queue, but each file goes through `processSignature`/`processThumb` (trim, fit-within, within validation) instead of `processPhoto`. Keep UX parallel to photo batch, with per-file validation and ZIP.

## Scope

1. **Batch kind selector:** Batch view tabs or dropdown: Photo / Signature / Thumb (default Photo), each reuses the same requirements panel but with kind-specific `THUMB_PROFILES`/`SIGNATURE_PROFILES` and `dimensionMode`.
2. **Processor switch:** queue dispatches to `computePhotoOutput` (with auto cropRect) vs `computeSignatureOutput` vs `computeThumbOutput` (no cropRect) based on selected kind.
3. **Per-file preview:** signature/thumb preview shows trimmed thumbnail (like `SignatureView` preview) vs photo thumbnail.
4. **ZIP:** same `createZipBlob` helper, filenames carry kind where naming template omits it.

## Non-goals

- Per-file manual crop for photo batch (still auto center-crop; manual crop queue remains future)
- Dataset CSV (already T028)

## Acceptance criteria

- [x] Batch kind switch changes the requirements panel, processor, and validation mode correctly.
- [x] 5 mixed signature images → batch signature → each validated `within` 300×100, downloadable, ZIP correct.
- [x] Same for thumb (240×240).
- [x] Tests for kind switch + per-kind processor + ZIP.

## Outcome (2026-08-28)

Implemented on `feat/v4-power-user`:
- `src/features/batch/batchProcess.ts` — added `processSingleSignature`/`processSingleThumb` (decode → `processSignature`/`processThumb` with `within` + `THUMB_ALLOWED_SCALES`), `BatchKind` type, `getProcessor` dispatch, `processBatch(files, kind, profile, onProgress)` generic sequential loop (per-file `BatchItem`, error capture, kind-aware error message), `processBatchPhotos` now delegates to `processBatch(..., 'photo')` for backward compat.
- `src/features/batch/BatchView.tsx` — added `batchKind` state (`photo` default) + `DEFAULT_CUSTOM_BY_KIND`, `presetKind` memo (`thumb`→`thumbImpression`), `presetProfile`/`profile` kind-aware (`profileFromCustom` now takes `kind` for default aspect 3/4 vs 3 vs 1), effect to reset `custom` to kind default when kind switches, `handlePresetSelect` switches `PHOTO/SIGNATURE/THUMB_PROFILES` via `findProfile`/`findSignatureProfile`/`findThumbProfile`, `handleProcess` now `processBatch(files, batchKind, profile)`, `handleDownloadZip` kind-aware (`kind: batchKind`, `kindPart` for ZIP name `${preset}-${kind}-${n}.zip`, csv row passed), requirements panel now has `Asset kind` select + dynamic Load preset options, heading/lede/drop-zone/file-list/process button/summary/ZIP/privacy note all dynamic via `kindLabel`/`kindSingular`, `FileNamingField` still per-preset.
- Tests: `batchProcess.test.ts` extended with `processBatch` photo/signature/thumb delegation (mocked `processSignature`/`processThumb`, 3 new), `BatchView.test.tsx` extended with kind switch tests (signature target 300×100, thumb 240×240, process with `signature` kind assertion, thumb target). 324 tests passing (5+3 new), 80 modules; typecheck/lint/build clean. No new deps, no exam hardcoding.

## Verification

- `typecheck` clean, `lint` clean, `test` 324/324, `build` 80 modules 305 KB. Manual: batch 5 signatures with `example-thumb-kit` signature preset (10–20 KB) → each fits within 300×100, ZIP contains 5 `*-avedan.jpg`; same for thumb 240×240.
