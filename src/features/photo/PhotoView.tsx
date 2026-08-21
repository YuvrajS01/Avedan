import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CUSTOM_PROFILE_ID,
  PHOTO_PROFILES,
  PROFILE_NOTE,
  describeRequirements,
  findProfile,
} from '../../domain/requirements/profiles'
import { findFormPreset, requirementsFromPreset } from '../../domain/presets/registry'
import type { ImageRequirements } from '../../domain/requirements/types'
import { useHashRoute } from '../../hooks/useHashRoute'
import { IntakeStep } from './IntakeStep'
import { CropStep } from './CropStep'
import { ProcessedResult } from '../../components/ProcessedResult'
import { loadPhotoSource, processPhoto, type LoadedPhoto, type ProcessedPhoto } from './processPhoto'
import { releaseSessionAssets } from '../../utils/session'
import { isCameraSupported } from '../camera/camera'
import { CameraStep } from '../camera/CameraStep'

type Step = 'intake' | 'camera' | 'crop' | 'result'

interface CustomSettings {
  width: string
  height: string
  maxKb: string
  format: ImageRequirements['format']
}

const DEFAULT_CUSTOM: CustomSettings = {
  width: '300',
  height: '400',
  maxKb: '',
  format: 'jpeg',
}

function toPositiveInt(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function resolveProfile(id: string, custom: CustomSettings): ImageRequirements {
  if (id !== CUSTOM_PROFILE_ID) {
    return findProfile(id) ?? PHOTO_PROFILES[0]
  }
  const width = toPositiveInt(custom.width)
  const height = toPositiveInt(custom.height)
  const dimensions =
    width !== undefined && height !== undefined ? { width, height } : undefined
  const maxBytes = toPositiveInt(custom.maxKb)

  return {
    id: CUSTOM_PROFILE_ID,
    label: 'Custom',
    dimensions,
    aspectRatio: width !== undefined && height !== undefined ? width / height : 3 / 4,
    format: custom.format,
    fileSize: maxBytes !== undefined ? { maxBytes: maxBytes * 1024 } : undefined,
  }
}

export function PhotoView() {
  const { presetId, navigate } = useHashRoute()
  const [step, setStep] = useState<Step>('intake')
  const [profileId, setProfileId] = useState(PHOTO_PROFILES[0].id)
  const [custom, setCustom] = useState<CustomSettings>(DEFAULT_CUSTOM)
  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null)
  const [result, setResult] = useState<ProcessedPhoto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraAvailable] = useState(() => isCameraSupported())

  const loadedRef = useRef<LoadedPhoto | null>(null)
  const resultRef = useRef<ProcessedPhoto | null>(null)
  loadedRef.current = loaded
  resultRef.current = result

  const activePreset = useMemo(() => findFormPreset(presetId), [presetId])
  const presetProfile = useMemo(
    () => (activePreset ? requirementsFromPreset(activePreset, 'photo') : undefined),
    [activePreset],
  )
  const profile = useMemo(
    () => presetProfile ?? resolveProfile(profileId, custom),
    [presetProfile, profileId, custom],
  )
  const summary = describeRequirements(profile)

  const reset = useCallback(() => {
    releaseSessionAssets({ loaded, result })
    setLoaded(null)
    setResult(null)
    setBusy(false)
    setError(null)
    setStep('intake')
  }, [loaded, result])

  useEffect(() => {
    return () => {
      releaseSessionAssets({
        loaded: loadedRef.current,
        result: resultRef.current,
      })
    }
  }, [])

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const next = await loadPhotoSource(file)
      setLoaded(next)
      setStep('crop')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This photo could not be opened.')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async (rect: { x: number; y: number; width: number; height: number }) => {
    if (!loaded) return
    setBusy(true)
    setError(null)
    try {
      const processed = await processPhoto({
        source: loaded.source,
        cropRect: rect,
        profile,
        fileName: loaded.fileName,
      })
      setResult(processed)
      setStep('result')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'This photo could not be processed with the selected settings.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {activePreset ? (
        <div className="profile-picker">
          <p className="target-summary">
            Form preset: <strong>{activePreset.name}</strong> · {activePreset.authority}
          </p>
          <p className="target-summary">
            Target: <strong>{summary}</strong>
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
            className="button button-secondary"
            onClick={() => navigate('photo')}
          >
            Use generic settings instead
          </button>
        </div>
      ) : (
      <div className="profile-picker">
        <label className="field">
          <span>Target requirements</span>
          <select
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            disabled={step === 'crop' || step === 'result'}
          >
            {PHOTO_PROFILES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            <option value={CUSTOM_PROFILE_ID}>Custom…</option>
          </select>
        </label>
        {profileId === CUSTOM_PROFILE_ID && step === 'intake' && (
          <div className="custom-fields">
            <label className="field">
              <span>Width (px)</span>
              <input
                type="number"
                min={1}
                value={custom.width}
                onChange={(event) => setCustom({ ...custom, width: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Height (px)</span>
              <input
                type="number"
                min={1}
                value={custom.height}
                onChange={(event) => setCustom({ ...custom, height: event.target.value })}
              />
            </label>
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
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
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
      )}

      {step === 'intake' && (
        <IntakeStep
          busy={busy}
          error={error}
          cameraAvailable={cameraAvailable}
          onFile={handleFile}
          onCamera={() => setStep('camera')}
        />
      )}
      {step === 'camera' && (
        <CameraStep onCaptured={handleFile} onUseUpload={() => setStep('intake')} />
      )}
      {step === 'crop' && loaded && (
        <CropStep
          imageUrl={loaded.previewUrl}
          imageWidth={loaded.source.width}
          imageHeight={loaded.source.height}
          aspectRatio={profile.aspectRatio ?? 3 / 4}
          summary={summary}
          busy={busy}
          error={error}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}
      {step === 'result' && result && (
        <ProcessedResult result={result} summary={summary} noun="photo" onReset={reset} />
      )}
    </>
  )
}
