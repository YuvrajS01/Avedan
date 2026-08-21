# Next Task

## Active task

**T003 — Constraint-based file size optimizer**

See `tasks/T003-size-optimizer.md`.

## Goal

Implement the optimizer loop that searches encode quality (and dimensions only when allowed) to satisfy min/max/target file-size constraints while maximizing visual quality, building on the T002 primitives.

## Required output

- Bounded search over encode quality (binary or step search) using `encodeCanvas`
- Respect mandatory dimensions; never shrink when exact dimensions are required
- Support max-only, range, and target file-size modes from `FileSizeRange`
- Deterministic best-candidate selection within browser/codec variance
- Edge-case coverage: unreachable minimum, unreachable maximum, tiny images
- Optimizer remains framework-independent and worker-ready (no UI imports)

## Handoff expectation

When complete, update this file to point at T004 and describe any deviations.
