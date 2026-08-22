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

## Recommended sequence

T001 → T002 → T003 → T004/T006 → T007 → T005 → T008 → T009 → T010 → T011

T004 and T006 can be developed independently after the shared processing primitives exist.

MVP (T001–T010) is complete as of 2026-08-22; T011 passed; V2 is underway (T012 done, T013 next).
