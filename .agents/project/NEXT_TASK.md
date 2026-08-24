# Next Task

## Active task

None in progress. The v0.2.0 release gate (T020 manual verification) was
**passed by the product owner on 2026-08-24** and `v0.2.0` is tagged.

## Context

- MVP released as `v0.1.0-mvp` (T011 gate passed).
- V2 complete: T012–T019 engineering items plus the T020 manual verification
  gate. See STATE.md and DECISIONS D038–D046. 245 tests passing;
  typecheck/lint/build clean.

## Backlog

1. **Owner workflow** — manually verified official presets (D003/D019):
   verify values against official sources and add entries to
   `src/domain/presets/seedPresets.ts` following its checklist. Human
   verification; an agent cannot perform it.
2. New feature work (thumb impressions, batch/ZIP export, PDF utilities —
   see `.agents/docs/ROADMAP.md`) should be scoped and defined as a new
   task file in `.agents/tasks/` before any implementation.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
