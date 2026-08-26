# T021 — V3 Preset engine & data model (thumb + data-driven)

**Status:** DONE (2026-08-26)
**Priority:** P0 — first V3 task
**Depends on:** T019 (registry prep), T008 (preset registry)
**Architecture references:** D002 (requirements as data), D003 (source metadata), D019 (illustrative until verified), REQUIREMENTS_SCHEMA (thumbImpression), PRIVACY, PRD Phase 3

## Goal

Turn Avedan from a generic image-preparation tool into a form/application preparation assistant foundation.

Extend the preset engine so it can describe a complete application:

- application name
- authority
- year/version
- photo requirements
- signature requirements
- thumb-impression requirements where applicable
- official source reference
- last-verified date
- verification metadata (freshness)

All requirements must remain **data-driven**. No exam-specific rules may be hardcoded into UI components. The engine must be validated before the first real official preset is added.

Start with the preset engine and **one** carefully selected illustrative preset exercising the new capability — do not build a large database in this task.

## Context

`src/domain/presets/schema.ts` currently supports only `photo` and `signature`. The spec (`REQUIREMENTS_SCHEMA.md`) already defines `thumbImpression?: ImageRequirements` but the implementation diverged. `PresetAssetKind` is `'photo' | 'signature'` only, `requirementsFromPreset` and `FormsView` handle only those two kinds, and `validateFormPreset` rejects a thumb-only preset as invalid. V3 needs thumb as a first-class asset.

Coverage today: 4 illustrative seed presets, no thumb example, manual verification workflow owner-only (D019).

## Scope

### 1. Schema & validation (data-driven, no UI hardcoding)

- Extend `FormPreset` to include optional `thumbImpression?: PresetRequirements`.
- Extend `PresetAssetKind` to `photo | signature | thumbImpression` (or `thumb` — choose one canonical name and keep mapping consistent; spec uses `thumbImpression`).
- Update `validateFormPreset`:
  - accept `thumbImpression` with the same `assertRequirements` rules as photo/signature (format, pixelSize, aspectRatio, physicalSizeMm, dpi, fileSizeBytes min≤max, background).
  - require at least one of `photo | signature | thumbImpression` (currently photo|signature).
  - keep strict `lastVerified` ISO date and `sourceUrl` http(s) checks.
- Update `requirementsFromPreset` to map thumbImpression identically (dimensions, aspectRatio→ratio, fileSize, background white→white, physicalSizeMm, dpi).
- Do not add hardcoded exam logic anywhere.

### 2. Registry & seed data

- Keep `src/domain/presets/seedPresets.ts` as the single seed source; add a written note that thumb is now supported.
- Add **one** carefully selected illustrative preset that exercises thumbImpression (e.g. a form requiring photo + signature + left thumb impression). It must be clearly labelled illustrative (description prefix `Illustrative template:`) and carry `lastVerified` + `sourceUrl` (example.gov) — never claim official authority.
- Keep existing 4 presets unchanged beyond thumb support.

### 3. Forms UI (data-driven rendering)

- `FormsView.tsx` must render photo/signature/thumb lines from data, not hardcoded branches. For each kind present, show `Label: {describeRequirements(...)}`.
- If thumbImpression exists, offer a prepare action consistent with photo/signature (for now, thumb can navigate to photo flow or be listed; full thumb capture flow is T022 — this task only needs to surface the requirement correctly).
- Keep badges (Verified / Needs re-verification via `presetFreshness`), last-verified date, official-source link, and the "Presets are technical references only — they do not guarantee acceptance. Always confirm against the official source." disclaimer visible.

### 4. Accuracy rule

- Never render "Officially approved" or "Guaranteed to be accepted".
- Thumb-impression preset must display the same verification metadata and disclaimer as other presets.

## Non-goals (deferred to follow-ups)

- Thumb capture/edit pipeline (T022).
- ZIP / batch / kit export (T024–T025).
- Populating a large preset database — this task adds only one thumb example.
- Adding a real verified official preset with a live government source (owner workflow; a follow-up task may replace/extend the illustrative example after verification).

## Acceptance criteria

- [x] `FormPreset` and `PresetAssetKind` include thumbImpression; `validateFormPreset` accepts thumbImpression and requires at least one of the three kinds.
- [x] `requirementsFromPreset(preset, 'thumbImpression')` maps all fields (format, dimensions, aspectRatio, fileSize, background white, physicalSizeMm, dpi); returns undefined when absent.
- [x] New illustrative preset with `thumbImpression` validates, appears in `FormsView`, shows photo/signature/thumb summaries, freshness badge, source link, and no-guarantee disclaimer; search finds it.
- [x] No exam-specific logic hardcoded in UI — `FormsView` iterates over present kinds.
- [x] Existing tests still pass; new tests cover thumb schema + mapping + UI line.
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` pass.

## Verification

- Run `npm run typecheck` — clean.
- Run `npm run lint` — clean.
- Run `npm test` — 250/250 pass (+5 new thumb cases).
- Run `npm run build` — succeeds, no bundle regression.
- Manual: open `#/forms`, confirm thumb preset card shows 3 requirement lines and the standard disclaimer; click through preserves hash routing.

## Outcome (2026-08-26)

Implemented as D047 on branch `feat/v3-form-intelligence`:
- `src/domain/presets/schema.ts`: added `thumbImpression` + `PRESET_ASSET_KINDS`, updated validation to require at least one of three kinds.
- `src/domain/presets/registry.ts`: thumb mapping via generic `preset[kind]` (no special case).
- `src/domain/presets/seedPresets.ts`: added `example-thumb-kit` illustrative preset + updated checklist comment.
- `src/features/forms/FormsView.tsx`: data-driven `ASSET_KINDS`/`ASSET_LABEL` iteration, lede now mentions thumb, thumb hint line for thumb presets.
- Tests: `presets.test.ts` + `FormsView.test.tsx` extended for thumb (thumb-only preset, thumb mapping, thumb rendering + search). 250 tests.

## Handoff

- Updated `DECISIONS.md` D047, `STATE.md` (V3 stage), `NEXT_TASK.md` (T022 next).
- Branch: `feat/v3-form-intelligence`; V2 `v0.2.0` remains tagged. No release tag for this incremental V3 step.
