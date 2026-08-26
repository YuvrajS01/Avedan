# T022 — V3 Thumb impression preparation flow

**Status:** PLANNED
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

- [ ] New route `thumb` with intake → preview → result steps, keyboard accessible, mobile-friendly.
- [ ] Preset-driven: when `#/thumb?preset=id` carries thumbImpression, preset attribution banner shows (name, authority, lastVerified, source link) and manual edits take precedence (D035 pattern).
- [ ] Validation uses `within` semantics where appropriate; advisory hints separate.
- [ ] Tests for thumb processing + view (upload → trimmed preview → result).
- [ ] Typecheck/lint/tests/build pass.

## Verification

- `npm run typecheck`, `lint`, `test`, `build` pass.
- Manual: upload a thumb photo, complete flow, download; confirm dimensions/format/size match preset when one is selected.
