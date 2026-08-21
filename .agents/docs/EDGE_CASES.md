# Edge Cases

## Photo

- Portrait photo is rotated using EXIF orientation.
- Source image is much larger than device memory can comfortably handle.
- Source image has a transparent background.
- Face is absent or multiple faces are detected.
- Crop frame cannot contain the requested area.
- File is technically an image but has an unsupported encoding.

## Signature

- User draws nothing.
- Signature is extremely thin.
- Signature touches canvas edges.
- Background is textured.
- Signature is nearly white on white paper.
- Uploaded signature contains large empty margins.

## File size

- Requested max is smaller than any reasonable output at exact dimensions.
- Requested min is impossible without artificially inflating the file.
- Browser encoder cannot produce a candidate under the limit.

## Camera

- Permission denied.
- Camera unavailable.
- Multiple cameras exist.
- Browser does not support requested constraints.
- Device orientation changes during capture.

## UX

- User navigates away during processing.
- Processing worker fails.
- User presses process multiple times.
- User starts a new job while an old job is finishing.
