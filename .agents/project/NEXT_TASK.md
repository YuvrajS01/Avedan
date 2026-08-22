# Next Task

## Active task

**T013 — Face detection and positioning assistance (V2)** — defined in
`.agents/tasks/T013-face-detection-guidance.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 manual verification passed; T012 camera
  framing guidance shipped (see STATE.md).
- T013 covers V2 priorities 2/3/6 (face detection, positioning, head angle)
  plus a partial auto-crop suggestion (7).
- Hard privacy gate: any detection model is **opt-in**, disclosed, lazy-loaded,
  and skippable; flows must work fully without it (PRIVACY spec, D033).

## V2 backlog after T013

1. Background quality detection + white-background processing.
2. Preset fidelity: `allowedScales` for `within`-mode PNG optimization;
   signature-flow preset wiring.
3. Manually verified official presets (D003/D019 workflow).
4. Physical-size (mm/DPI) inputs using `dimensionsFromPhysical`.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
