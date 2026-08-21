# T008 — Form Preset Registry

Status: DONE

## Objective

Introduce data-driven form presets and search/select UX.

## Acceptance criteria

- [x] Presets validate against the typed schema.
- [x] Presets display source and last-verified date.
- [x] Selecting a preset produces `ImageRequirements` for each asset type.
- [x] UI can distinguish verified and stale/unverified entries.
- [x] No preset is described as guaranteeing official acceptance.

## Implementation notes

- `src/domain/presets/schema.ts`: typed `FormPreset`/`PresetRequirements` per REQUIREMENTS_SCHEMA (format, aspectRatio, pixelSize, physicalSizeMm, dpi, fileSizeBytes min/max/target, background) plus `validateFormPreset` runtime validation with precise field-level errors (enum checks, positive ints, ISO date, http(s) URL, min ≤ max, at least one asset kind).
- `src/domain/presets/registry.ts`: seed registry validated at load time (invalid or duplicate ids throw). Entries are clearly-labeled illustrative templates with authority, source URL and last-verified date — real entries must be manually verified before being added (DECISIONS D019). Includes `presetFreshness` (>12 months → stale) and `requirementsFromPreset` mapping into the engine's `ImageRequirements`.
- Routing: hash now supports a `preset` query param (`#/photo?preset=id`) via `parseHash`; `useHashRoute` exposes `presetId` and typed navigation.
- `FormsView`: search filter, preset cards with photo/signature constraint summaries, Verified / "Needs re-verification" badges, last-verified date, official-source link, and explicit no-guarantee disclaimer.
- Photo flow: when a preset id is present, requirements come from the preset with an attribution banner (name, authority, verification date, source link) and an escape hatch to generic settings.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 150 tests pass (19 new): schema acceptance/rejection matrix, registry integrity (validity, unique ids, metadata presence), freshness classification, requirement mapping, hash query parsing/round-trip, FormsView rendering/badges/search/navigation/no-guarantee language, and PhotoView preset-driven targets
- `npm run build` — succeeds

## Known limitations

- Seed presets are illustrative only; populating real exam/recruitment presets requires manual verification workflow ownership (per D003).
- Preset selection currently feeds the photo flow; signature-flow preset wiring can reuse `requirementsFromPreset(preset, 'signature')` when the signature flow gains profile selection.
