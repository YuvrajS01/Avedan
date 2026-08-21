import { useMemo, useState } from 'react'
import { useHashRoute } from '../../hooks/useHashRoute'
import {
  FORM_PRESETS,
  presetFreshness,
  requirementsFromPreset,
} from '../../domain/presets/registry'
import { describeRequirements } from '../../domain/requirements/profiles'

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
        Pick a form to prefill the photo and signature targets. Always confirm
        against the official source before submitting.
      </p>
      <label className="field search-field">
        <span>Search forms</span>
        <input
          type="search"
          value={query}
          placeholder="Search by name or authority"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="preset-list">
        {filtered.map((preset) => {
          const freshness = presetFreshness(preset)
          const photoSummary = requirementsFromPreset(preset, 'photo')
          const signatureSummary = requirementsFromPreset(preset, 'signature')
          return (
            <li key={preset.id}>
              <button
                type="button"
                className="card preset-card"
                onClick={() => navigate('photo', { presetId: preset.id })}
              >
                <span className="preset-head">
                  <span className="action-label">{preset.name}</span>
                  <span
                    className={
                      freshness === 'verified' ? 'badge badge-verified' : 'badge badge-stale'
                    }
                  >
                    {freshness === 'verified' ? 'Verified' : 'Needs re-verification'}
                  </span>
                </span>
                <span className="action-hint">{preset.authority}</span>
                {photoSummary && (
                  <span className="preset-line">Photo: {describeRequirements(photoSummary)}</span>
                )}
                {signatureSummary && (
                  <span className="preset-line">
                    Signature: {describeRequirements(signatureSummary)}
                  </span>
                )}
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
