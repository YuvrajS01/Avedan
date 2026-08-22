# Next Task

## Active task

**T014 — Background quality detection and white-background processing (V2)** —
defined in `.agents/tasks/T014-background-quality-whitening.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 so far: T012 live framing hints, T013 opt-in face positioning via the
  native `FaceDetector` (no models). See STATE.md and DECISIONS D038/D039.
- T014 covers V2 priorities 8–9 with deterministic pixel heuristics only;
  ML segmentation stays out of V2.

## V2 backlog after T014

1. Auto-crop pre-positioning from a detected face (deferred from T013).
2. Preset fidelity: `allowedScales` for `within`-mode PNG optimization;
   signature-flow preset wiring.
3. Manually verified official presets (D003/D019 workflow).
4. Physical-size (mm/DPI) inputs using `dimensionsFromPhysical`.
5. Worker offload of the encode/optimize loop.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
