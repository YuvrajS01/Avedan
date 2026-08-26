# T025 — V3 Kit export (ZIP / batch guidance)

**Status:** PLANNED
**Priority:** P2
**Depends on:** T024 (Application Kit view)
**Architecture references:** ROADMAP Phase 5, PRIVACY (no upload), processing/encode

## Goal

Let users collect the prepared assets for a single application kit and download them together, while staying fully client-side.

## Scope

1. **Client-side ZIP generation** for the current kit session (photo + signature + thumb blobs) with sensible filenames (`{preset-id}-photo.jpg`, etc.). Evaluate dependency weight before adding (prefer a small, tree-shakeable ZIP helper; avoid large WASM). If weight is excessive, provide a "Download each file" checklist as interim.
2. **Batch guidance:** explain file naming / portal upload order if required by the authority (data-driven `preset.description` can carry notes; do not hardcode portal steps).
3. **Privacy:** all blobs stay in memory/session; revoke URLs after kit reset; no network.

## Non-goals

- Institution/batch CSV workflows.
- Server-side assembly.

## Acceptance criteria

- [ ] Kit view offers "Download kit" when at least one asset prepared.
- [ ] ZIP contains exactly the prepared asset kinds for that preset, with correct MIME extensions.
- [ ] Fallback when ZIP unavailable still lets users download each file individually.
- [ ] Tests for ZIP assembly (mock blobs) or checklist fallback.
- [ ] Typecheck/lint/tests/build pass; dependency weight documented in DECISIONS.

## Verification

- Manual: prepare photo + signature for a thumb-capable preset, download kit, unzip and confirm file sizes/formats match validation.
