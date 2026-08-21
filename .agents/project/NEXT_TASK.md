# Next Task

## Active task

**T010 — Optional local intelligence**

See `tasks/T010-advanced-intelligence.md`.

> Note (2026-08-21): a crop-distortion bug was fixed first (crop box no longer
> breaks the target aspect ratio under `max-height` clamping — see
> DECISIONS D022). T010 remains the active task.

## Goal

Optional advisory enhancements on top of the now-complete MVP: capture-quality heuristics (blur/lighting), face-position guidance, and background uniformity hints — all client-side, progressive enhancement only (D007), never blocking the core flow.

## Required output

- Advisory checks surfaced through the existing validation engine as `not-run`/advisory entries
- Client-side only; no model downloads unless explicitly opted in
- Core flows remain fully functional without these features