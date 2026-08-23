# T018 — Worker offload of the encode/optimize loop (V2)

**Priority:** P2 (next V2 task after T017)
**Depends on:** processing engine (T002/T003), build setup
**Architecture reference:** "Heavy processing should run off the main thread when practical" (`TECHNICAL_ARCHITECTURE.md`); MVP audit MINOR M4.

## Goal

Move the encode → measure → optimize loop off the main thread so large photos
never freeze the UI, without duplicating engine logic.

## Scope

1. A thin worker wrapper (`src/workers/`): the worker receives an
   `ImageBitmap`/blob plus serialized requirements, runs crop/resize/optimize
   using the same `processing/*` modules (they are framework-independent by
   design), and returns the encoded bytes + metadata.
2. Photo and signature flows call the worker when available and fall back to
   the existing in-thread path when workers are unavailable (older browsers,
   test environment).
3. No UI changes beyond possibly a "Processing…" state that already exists.

## Constraints

- The processing modules must remain usable both in-thread and in-worker —
  no DOM-only APIs introduced into `src/processing/`.
- Blobs transfer via structured clone; avoid base64 detours.
- Keep the fallback path exercised by tests so behavior parity is provable.

## Acceptance criteria

- [ ] Worker module unit-tested (message protocol + result shape) with a fake worker.
- [ ] Flows use the worker only when supported; fallback verified by tests.
- [ ] No regression in output bytes/metadata versus the in-thread path.
- [ ] Typecheck/lint/tests/build pass.
