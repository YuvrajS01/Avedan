# Avedan — Agent Contract

This repository is designed for agent-driven development. The complete product, architecture, UX, task, testing, privacy, and handoff documentation lives under `.agents/`.

## Mandatory first read

Before making any change, read these files in order:

1. `.agents/project/STATE.md`
2. `.agents/project/NEXT_TASK.md`
3. `.agents/docs/PRD.md`
4. `.agents/architecture/TECHNICAL_ARCHITECTURE.md`
5. `.agents/design/UI_UX_SPEC.md`
6. The relevant `.agents/specs/*` file
7. The relevant `.agents/tasks/*` task file

## Development rules

- Work on the active task only unless a dependency requires otherwise.
- Inspect the repository before coding; do not assume prior work is complete.
- Keep image processing independent from presentation/UI code.
- Keep form requirements data-driven rather than hardcoded into components.
- Preserve the client-side/privacy-first architecture unless a documented product decision changes it.
- Avoid unnecessary dependencies.
- Do not silently alter the PRD or acceptance criteria.

## Completion requirements

Before handing off work:

- Run the appropriate type checks, linting, tests, and production build checks available in the project.
- Update `.agents/project/STATE.md`.
- Update `.agents/project/NEXT_TASK.md`.
- Update the relevant task file.
- Record meaningful architectural/product decisions in `.agents/project/DECISIONS.md`.

## Handoff principle

Project-critical context must live in the repository, not in conversation memory. A different coding agent should be able to continue from `.agents/project/STATE.md` and `.agents/project/NEXT_TASK.md` alone.
