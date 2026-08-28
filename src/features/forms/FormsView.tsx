import { useMemo, useState } from 'react'
import { useHashRoute } from '../../hooks/useHashRoute'
import {
  FORM_PRESETS,
  presetFreshness,
  requirementsFromPreset,
} from '../../domain/presets/registry'
import { describeRequirements } from '../../domain/requirements/profiles'
import type { PresetAssetKind } from '../../domain/presets/schema'

const ASSET_LABEL: Record<PresetAssetKind, string> = {
  photo: 'Photo',
  signature: 'Signature',
  thumbImpression: 'Thumb impression',
}

const ASSET_KINDS: PresetAssetKind[] = ['photo', 'signature', 'thumbImpression']

export function FormsView() {
  const { navigate } = useHashRoute()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return FORM_PRESETS
    return FORM_PRESETS.filter((preset) =>
      [preset.name, preset.authority, preset.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [query])

  return (
    <section className="view" aria-labelledby="forms-title">
      <h1 id="forms-title">Form requirements</h1>
      <p className="lede">
        Pick a form to prefill the photo, signature and thumb-impression targets.
        Always confirm against the official source before submitting.
      </p>
      <label className="field search-field">
        <span>Search forms</span>
        <input
          type="search"
          className="search-input"
          value={query}
          placeholder="Search by name or authority"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="preset-list">
        {filtered.map((preset) => {
          const freshness = presetFreshness(preset)
          const signatureSummary = requirementsFromPreset(preset, 'signature')
          const thumbSummary = requirementsFromPreset(preset, 'thumbImpression')
          // Data-driven requirement lines (V3): iterate over present asset kinds
          const requirementLines = ASSET_KINDS.map((kind) => {
            const req = requirementsFromPreset(preset, kind)
            if (!req) return null
            return (
              <span key={kind} className="preset-line">
                {ASSET_LABEL[kind]}: {describeRequirements(req)}
              </span>
            )
          })
          return (
            <li key={preset.id}>
              <div className="card preset-card">
                <button
                  type="button"
                  className="preset-main"
                  onClick={() => navigate('photo', { presetId: preset.id })}
                >
                  <span className="preset-head">
                    <span className="preset-name">{preset.name}</span>
                    <span
                      className={
                        freshness === 'verified' ? 'badge badge-verified' : 'badge badge-stale'
                      }
                    >
                      {freshness === 'verified' ? 'Verified' : 'Needs re-verification'}
                    </span>
                  </span>
                  <span className="action-hint">{preset.authority}</span>
                  {requirementLines}
                  <span className="preset-meta">
                    Last verified {preset.lastVerified}
                    {preset.sourceUrl && (
                      <>
                        {' · '}
                        <a href={preset.sourceUrl} target="_blank" rel="noreferrer">
                          Official source
                        </a>
                      </>
                    )}
                  </span>
                </button>
                <div className="preset-actions">
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => navigate('kit', { presetId: preset.id })}
                  >
                    View kit
                  </button>
                  {signatureSummary && (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => navigate('signature', { presetId: preset.id })}
                    >
                      Prepare signature
                    </button>
                  )}
                  {thumbSummary && (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => navigate('thumb', { presetId: preset.id })}
                    >
                      Prepare thumb
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="placeholder-card card">No forms match your search.</li>
        )}
      </ul>
      <p className="privacy-note">
        Presets are technical references only — they do not guarantee that an
        authority will accept your file.
      </p>
    </section>
  )
}
