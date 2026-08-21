# Next Task

## Active task

**T009 — PWA and privacy hardening**

See `tasks/T009-pwa-privacy.md`.

## Goal

Make the app installable/offline-capable and tighten privacy guarantees: service worker for static assets, web app manifest, EXIF/metadata stripping on export where practical, session reset that releases image data, and clear privacy messaging.

## Required output

- Web app manifest + icons
- Service worker caching static shell assets (no image data persisted)
- Metadata stripping on export where practical
- Reset/reload releases object URLs and in-memory sources
- Privacy messaging reviewed against PRIVACY spec
- P0 flows still fully functional offline after first load