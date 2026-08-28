# T022 — V3 Thumb impression preparation flow

**Status:** DONE (2026-08-26)
**Priority:** P1
**Depends on:** T021 (preset engine with thumbImpression)
**Architecture references:** D005 (processing separate from UI), D015 (fit-within vs exact), D010 (injectable canvas), processing/trim, signature flow

## Goal

Provide a dedicated thumb-impression preparation flow (upload, guidance, trim, resize, compress, validate, download) that reuses the existing client-side processing primitives and follows the same privacy guarantees as photo/signature.

## Scope

1. **Domain reuse:** thumb impressions are image assets — reuse `ImageRequirements` / `ProcessedAsset` / `ProcessingError` / optimizer. Define thumb-specific default manual settings (e.g. 240×240 px, ≤ 30 KB, JPEG) but keep them data-driven (preset can override).
2. **Intake:** upload via file picker + drag-drop (reuse `loadPhotoSource` pattern). Optional camera path deferred (thumb photos are typically scans).
3. **Processing:** decode → optional whitespace trim / ink cleanup → fit-within resize (never upscale) → encode → optimizer loop (allowedScales when file-size constrained, like signature T016) → validate (`within` dimension mode).
4. **Guidance UI:** explain plain white paper, inked thumb, good lighting, avoid blur — reuse advisory hints where applicable but thumb-specific copy.
5. **Routing:** add `#/thumb` route, nav entry, and `FormsView` → "Prepare thumb" action for presets that define `thumbImpression` (data-driven, not hardcoded).
6. **Privacy:** no upload, canvas re-encode strips EXIF, session URLs revoked.

## Non-goals

- Application Kit aggregation (T024).
- Kit ZIP export (T025).
- Verified official preset content.

## Acceptance criteria

- [x] New route `thumb` with intake → preview → result steps, keyboard accessible, mobile-friendly.
- [x] Preset-driven: when `#/thumb?preset=id` carries thumbImpression, preset attribution banner shows (name, authority, lastVerified, source link) and manual edits take precedence (D035 pattern).
- [x] Validation uses `within` semantics where appropriate; advisory hints separate.
- [x] Tests for thumb processing + view (upload → trimmed preview → result).
- [x] Typecheck/lint/tests/build pass.

## Verification

- `npm run typecheck`, `lint`, `test`, `build` pass — 257 tests, 25 files.
- Manual: upload a thumb photo, complete flow, download; confirm dimensions/format/size match preset when one is selected.

## Outcome (2026-08-26)

Implemented on `feat/v3-form-intelligence`:
- `src/domain/requirements/profiles.ts` — added `THUMB_PROFILES` + `findThumbProfile`.
- `src/features/thumb/processThumb.ts` — trim → fit-within (never upscale) → flatten white → optimize with `THUMB_ALLOWED_SCALES` when file-size constrained → validate `within`; `computeThumbOutput` shared main/worker, `processThumb` via `processWithOptionalWorker` kind `thumb`.
- `src/workers/protocol.ts` / `handleProcessRequest.ts` / `client.ts` — extended `ProcessKind` to `photo|signature|thumb`, new `ThumbProcessRequest`, worker dispatch.
- `src/features/thumb/ThumbView.tsx` — choose (upload drag-drop + requirements panel with Load preset + Width/Height/Min/Max/Format, `THUMB_PROFILES`, preset autofill with manual precedence, preset context banner, thumb-specific lede + privacy note) → preview (trimmed PNG preview) → result (`ProcessedResult` noun thumb impression); session URLs revoked.
- `src/app/routes.ts` + `App.tsx` + `components/NavBar.tsx` — added `thumb` route, Nav icon, view registry.
- `src/features/forms/FormsView.tsx` — data-driven Prepare signature + Prepare thumb buttons per preset.
- Tests: `ThumbView.test.tsx` (5), `App.test.tsx` + `routes.test.ts` updated for thumb, `FormsView.test.tsx` extended (thumb button + navigation). 257 tests passing; typecheck/lint/build clean. No hardcoded exam rules; within validation consistent with D015/D042.

## Handoff

Branch `feat/v3-form-intelligence`; next is T023 requirement validation.
