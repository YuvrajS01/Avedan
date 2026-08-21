# Processing Engine Specification

## Objective

Transform source media into the highest-quality output that satisfies explicit requirements.

## Inputs

- source image/blob
- crop state
- optional rotation
- optional background operation
- `ImageRequirements`

## Outputs

- output Blob
- width
- height
- MIME type
- byte size
- validation result

## Determinism

For fixed input pixels and fixed settings, outputs should be stable within browser/codec differences. Tests should allow small implementation-specific variance when byte-level equality is not realistic.

## Required operations

### Crop

Crop to exact target aspect ratio.

### Resize

Generate exact target pixel dimensions when provided.

### Physical size

When physical dimensions and DPI are provided, derive pixel dimensions deterministically and expose both values to the user.

### Encode

JPEG should be the primary target for ordinary application photographs/signatures where required.

PNG should be retained when transparency or exact lossless output is necessary.

### Optimize

Search quality and, only when allowed by requirements, dimensions to satisfy file-size constraints.

## Edge cases

- very small images
- extremely large images
- transparent PNG sources
- animated images
- unsupported MIME types
- zero-byte/corrupt files
- files with unusual color profiles
- very thin signatures
- all-white/empty signature input

## Signature-specific processing

Recommended order:

1. decode
2. grayscale/threshold if enabled
3. remove empty margin
4. resize
5. background normalization
6. encode
7. validate

Keep the raw signature drawing editable until the user finishes the session.
