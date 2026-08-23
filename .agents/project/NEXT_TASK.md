# Next Task

## Active task

**T017 — Physical size (mm/DPI) requirement inputs (V2)** — defined in
`.agents/tasks/T017-physical-size-inputs.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 so far: T012–T016 (framing hints, face positioning, background advisory +
  whitening, auto-crop suggestion, preset fidelity). MVP audit IMPORTANT
  findings I1/I2 are now closed. See STATE.md and DECISIONS D038–D042.
- T017 exposes mm/cm + DPI inputs using the already-tested
  `dimensionsFromPhysical` engine math — a small, self-contained UI task.

## V2 backlog after T017

1. Manually verified official presets (D003/D019 **owner** workflow; needs
   human verification against official sources). Presets may carry
   `background: 'white'`.
2. Worker offload of the encode/optimize loop.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
