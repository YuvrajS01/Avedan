# T029 — V4 Batch signature / thumb impression extension

**Status:** PLANNED
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

- [ ] Batch kind switch changes the requirements panel, processor, and validation mode correctly.
- [ ] 5 mixed signature images → batch signature → each validated `within` 300×100, downloadable, ZIP correct.
- [ ] Same for thumb (240×240).
- [ ] Tests for kind switch + per-kind processor + ZIP.

## Verification

- Manual: batch 5 signatures with `example-thumb-kit` signature preset (10–20 KB) → each fits within 300×100, ZIP contains 5 `*-avedan.jpg`.
