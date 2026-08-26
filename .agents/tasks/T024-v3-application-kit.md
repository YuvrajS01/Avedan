# T024 — V3 Application Kit view

**Status:** PLANNED
**Priority:** P1
**Depends on:** T021 (engine), T022 (thumb flow), T023 (preset-aware validation)
**Architecture references:** UI_UX_SPEC (Forms → Kit), ROADMAP Phase 5, DECISIONS D025/D026 (single-column + sidebar shell)

## Goal

Aggregate all assets required by a selected form preset into an "Application Kit" view: the user sees at a glance what the form requires (photo, signature, thumb impression, and future document types), verification metadata, official source, and the status of each asset in the current session.

## Scope

1. **Route:** `#/kit?preset=id` (or `#/forms/:id/kit`) resolving via `findFormPreset` + `presetFreshness`.
2. **Kit summary card:** application name, authority, year/version, lastVerified, freshness badge, official-source link, stale warning when >12 months, and the mandatory disclaimer ("Technical references only — always confirm against the official portal/notification before submitting.").
3. **Per-asset sections** (data-driven over present kinds): for each of photo/signature/thumbImpression present in the preset, show `describeRequirements(...)`, prepared/not-prepared status, last validation result (`pass`/`attention`/`not-run`), and CTA to `Prepare {kind}` (navigates to photo/signature/thumb with `?preset=id`).
4. **Session-local only:** track prepared assets via in-memory/session state; no durable image bytes. Clearable on navigation.
5. **No hardcoding:** kit iterates over preset keys; a preset with only photo+thumb renders only those sections.

## Non-goals

- ZIP/batch download (T025).
- Persisted project history.
- Verified official preset content (owner workflow).

## Acceptance criteria

- [ ] Kit view renders for any preset id (photo-only, photo+signature, photo+signature+thumb).
- [ ] Preset metadata fully visible: name, authority, year, lastVerified, freshness, sourceUrl link, disclaimer.
- [ ] Per-asset requirements driven from `requirementsFromPreset`; actions route to correct flow with preset param.
- [ ] Empty/unknown preset id handled gracefully (not found message + link to Forms).
- [ ] Tests for kit rendering + routing + data-driven sections.
- [ ] Typecheck/lint/tests/build pass; no exam-specific hardcoding.

## Verification

- Manual: open Forms → click kit entry; verify all required kinds listed and each CTA preserves `?preset=id`.
