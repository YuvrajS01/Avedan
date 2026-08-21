# Avedan — Agent Instructions

## Objective

Build Avedan into a production-quality, privacy-first web application for preparing government-exam and application photos, signatures, thumb impressions, and eventually related document assets.

## Product principle

Avedan is not a generic image editor. Its purpose is to convert a source image or camera capture into an application-ready asset that satisfies explicit technical constraints such as aspect ratio, dimensions, format, DPI, and file-size limits.

## Core MVP

The first implementation should prioritize:

- Photo upload and camera capture
- Fixed-aspect-ratio cropping
- Resizing and export
- Target/min/max file-size optimization
- JPEG/PNG export as required
- Signature upload and drawing canvas
- Automatic signature whitespace cropping
- Custom requirements
- Validation before download
- Entirely client-side image processing

## Product priorities after MVP

1. Form presets backed by verified official requirements
2. Camera guidance and capture quality checks
3. Face detection and smart alignment
4. Background cleanup/removal
5. Thumb impression preparation
6. Batch processing and ZIP export
7. PWA/offline improvements
8. Document/PDF utilities

## Important constraints

- Image bytes must not be uploaded to a server in the MVP.
- Do not retain images permanently by default.
- Do not log raw images or sensitive image metadata.
- Strip unnecessary EXIF metadata on export where practical.
- Never claim that a generated asset is guaranteed to be accepted by an authority.
- Presets must store an official source and verification date.

## Working method

Use `.agents/project/STATE.md` as the durable project memory and `.agents/project/NEXT_TASK.md` as the current handoff pointer. Follow `.agents/project/DEVELOPMENT_WORKFLOW.md` and the relevant task file for the work being performed.

When requirements conflict, prefer the documented PRD and architecture, then record the resolution in `.agents/project/DECISIONS.md`.
