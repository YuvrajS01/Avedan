# Agent-Driven Development Workflow

This workflow is designed for switching between models/agents over time.

## The repository is the shared memory

The agent should not assume another model remembers previous conversation context. Durable state belongs in files.

### Before starting

Read `AGENTS.md`, `project/STATE.md`, `project/NEXT_TASK.md`, then the active task.

### While working

Make the smallest coherent change that satisfies the task. If the task exposes a new architectural issue, document it in `project/DECISIONS.md` rather than silently changing the product direction.

### Before stopping

Update `project/STATE.md` and `project/NEXT_TASK.md`. Mark the task status and write a concise handoff.

## Task lifecycle

`PLANNED → IN_PROGRESS → BLOCKED / READY_FOR_REVIEW → DONE`

Use `BLOCKED` only when progress genuinely cannot continue without external input.

## Recommended commit style

Examples:

- `feat(processor): add constraint-based jpeg optimizer`
- `feat(camera): add guided capture flow`
- `feat(signature): add drawing canvas`
- `fix(validation): handle png byte-size edge case`
- `docs(state): handoff processing engine`

## Changing scope

Do not expand an MVP task because a useful feature was discovered during implementation. Record it as a new task under `tasks/` unless it is necessary to satisfy the current acceptance criteria.
