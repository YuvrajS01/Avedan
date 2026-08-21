# Technical Architecture

## Recommended stack

- React
- TypeScript
- Vite
- CSS or a lightweight component/style system
- Web Workers for CPU-heavy processing
- Canvas / OffscreenCanvas for image operations
- IndexedDB only for temporary/local project metadata where needed
- PWA service worker after the core flow is stable

A framework should only be added when it clearly improves the user experience or routing needs. The core processing engine must not depend on framework APIs.

## High-level architecture

```text
UI Layer
  |
  +-- Intake / Camera / Crop / Signature / Preview
  |
Application Layer
  |
  +-- Requirement Resolver
  +-- Job Orchestrator
  +-- Validation
  |
Processing Layer
  |
  +-- Decode
  +-- Crop
  +-- Transform
  +-- Resize
  +-- Background operations
  +-- Encode
  +-- Constraint Optimizer
  |
Worker Layer
  |
  +-- Image Worker
  +-- Optional ML Worker
```

## Suggested directory structure

```text
src/
  app/
  components/
  features/
    photo/
    signature/
    forms/
    custom/
    camera/
    validation/
  processing/
    decode/
    crop/
    resize/
    encode/
    optimize/
    background/
  domain/
    requirements/
    jobs/
    presets/
  workers/
  hooks/
  utils/
  styles/
  tests/
```

## Core domain objects

`ImageRequirements`

Represents all constraints needed to generate an output.

`ProcessingJob`

Represents source media, requirements, current stage, and processing result metadata. Do not persist raw image bytes by default in durable state.

`ValidationResult`

Contains individual checks and an overall pass/attention state.

`FormPreset`

Contains requirement definitions plus verification/source metadata.

## Processing pipeline

```text
Source File / Camera Frame
        ↓
Decode
        ↓
Crop / Transform
        ↓
Resize
        ↓
Optional Enhancement
        ↓
Encode Candidate
        ↓
Measure Bytes
        ↓
Optimizer Loop
        ↓
Validate
        ↓
Export Blob
```

## Constraint optimizer

For a maximum file size:

1. Produce an initial high-quality candidate.
2. Measure output bytes.
3. If too large, reduce quality using binary search or a bounded search.
4. If quality reaches an unacceptable floor, reduce dimensions if the requirements allow it.
5. Keep the best candidate satisfying constraints.

Never reduce required dimensions when exact dimensions are explicitly mandatory.

For a minimum/maximum range:

- prioritize staying within the range,
- avoid padding or artificial byte inflation unless an authority explicitly requires a minimum size and the implementation can do so without corrupting output.

## Camera

Use `navigator.mediaDevices.getUserMedia()`.

Provide:

- permission handling
- unsupported browser fallback
- camera switching where supported
- capture from video frame to canvas

Do not send camera frames to a server.

## Workers

Heavy processing should run off the main thread when practical.

Potential worker tasks:

- resize
- encoding attempts
- optimization search
- ML inference

Use transferable objects where beneficial and release references promptly.

## Privacy architecture

The absence of a backend image API is a deliberate security/privacy boundary.

Analytics must never receive image pixels, image data URLs, blobs, or raw file contents.

## Performance strategy

- Downsample enormous source images before expensive ML where quality allows.
- Avoid keeping multiple full-resolution copies in memory.
- Revoke object URLs after use.
- Release worker resources on reset/navigation.
- Prefer streaming or incremental processing where supported and appropriate.
