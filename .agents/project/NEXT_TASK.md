# Next Task

## Active task

**T004 — Photo upload, crop and export**

See `tasks/T004-photo-flow.md`.

## Goal

Wire the T002 primitives and T003 optimizer into the Photo flow: file intake (upload + drag-and-drop), requirement selection (preset-style data plus custom), fixed-aspect crop UI, optimize action, validation summary, and client-side download.

## Required output

- File picker and drag-and-drop intake using `decodeImage`/`assertDecodableFile`
- Data-driven requirement selection driving crop ratio, dimensions, format, and size limits
- Fixed-aspect-ratio crop with pan/zoom and reset
- "Make it fit" optimization via `optimizeEncoding` with progress/result feedback
- Validation summary (dimensions, aspect ratio, format, bytes) before download
- Download without any server involvement
- Privacy messaging visible near intake
- Mobile-first layout per `design/UI_UX_SPEC.md`

## Handoff expectation

When complete, update this file to point at T005/T006 and describe any deviations.
