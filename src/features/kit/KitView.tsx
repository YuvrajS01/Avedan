import { useMemo } from 'react'
import { useHashRoute } from '../../hooks/useHashRoute'
import { findFormPreset, presetFreshness, requirementsFromPreset } from '../../domain/presets/registry'
import { requiredAssetKinds, assetLabel } from '../../domain/presets/helpers'
import { describeRequirements } from '../../domain/requirements/profiles'

export function KitView() {
  const { presetId, navigate } = useHashRoute()

  const preset = useMemo(() => findFormPreset(presetId), [presetId])

  if (!preset) {
    return (
      <section className="view" aria-labelledby="kit-not-found">
        <h1 id="kit-not-found">Application kit</h1>
        <p className="lede">
          No preset selected. Pick a form from the Forms tab to see its application kit.
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => navigate('forms')}
        >
          Browse forms
        </button>
      </section>
    )
  }

  const freshness = presetFreshness(preset)
  const requiredKinds = requiredAssetKinds(preset)
  const routeForKind: Record<string, 'photo' | 'signature' | 'thumb'> = {
    photo: 'photo',
    signature: 'signature',
    thumbImpression: 'thumb',
  }

  return (
    <section className="view" aria-labelledby="kit-title">
      <h1 id="kit-title">Application kit</h1>
      <p className="lede">
        Everything this form requires — prepared on this device. Always confirm against the official source before
        submitting.
      </p>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-body">
          <div className="preset-head">
            <span className="preset-name">{preset.name}</span>
            <span className={freshness === 'verified' ? 'badge badge-verified' : 'badge badge-stale'}>
              {freshness === 'verified' ? 'Verified' : 'Needs re-verification'}
            </span>
          </div>
          <span className="action-hint">{preset.authority}</span>
          {preset.applicationYear && (
            <span className="preset-meta">Year / version: {preset.applicationYear}</span>
          )}
          {preset.description && <p className="profile-note">{preset.description}</p>}
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
          {freshness === 'stale' && (
            <p className="error-note" role="status">
              This preset was last verified over a year ago. Requirements may have changed — check the official
              source.
            </p>
          )}
          <p className="privacy-note" style={{ marginTop: '0.75rem' }}>
            Presets are technical references only — they do not guarantee that an authority will accept your file.
            Always confirm against the official portal/notification before submitting.
          </p>
        </div>
      </div>

      <h2 style={{ fontFamily: 'Fraunces Variable, serif', marginBottom: '0.75rem' }}>Required assets</h2>
      <ul className="preset-list">
        {requiredKinds.map((kind) => {
          const requirements = requirementsFromPreset(preset, kind)
          const label = assetLabel(kind)
          const summary = requirements ? describeRequirements(requirements) : 'No technical target'
          const route = routeForKind[kind]
          return (
            <li key={kind}>
              <div className="card preset-card">
                <div className="preset-main" style={{ cursor: 'default' }}>
                  <span className="preset-name">{label}</span>
                  <span className="preset-line">{summary}</span>
                  <span className="action-hint">Required for this application</span>
                </div>
                {route && (
                  <div className="preset-actions">
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => navigate(route, { presetId: preset.id })}
                    >
                      Prepare {label.toLowerCase()}
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="privacy-note" style={{ marginTop: '1rem' }}>
        Your images stay on this device while you prepare them — nothing is uploaded. Kit progress is session-local.
      </p>

      <div className="step-actions">
        <button type="button" className="button button-secondary" onClick={() => navigate('forms')}>
          Back to forms
        </button>
      </div>
    </section>
  )
}
