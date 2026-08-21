# Project State

## Snapshot

**Project:** Avedan  
**Stage:** Product definition / implementation setup  
**Last updated:** 2026-08-21  
**Status:** Not yet implemented

## Product goal

Create a browser-based tool that prepares application photos and signatures to exact technical constraints such as aspect ratio, pixel dimensions, physical dimensions, format, and file-size ranges.

## Current capabilities

- Product concept defined.
- MVP scope defined.
- Client-side architecture direction defined.
- Agent operating rules defined.
- Requirements/configuration model defined.
- UX direction defined.

## Not implemented yet

- Application shell
- Photo upload flow
- Camera capture
- Cropper
- Image processing engine
- Compression optimizer
- Signature drawing
- Signature cleanup
- Validation engine
- Preset registry
- PWA/offline packaging
- Automated tests

## Current focus

Set up the technical foundation and implement the processing engine before building the polished UI.

## Current risks

1. Browser image encoding behavior varies across engines.
2. Aggressive compression can damage thin signatures and facial details.
3. Background removal models can significantly increase app payload size.
4. Government form requirements can change; presets need source/verification metadata.
5. Exact physical-size claims depend on how a downstream portal validates files, so the UI must clearly distinguish physical dimensions/DPI from pixel constraints.

## Next recommended task

`tasks/T001-project-foundation.md`

## Continuity rule

Any agent finishing a task must update this file before handing off work.
