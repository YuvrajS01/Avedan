# T020 — V2 manual verification pass (v0.2.0 gate)

**Status:** DONE (2026-08-24) — verified by the product owner on real hardware.
**Priority:** P0 (release gate for the v0.2.0 tag)
**Depends on:** T012–T019 complete (V2 engineering suite), T011 (MVP gate)

## Goal

Complete the manual, on-device items of `.agents/docs/RELEASE_CHECKLIST.md`
for the V2 capture-guidance suite — the checks automated tests cannot cover.

## Scope

1. Camera framing guidance and face positioning hints on a real phone.
2. Background advisory + opt-in white-background whitening on real photos.
3. Auto-crop pre-positioning after a detected-face capture.
4. Physical size inputs and preset fidelity end-to-end.
5. Worker offload under real conditions: large photos must not freeze the
   UI, including environments where the worker is unavailable (in-thread
   fallback).
6. Regression: core photo/signature/camera/offline/privacy behavior from the
   T011 pass still holds.

## Acceptance criteria

- [x] Owner-verified on real devices; results recorded below.
- [x] STATE.md updated with the outcome.

## Results

Owner-verified 2026-08-24: the V2 suite (framing hints, face positioning,
background whitening, auto-crop suggestion, preset fidelity, physical-size
inputs, worker offload) confirmed working on real hardware alongside the MVP
regressions. v0.2.0 release checkpoint passed.
