# Next Task

## Active task

**T015 — Auto-crop suggestion from detected face (V2)** — defined in
`.agents/tasks/T015-auto-crop-suggestion.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 so far: T012 live framing hints, T013 opt-in face positioning (native
  FaceDetector), T014 background advisory + opt-in whitening. See STATE.md and
  DECISIONS D038–D040.
- T015 completes V2 priority 7 (automatic crop suggestions), deferred from
  T013. Same privacy gate: native detector only, no models.

## V2 backlog after T015

1. Preset fidelity: `allowedScales` for `within`-mode PNG optimization;
   signature-flow preset wiring; presets may carry `background: 'white'`.
2. Manually verified official presets (D003/D019 workflow).
3. Physical-size (mm/DPI) inputs using `dimensionsFromPhysical`.
4. Worker offload of the encode/optimize loop.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
