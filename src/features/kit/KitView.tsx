import { useEffect, useMemo, useState } from 'react'
import { useHashRoute } from '../../hooks/useHashRoute'
import { findFormPreset, presetFreshness, requirementsFromPreset } from '../../domain/presets/registry'
import { requiredAssetKinds, assetLabel } from '../../domain/presets/helpers'
import { describeRequirements } from '../../domain/requirements/profiles'
import { getKitAsset } from '../../domain/kit/store'
import { blobToUint8Array, createZipBlob } from '../../utils/zip'

export function KitView() {
  const { presetId, navigate } = useHashRoute()
  const [zipUrl, setZipUrl] = useState<string | null>(null)
  const [zipName, setZipName] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preset = useMemo(() => findFormPreset(presetId), [presetId])

  // Revoke ZIP URLs when replaced or on unmount (privacy + memory, T025).
  useEffect(() => {
    return () => {
      if (zipUrl && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(zipUrl)
      }
    }
  }, [zipUrl])

  const handleDownloadKit = async () => {
    if (!preset) return
    const kinds = requiredAssetKinds(preset)
    const entries: { name: string; data: Uint8Array }[] = []
    for (const kind of kinds) {
      const asset = getKitAsset(preset.id, kind)
      if (asset) {
        const data = await blobToUint8Array(asset.blob)
        // File name already carries -avedan.{ext}; keep it as-is for the ZIP.
        entries.push({ name: asset.fileName, data })
      }
    }
    if (entries.length === 0) {
      setError('No prepared assets yet — prepare each file first, then download the kit.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const zipBlob = createZipBlob(entries, new Date())
      const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(zipBlob) : ''
      if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
      setZipUrl(url)
      setZipName(`${preset.id}-kit.zip`)
      // Trigger download imperatively for better UX (link also rendered below).
      if (url) {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${preset.id}-kit.zip`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The kit could not be packaged.')
    } finally {
      setBusy(false)
    }
  }

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
  const preparedCount = requiredKinds.filter((kind) => getKitAsset(preset.id, kind)).length

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
      <p className="profile-note">
        {preparedCount} of {requiredKinds.length} prepared in this session — prepare each file, then download the kit below.
      </p>
      <ul className="preset-list">
        {requiredKinds.map((kind) => {
          const requirements = requirementsFromPreset(preset, kind)
          const label = assetLabel(kind)
          const summary = requirements ? describeRequirements(requirements) : 'No technical target'
          const route = routeForKind[kind]
          const asset = getKitAsset(preset.id, kind)
          const onDownloadSingle = () => {
            if (!asset) return
            const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(asset.blob) : ''
            if (!url) return
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = asset.fileName
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }
          return (
            <li key={kind}>
              <div className="card preset-card">
                <div className="preset-main" style={{ cursor: 'default' }}>
                  <span className="preset-name">{label}</span>
                  <span className="preset-line">{summary}</span>
                  {asset ? (
                    <span className="preset-line" style={{ color: 'var(--accent)' }}>
                      Prepared — {asset.fileName} · {(asset.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  ) : (
                    <span className="action-hint">Not yet prepared in this session</span>
                  )}
                </div>
                <div className="preset-actions">
                  {route && (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => navigate(route, { presetId: preset.id })}
                    >
                      Prepare {label.toLowerCase()}
                    </button>
                  )}
                  {asset && (
                    <button type="button" className="button button-ghost" onClick={onDownloadSingle}>
                      Download {label.toLowerCase()}
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="card" style={{ marginTop: '1.25rem', padding: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Download kit</h3>
        <p className="profile-note">
          Packages all prepared files for <strong>{preset.name}</strong> into one ZIP — entirely in this browser, no
          upload. If you prefer, download each file individually above.
        </p>
        <div className="step-actions" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={handleDownloadKit}
            disabled={busy || preparedCount === 0}
          >
            {busy ? 'Packaging…' : `Download kit ZIP${preparedCount ? ` (${preparedCount} files)` : ''}`}
          </button>
          {zipUrl && (
            <a className="button button-ghost" href={zipUrl} download={zipName}>
              Re-download ZIP
            </a>
          )}
        </div>
        {error && (
          <p className="error-note" role="alert" style={{ marginTop: '0.75rem' }}>
            {error}
          </p>
        )}
        <p className="privacy-note" style={{ marginTop: '0.75rem' }}>
          ZIP is built with STORE (no recompression) from your already-compressed files — small and fast. Filenames
          inside the ZIP match your downloads.
        </p>
      </div>

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
