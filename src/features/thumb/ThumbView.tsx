import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  THUMB_PROFILES,
  PROFILE_NOTE,
  describeRequirements,
  findThumbProfile,
} from '../../domain/requirements/profiles'
import { findFormPreset, requirementsFromPreset } from '../../domain/presets/registry'
import { useHashRoute } from '../../hooks/useHashRoute'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset } from '../../domain/jobs/result'
import type { DrawableSource } from '../../processing/crop'
import { ProcessedResult } from '../../components/ProcessedResult'
import {
  loadPhotoSource,
  revokeObjectUrl,
  type LoadedPhoto,
} from '../photo/processPhoto'
import { trimToCanvas } from '../../processing/trim'
import { encodeCanvas } from '../../processing/encode'
import type { EncodableCanvas } from '../../processing/optimize'
import { releaseSessionAssets } from '../../utils/session'
import { processThumb } from './processThumb'
import { setKitAsset } from '../../domain/kit/store'

type Step = 'choose' | 'preview' | 'result'

interface CustomSettings {
  width: string
  height: string
  minKb: string
  maxKb: string
  format: ImageRequirements['format']
}

const DEFAULT_CUSTOM: CustomSettings = {
  width: '240',
  height: '240',
  minKb: '',
  maxKb: '30',
  format: 'jpeg',
}

function toPositiveInt(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function profileFromCustom(custom: CustomSettings): ImageRequirements {
  const width = toPositiveInt(custom.width)
  const height = toPositiveInt(custom.height)
  const dimensions =
    width !== undefined && height !== undefined ? { width, height } : undefined
  const maxBytes = toPositiveInt(custom.maxKb)
  const minBytes = toPositiveInt(custom.minKb)
  const fileSize =
    minBytes !== undefined || maxBytes !== undefined
      ? {
          ...(minBytes !== undefined ? { minBytes: minBytes * 1024 } : {}),
          ...(maxBytes !== undefined ? { maxBytes: maxBytes * 1024 } : {}),
        }
      : undefined
  return {
    id: 'manual',
    label: 'Manual',
    dimensions,
    aspectRatio: width !== undefined && height !== undefined ? width / height : 1,
    format: custom.format,
    fileSize,
  }
}

export function ThumbView() {
  const { presetId, navigate } = useHashRoute()
  const [step, setStep] = useState<Step>('choose')
  const [custom, setCustom] = useState<CustomSettings>(DEFAULT_CUSTOM)
  const [presetSelect, setPresetSelect] = useState('')
  const [manualEdited, setManualEdited] = useState(false)
  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null)
  const [result, setResult] = useState<ProcessedAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activePreset = useMemo(() => findFormPreset(presetId), [presetId])
  const presetProfile = useMemo(
    () => (activePreset ? requirementsFromPreset(activePreset, 'thumbImpression') : undefined),
    [activePreset],
  )
  const profile = useMemo(
    () => (presetProfile && !manualEdited ? presetProfile : profileFromCustom(custom)),
    [presetProfile, manualEdited, custom],
  )
  const summary = describeRequirements(profile)

  const updateCustom = useCallback((patch: Partial<CustomSettings>) => {
    setManualEdited(true)
    setCustom((current) => ({ ...current, ...patch }))
  }, [])

  // Autofill manual fields from a Forms preset; edits take precedence (D035 pattern).
  useEffect(() => {
    if (!presetProfile) return
    setManualEdited(false)
    setCustom({
      width: presetProfile.dimensions ? String(presetProfile.dimensions.width) : '',
      height: presetProfile.dimensions ? String(presetProfile.dimensions.height) : '',
      minKb: presetProfile.fileSize?.minBytes
        ? String(Math.round(presetProfile.fileSize.minBytes / 1024))
        : '',
      maxKb: presetProfile.fileSize?.maxBytes
        ? String(Math.round(presetProfile.fileSize.maxBytes / 1024))
        : '',
      format: presetProfile.format ?? 'jpeg',
    })
  }, [presetProfile])

  const reset = useCallback(() => {
    releaseSessionAssets({ loaded, result })
    setLoaded(null)
    setResult(null)
    setBusy(false)
    setError(null)
    setStep('choose')
  }, [loaded, result])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const next = await loadPhotoSource(file)
      let previewUrl = next.previewUrl
      try {
        const trimmed = trimToCanvas(next.source)
        const blob = await encodeCanvas(
          trimmed as unknown as EncodableCanvas,
          'png',
          0.92,
        )
        if (typeof URL.createObjectURL === 'function') {
          previewUrl = URL.createObjectURL(blob)
          revokeObjectUrl(next.previewUrl)
        }
      } catch {
        // fall back to the raw preview
      }
      setLoaded({ ...next, previewUrl })
      setStep('preview')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This image could not be opened.')
    } finally {
      setBusy(false)
    }
  }

  const processUploaded = async () => {
    if (!loaded) return
    setBusy(true)
    setError(null)
    try {
      const processed = await processThumb({
        source: loaded.source as unknown as DrawableSource,
        profile,
        fileName: loaded.fileName,
      })
      if (presetId) {
        setKitAsset(presetId, 'thumbImpression', {
          blob: processed.blob,
          fileName: processed.fileName,
          sizeBytes: processed.sizeBytes,
        })
      }
      setResult(processed)
      setStep('result')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The thumb impression could not be processed.')
    } finally {
      setBusy(false)
    }
  }

  const handlePresetSelect = (id: string) => {
    setPresetSelect(id)
    if (!id) return
    const p = findThumbProfile(id)
    if (!p) return
    setManualEdited(false)
    setCustom({
      width: p.dimensions ? String(p.dimensions.width) : '',
      height: p.dimensions ? String(p.dimensions.height) : '',
      minKb: p.fileSize?.minBytes ? String(Math.round(p.fileSize.minBytes / 1024)) : '',
      maxKb: p.fileSize?.maxBytes ? String(Math.round(p.fileSize.maxBytes / 1024)) : '',
      format: p.format ?? 'jpeg',
    })
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const requirementsPanel = (
    <div className="requirements-panel panel">
      <div className="panel-body">
        <label className="field">
          <span>Load preset</span>
          <select
            aria-label="Load preset"
            value={presetSelect}
            onChange={(event) => handlePresetSelect(event.target.value)}
          >
            <option value="">— Choose a preset to autofill —</option>
            {THUMB_PROFILES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="custom-fields">
          <label className="field">
            <span>Width (px)</span>
            <input
              type="number"
              min={1}
              value={custom.width}
              onChange={(event) => updateCustom({ width: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Height (px)</span>
            <input
              type="number"
              min={1}
              value={custom.height}
              onChange={(event) => updateCustom({ height: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Min size (KB)</span>
            <input
              type="number"
              min={0}
              value={custom.minKb}
              placeholder="none"
              onChange={(event) => updateCustom({ minKb: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Max size (KB)</span>
            <input
              type="number"
              min={0}
              value={custom.maxKb}
              placeholder="none"
              onChange={(event) => updateCustom({ maxKb: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Format</span>
            <select
              value={custom.format}
              onChange={(event) =>
                updateCustom({ format: event.target.value as CustomSettings['format'] })
              }
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>
        <p className="target-summary">
          Target: <strong>{summary}</strong>
        </p>
        <p className="profile-note">{PROFILE_NOTE}</p>
      </div>
    </div>
  )

  return (
    <>
      {step === 'choose' && (
        <section className="view" aria-labelledby="thumb-title">
          <h1 id="thumb-title">Prepare a thumb impression</h1>
          <p className="lede">
            Upload a clear scan or photo of your thumb impression on white paper. Ink should be dark and the impression well-inked.
          </p>
          {activePreset && (
            <div className="preset-context">
              <p>
                Form preset: <strong>{activePreset.name}</strong> · {activePreset.authority}
              </p>
              <p className="profile-note">
                Last verified {activePreset.lastVerified}
                {activePreset.sourceUrl && (
                  <>
                    {' · '}
                    <a href={activePreset.sourceUrl} target="_blank" rel="noreferrer">
                      Official source
                    </a>
                  </>
                )}{' '}
                — always confirm against the official source.
              </p>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => navigate('thumb')}
              >
                Use generic settings instead
              </button>
            </div>
          )}
          {requirementsPanel}
          <div
            className="intake-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <p className="intake-title">Drop your thumb impression here</p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload thumb impression
            </button>
            <p className="intake-alt">or drag and drop an image here</p>
            <p className="option-hint">JPG, PNG or WebP — white paper, dark ink</p>
          </div>
          <ul className="option-grid" style={{ marginTop: '1rem' }}>
            <li>
              <button
                type="button"
                className="card option-card"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="option-label">Choose file</span>
                <span className="option-hint">Use a scanned thumb print on white paper</span>
              </button>
            </li>
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Upload thumb impression image"
            className="visually-hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {busy && (
            <p className="busy-note" role="status">
              <span className="spinner" aria-hidden="true" />
              Opening your thumb impression…
            </p>
          )}
          {error && (
            <p className="error-note" role="alert">
              {error}
            </p>
          )}
          <p className="privacy-note">
            Your thumb image stays on this device while you process it — nothing is uploaded.
          </p>
        </section>
      )}

      {step === 'preview' && loaded && (
        <section className="view" aria-labelledby="preview-title">
          <h1 id="preview-title">Check your thumb impression</h1>
          <p className="lede">
            Empty margins are trimmed automatically — this is what your thumb impression will look like. Target:{' '}
            <strong>{summary}</strong>
          </p>
          <div className="result-figure" style={{ marginInline: 'auto' }}>
            <img
              className="result-preview"
              src={loaded.previewUrl}
              alt="Uploaded thumb impression preview"
            />
          </div>
          {busy && (
            <p className="busy-note" role="status">
              <span className="spinner" aria-hidden="true" />
              Processing your thumb impression…
            </p>
          )}
          {error && (
            <p className="error-note" role="alert">
              {error}
            </p>
          )}
          <div className="step-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={reset}
              disabled={busy}
            >
              Back
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={processUploaded}
              disabled={busy}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 'result' && result && (
        <ProcessedResult
          result={result}
          summary={summary}
          noun="thumb impression"
          onReset={reset}
          preset={activePreset ?? undefined}
        />
      )}
    </>
  )
}
