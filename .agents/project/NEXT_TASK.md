# Next Task

## Active task

None in progress. T019 (verified-preset registry preparation) is
**complete** — see `.agents/tasks/T019-preset-registry-prep.md` and
DECISIONS D045.

## Context

- MVP released as `v0.1.0-mvp`; T011 verification passed.
- V2 engineering suite complete: T012–T019 (framing hints, face positioning,
  background advisory + whitening, auto-crop suggestion, preset fidelity,
  physical-size inputs, worker offload, registry prep). See STATE.md and
  DECISIONS D038–D045. 244 tests passing; typecheck/lint/build clean.

## Remaining V2 backlog (agent-blocked or release work)

1. **Owner workflow** — manually verified official presets (D003/D019):
   verify values against official sources and add entries to
   `src/domain/presets/seedPresets.ts` following its checklist. This is
   human verification; an agent cannot perform it. The registry now accepts
   `background: 'white'`, `physicalSizeMm`/`dpi` end-to-end.
2. **v0.2.0 release tag** once the V2 capture-guidance suite is manually
   verified on real devices (T011-style pass).

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
