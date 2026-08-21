# Avedan — Agent-Driven Development Starter

Avedan is a privacy-first, client-side web application for preparing photos, signatures, thumb impressions, and other image assets for government exams, recruitment portals, scholarships, university applications, and similar forms.

Core promise:

> Capture or upload once → apply requirements → validate → download a form-ready file.

The application should process user images locally in the browser by default. No image bytes should be uploaded to a backend in the MVP.

## Repository purpose

This repository is intentionally structured for agent-driven development. Multiple coding models/agents can work on the same project at different times because durable project state, decisions, tasks, requirements, and acceptance criteria are stored in files.

Start with:

1. `AGENTS.md`
2. `project/STATE.md`
3. `project/NEXT_TASK.md`
4. `docs/PRD.md`
5. `architecture/TECHNICAL_ARCHITECTURE.md`
6. `design/UI_UX_SPEC.md`

## Guiding principles

- Client-side first.
- Privacy by default.
- Requirements are data, not hardcoded UI logic.
- Deterministic processing where practical.
- Excellent mobile capture UX.
- Never claim that a generated asset is guaranteed to be accepted by an authority.
- Every form preset must have a source and verification date.
- Agents must update project state when completing meaningful work.

## Current status

The project is at the product-definition / implementation-planning stage. No production application code is assumed to exist yet.
