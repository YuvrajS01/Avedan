# Next Task

## Active task

**T016 — Preset fidelity: PNG size optimization and signature preset wiring (V2)** —
defined in `.agents/tasks/T016-preset-fidelity.md`, not yet started.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 so far: T012 live framing hints, T013 opt-in face positioning, T014
  background advisory + whitening, T015 auto-crop suggestion. See STATE.md and
  DECISIONS D038–D041.
- T016 closes the two IMPORTANT findings from the MVP release audit:
  multi-scale fallback for `within`-mode outputs (mainly PNG signatures) and
  Forms → signature preset wiring using the D035 manual-edit precedence rule.

## V2 backlog after T016

1. Manually verified official presets (D003/D019 workflow); presets may carry
   `background: 'white'`.
2. Physical-size (mm/DPI) inputs using `dimensionsFromPhysical`.
3. Worker offload of the encode/optimize loop.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
