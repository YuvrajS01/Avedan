# T024 — V3 Application Kit view

**Status:** DONE (2026-08-26)
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

- [x] Kit view renders for any preset id (photo-only, photo+signature, photo+signature+thumb).
- [x] Preset metadata fully visible: name, authority, year, lastVerified, freshness, sourceUrl link, disclaimer.
- [x] Per-asset requirements driven from `requirementsFromPreset`; actions route to correct flow with preset param.
- [x] Empty/unknown preset id handled gracefully (not found message + link to Forms).
- [x] Tests for kit rendering + routing + data-driven sections.
- [x] Typecheck/lint/tests/build pass; no exam-specific hardcoding.

## Outcome (2026-08-26)

Implemented on `feat/v3-form-intelligence`:
- `src/features/kit/KitView.tsx` — `#/kit?preset=id` resolves via `findFormPreset` + `presetFreshness`; kit summary card shows name/authority/year/description/lastVerified/freshness badge/official source/stale warning + mandatory disclaimer; required assets iterated data-driven via `requiredAssetKinds` + `requirementsFromPreset` + `describeRequirements`, each with `assetLabel` and Prepare CTA routing to `photo/signature/thumb` with `?preset=id`; session-local note; empty preset handled with Browse forms CTA.
- `src/app/routes.ts` + `App.tsx` + `components/NavBar.tsx` — added `kit` route + KitView + Kit icon (document) + Nav entry.
- `src/features/forms/FormsView.tsx` — added data-driven View kit button per preset (alongside Prepare signature/thumb).
- Tests: `src/tests/KitView.test.tsx` (5) covers not-found, metadata, required assets data-driven (photo+signature+thumb), photo-only rendering, Forms → kit navigation; `App.test.tsx` + `routes.test.ts` updated for kit. 269 tests passing; typecheck/lint/build clean. No exam-specific hardcoding; all requirements derived from preset object.

## Verification

- `npm run typecheck` clean, `lint` clean, `test` 269/269, `build` clean (73 modules). Manual: Forms → View kit → verify 3 assets listed and each Prepare preserves `?preset=id`; photo-only kit shows only Photo.
