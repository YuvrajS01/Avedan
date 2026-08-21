import { useCallback, useMemo, useRef, useState } from 'react'
import {
  CUSTOM_PROFILE_ID,
  SIGNATURE_PROFILES,
  PROFILE_NOTE,
  describeRequirements,
  findSignatureProfile,
} from '../../domain/requirements/profiles'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { ProcessedAsset } from '../../domain/jobs/result'
import type { DrawableSource } from '../../processing/crop'
import { ProcessedResult } from '../../components/ProcessedResult'
import { DrawCanvas } from './DrawCanvas'
import {
  loadPhotoSource,
  type LoadedPhoto,
} from '../photo/processPhoto'
import { releaseSessionAssets } from '../../utils/session'
import { processSignature } from './processSignature'

type Step = 'choose' | 'draw' | 'preview' | 'result'

interface CustomSettings {
  maxKb: string
  format: ImageRequirements['format']
}

function toPositiveInt(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function resolveProfile(id: string, custom: CustomSettings): ImageRequirements {
  if (id !== CUSTOM_PROFILE_ID) {
    return findSignatureProfile(id) ?? SIGNATURE_PROFILES[0]
  }
  const maxBytes = toPositiveInt(custom.maxKb)
  return {
    id: CUSTOM_PROFILE_ID,
    label: 'Custom',
    format: custom.format,
    fileSize: maxBytes !== undefined ? { maxBytes: maxBytes * 1024 } : undefined,
  }
}

export function SignatureView() {
  const [step, setStep] = useState<Step>('choose')
  const [profileId, setProfileId] = useState(SIGNATURE_PROFILES[0].id)
  const [custom, setCustom] = useState<CustomSettings>({ maxKb: '', format: 'png' })
  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null)
  const [result, setResult] = useState<ProcessedAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profile = useMemo(() => resolveProfile(profileId, custom), [profileId, custom])
  const summary = describeRequirements(profile)

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
      setLoaded(next)
      setStep('preview')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This image could not be opened.')
    } finally {
      setBusy(false)
    }
  }

  const finishDraw = async (canvas: HTMLCanvasElement) => {
    setBusy(true)
    setError(null)
    try {
      const processed = await processSignature({
        source: canvas as unknown as DrawableSource,
        profile,
        fileName: 'signature',
      })
      setResult(processed)
      setStep('result')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The signature could not be processed.')
    } finally {
      setBusy(false)
    }
  }

  const processUploaded = async () => {
    if (!loaded) return
    setBusy(true)
    setError(null)
    try {
      const processed = await processSignature({
        source: loaded.source,
        profile,
        fileName: loaded.fileName,
      })
      setResult(processed)
      setStep('result')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The signature could not be processed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="profile-picker">
        <label className="field">
          <span>Target requirements</span>
          <select
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            disabled={step === 'result'}
          >
            {SIGNATURE_PROFILES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            <option value={CUSTOM_PROFILE_ID}>Custom…</option>
          </select>
        </label>
        {profileId === CUSTOM_PROFILE_ID && step !== 'result' && (
          <div className="custom-fields">
            <label className="field">
              <span>Max size (KB)</span>
              <input
                type="number"
                min={0}
                value={custom.maxKb}
                placeholder="none"
                onChange={(event) => setCustom({ ...custom, maxKb: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Format</span>
              <select
                value={custom.format}
                onChange={(event) =>
                  setCustom({ ...custom, format: event.target.value as CustomSettings['format'] })
                }
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
          </div>
        )}
        <p className="target-summary">
          Target: <strong>{summary}</strong>
        </p>
        <p className="profile-note">{PROFILE_NOTE}</p>
      </div>

      {step === 'choose' && (
        <section className="view" aria-labelledby="signature-title">
          <h1 id="signature-title">Prepare a signature</h1>
          <ul className="action-grid">
            <li>
              <button
                type="button"
                className="card action-card"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="action-label">Upload signature</span>
                <span className="action-hint">Use a photo of a signed paper</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="card action-card"
                onClick={() => setStep('draw')}
              >
                <span className="action-label">Draw signature</span>
                <span className="action-hint">Sign with finger, stylus or mouse</span>
              </button>
            </li>
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Upload signature image"
            className="visually-hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {busy && (
            <p className="busy-note" role="status">
              Opening your signature…
            </p>
          )}
          {error && (
            <p className="error-note" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {step === 'draw' && (
        <section className="view" aria-labelledby="draw-title">
          <h1 id="draw-title">Draw your signature</h1>
          <DrawCanvas onFinish={finishDraw} onCancel={() => setStep('choose')} />
          {busy && (
            <p className="busy-note" role="status">
              Processing your signature…
            </p>
          )}
          {error && (
            <p className="error-note" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {step === 'preview' && loaded && (
        <section className="view" aria-labelledby="preview-title">
          <h1 id="preview-title">Check your signature</h1>
          <p className="lede">
            Empty margins will be trimmed automatically. Target:{' '}
            <strong>{summary}</strong>
          </p>
          <img
            className="result-preview"
            src={loaded.previewUrl}
            alt="Uploaded signature preview"
          />
          {busy && (
            <p className="busy-note" role="status">
              Processing your signature…
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
        <ProcessedResult result={result} summary={summary} noun="signature" onReset={reset} />
      )}
    </>
  )
}
