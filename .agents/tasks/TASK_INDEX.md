# Task Index

| ID | Task | Dependency | Priority |
|---|---|---|---|
| T001 | Project foundation and application shell | None | P0 |
| T002 | Image processing primitives | T001 | P0 |
| T003 | Constraint-based file size optimizer | T002 | P0 |
| T004 | Photo upload, crop and export | T002, T003 | P0 |
| T005 | Guided camera capture | T004 | P1 |
| T006 | Signature upload and drawing | T002, T003 | P0 |
| T007 | Technical validation UI | T004, T006 | P0 |
| T008 | Form preset registry | T007 | P1 |
| T009 | PWA and privacy hardening | T004, T006 | P1 |
| T010 | Optional local intelligence | T005, T007 | P2 |
| T011 | Pre-release manual verification pass (V2 gate) | MVP complete | P0 |
| T012 | Camera framing guidance (V2) | T005 | P0 |
| T013 | Face detection and positioning assistance (V2) | T012 | P1 |
| T014 | Background quality detection and whitening (V2) | T004 | P1 |
| T015 | Auto-crop suggestion from detected face (V2) | T013, T004 | P2 |
| T016 | Preset fidelity: PNG scaling + signature presets (V2) | T003, T006 | P1 |
| T017 | Physical size (mm/DPI) requirement inputs (V2) | T004 | P2 |
| T018 | Worker offload of encode/optimize loop (V2) | T002, T003 | P2 |
| T019 | Verified-preset registry preparation (V2) | T008, T017, T018 | P1 |
| T020 | V2 manual verification pass (v0.2.0 gate) | T012–T019 | P0 |

## Recommended sequence

T001 → T002 → T003 → T004/T006 → T007 → T005 → T008 → T009 → T010 → T011

T004 and T006 can be developed independently after the shared processing primitives exist.

MVP (T001–T010) complete 2026-08-22 (T011 gate passed, `v0.1.0-mvp`); V2 complete — T012–T019 engineering items done and the T020 manual verification gate passed 2026-08-24 (`v0.2.0`). Remaining backlog: owner-verified official presets (pure data entry into `seedPresets.ts`).
