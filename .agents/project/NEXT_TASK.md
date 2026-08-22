# Next Task

## Active task

**T011 — Pre-release manual verification pass (V2 gate)** — defined in
`.agents/tasks/T011-manual-release-verification.md`, not yet started.

## Context

The MVP (T001–T010) was audited and declared release-ready on 2026-08-22 (see
`.agents/project/MVP_RELEASE_AUDIT.md`). The audit's two blockers were fixed
in-repo (manual edits while a form preset is active; minimum file-size
support). T011 completes the manual, on-device items of
`.agents/docs/RELEASE_CHECKLIST.md` before any public deployment.

## V2 backlog (after T011)

1. **T012 candidate — Preset fidelity & signature wiring:** pass
   `allowedScales` for `within`-mode PNG optimization (audit I1) and wire
   Forms presets into the signature flow via
   `requirementsFromPreset(preset, 'signature')` (audit I2).
2. Replace illustrative seed presets with manually verified official
   requirements (D003/D019 workflow).
3. Physical-size (mm/DPI) inputs using the existing
   `dimensionsFromPhysical` engine math.
4. Worker offload of the encode/optimize loop.

New tasks must be added to `.agents/tasks/` and indexed in `TASK_INDEX.md`.

## Handoff expectation

Update this file whenever a new task is defined and started.
