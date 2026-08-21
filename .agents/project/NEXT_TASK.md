# Next Task

## Active task

**T002 — Image processing primitives**

See `tasks/T002-processing-primitives.md`.

## Goal

Implement tested, framework-independent operations for decode, crop, resize, format conversion, and metadata extraction under `src/processing/`, with no React/UI dependencies.

## Required output

- Decode of supported local images (JPEG/PNG at minimum)
- Crop calculations producing the requested aspect ratio
- Resize producing exact requested pixel dimensions
- Format conversion for MVP formats (JPEG/PNG; WebP where supported)
- Edge-case test coverage
- Processing functions remain pure/framework-free (DECISIONS D005)

## Handoff expectation

When complete, update this file to point at T003 and describe any deviations.
