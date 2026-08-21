# Next Task

## Active task

**T005 — Guided camera capture**

See `tasks/T005-camera-capture.md`.

## Goal

Add first-class camera intake to the photo flow using `navigator.mediaDevices.getUserMedia()`: permission handling, unsupported-browser fallback, camera switching where supported, and capture from the video frame to the existing crop pipeline.

## Required output

- Camera button in the photo intake step where supported
- Permission prompt/denied states with actionable copy
- Fallback to upload when the API or device is unavailable
- Capture produces a source image entering the normal crop → optimize → validate flow
- No camera frames ever leave the device
- Tests for state machine logic; manual browser verification for live capture