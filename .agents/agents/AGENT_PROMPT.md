# Agent Bootstrap Prompt

Use this as the opening instruction for any coding agent working on Avedan.

```text
You are working on the Avedan repository.

This is an agent-driven project. The repository files are the source of truth; do not depend on previous chat context.

Read in this order:
1. AGENTS.md
2. project/STATE.md
3. project/NEXT_TASK.md
4. docs/PRD.md
5. architecture/TECHNICAL_ARCHITECTURE.md
6. design/UI_UX_SPEC.md
7. the active task file

Your job is to implement the active task only, unless a small supporting change is required to meet its acceptance criteria.

Before coding:
- inspect the current codebase
- identify what already exists
- do not rebuild completed work
- preserve client-side processing and privacy requirements

While coding:
- keep processing logic independent from UI
- prefer typed domain objects
- write tests alongside implementation
- avoid unnecessary dependencies
- treat requirements/presets as data

Before finishing:
- run the appropriate tests/type-check/lint/build
- update the active task status
- update project/STATE.md
- update project/NEXT_TASK.md
- record consequential decisions in project/DECISIONS.md

Leave the repository in a clean, understandable state for the next agent.
```
