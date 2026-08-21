# Next Task

## Active task

**T006 — Signature upload and drawing**

See `tasks/T006-signature-flow.md`.

## Goal

Build the signature flow on top of the shared primitives: upload intake, draw-signature canvas (pen size, clear, undo), automatic whitespace trimming, resize/compression via the optimizer, validation summary, and download.

## Required output

- Upload intake reusing the T004 intake pattern
- Drawing canvas with pen size, clear/reset, undo support (FR-08)
- Automatic whitespace trim before export (per PROCESSING_ENGINE signature order)
- Resize + file-size optimization via `optimizeEncoding`
- Validation summary and client-side download
- Mobile-first layout; drawing must work with touch input

## Handoff expectation

When complete, update this file to point at T007 and describe any deviations.
