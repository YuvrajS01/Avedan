# T025 — V3 Kit export (ZIP / batch guidance)

**Status:** DONE (2026-08-26)
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

- [x] Kit view offers "Download kit" when at least one asset prepared.
- [x] ZIP contains exactly the prepared asset kinds for that preset, with correct MIME extensions.
- [x] Fallback when ZIP unavailable still lets users download each file individually.
- [x] Tests for ZIP assembly (mock blobs) or checklist fallback.
- [x] Typecheck/lint/tests/build pass; dependency weight documented in DECISIONS.

## Outcome (2026-08-26)

Implemented on `feat/v3-form-intelligence`:
- `src/utils/zip.ts` — minimal ZIP creator (STORE, no compression) with CRC32, DOS date/time, local/central/EOCD headers; `createZipBlob` + `blobToUint8Array` (FileReader fallback for jsdom); ~2 KB, no dependencies (evaluated fflate/jszip, rejected to keep bundle <85 KB gzipped, per PRIVACY weight rule).
- `src/domain/kit/store.ts` — session-local Map<presetId, Map<kind, {blob,fileName,sizeBytes}>>; `setKitAsset`/`getKitAsset`/`getKitAssets`/`clearAllKits` (in-memory only, no durable bytes, D001).
- Integrated store in `PhotoView` (`handleConfirm`), `SignatureView` (`finishDraw` + `processUploaded`), `ThumbView` (`processUploaded`) — when `presetId` present, stores `{blob,fileName,sizeBytes}` via `setKitAsset` (data-driven kind).
- `src/features/kit/KitView.tsx` — now shows per-asset prepared status (`Prepared — file · KB` vs `Not yet prepared`), `preparedCount` summary, individual Download buttons per prepared asset (creates ephemeral object URL), and Download kit ZIP card: collects prepared assets via `getKitAsset`, converts via `blobToUint8Array`, builds ZIP via `createZipBlob` (filenames from stored `fileName`), creates object URL, triggers download + shows Re-download link, handles empty kit error, busy state, privacy note (STORE note). Session URLs revoked on replace/unmount.
- Tests: `src/tests/zip.test.ts` (4) validates ZIP signatures, file names, empty ZIP, round-trip; `src/tests/kitStore.test.ts` (5) validates per-preset isolation, overwrite, empty presetId guard, clear; `src/tests/KitView.test.tsx` extended (8 total) covers prepared status, ZIP enabled/disabled, ZIP creation + Re-download, View kit navigation. 281 tests passing; typecheck/lint/build clean (75 modules, 281 KB JS gz 84.5 KB, worker 13.95 KB). No exam hardcoding; all kit behavior derives from preset + store.

## Verification

- `npm run typecheck` clean, `lint` clean, `test` 281/281, `build` clean. Manual: prepare photo + signature for thumb-kit preset, download kit, unzip confirms 2 files with correct names/sizes (thumb not yet prepared excluded).
