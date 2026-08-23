# Next Task

## Active task

**T018 — Worker offload of the encode/optimize loop (V2)** — defined in
`.agents/tasks/T018-worker-offload.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 so far: T012–T017 (framing hints, face positioning, background advisory +
  whitening, auto-crop suggestion, preset fidelity, physical-size inputs).
  See STATE.md and DECISIONS D038–D043.
- T018 addresses the last remaining engineering item (MVP audit M4): move the
  encode/measure/optimize loop off the main thread with an in-thread fallback.

## V2 backlog after T018

1. Manually verified official presets — **owner workflow** (D003/D019): needs
   human verification against official sources; agent can only prepare the
   registry structure. Presets may carry `background: 'white'` and
   `physicalSizeMm`/`dpi`.
2. Optional: a v0.2.0 release tag once the V2 capture-guidance suite is
   manually verified on real devices (T011-style pass).

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
