import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
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
import { dimensionsFromPhysical } from '../../processing/geometry'
import { releaseSessionAssets } from '../../utils/session'
import { isCameraSupported } from '../camera/camera'
import type { NormalizedFace } from './cropMath'
import { CameraStep } from '../camera/CameraStep'
import { setKitAsset } from '../../domain/kit/store'

type Step = 'intake' | 'camera' | 'crop' | 'result'

interface CustomSettings {
  width: string
  height: string
  minKb: string
  maxKb: string
  format: ImageRequirements['format']
  whiteBg: boolean
  /** Optional physical size (T017); pixels are derived from these. */
  physWidth: string
  physHeight: string
  unit: 'mm' | 'cm'
  dpi: string
}

const DEFAULT_CUSTOM: CustomSettings = {
  width: '300',
  height: '400',
  minKb: '',
  maxKb: '',
  format: 'jpeg',
  whiteBg: false,
  physWidth: '',
  physHeight: '',
  unit: 'mm',
  dpi: '300',
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
    aspectRatio: width !== undefined && height !== undefined ? width / height : 3 / 4,
    format: custom.format,
    fileSize,
    background: custom.whiteBg ? 'white' : undefined,
  }
}

export function PhotoView() {
  const { presetId, navigate } = useHashRoute()
  const [step, setStep] = useState<Step>('intake')
  const [custom, setCustom] = useState<CustomSettings>(DEFAULT_CUSTOM)
  const [presetSelect, setPresetSelect] = useState('')
  const [manualEdited, setManualEdited] = useState(false)
  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null)
  const [capturedFace, setCapturedFace] = useState<NormalizedFace | null>(null)
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
    () => (presetProfile && !manualEdited ? presetProfile : profileFromCustom(custom)),
    [presetProfile, manualEdited, custom],
  )
  const summary = describeRequirements(profile)

  const updateCustom = useCallback((patch: Partial<CustomSettings>) => {
    setManualEdited(true)
    setCustom((current) => ({ ...current, ...patch }))
  }, [])

  // T017: physical size -> pixel dimensions via the tested engine math.
  const physical = useMemo(() => {
    const w = Number(custom.physWidth)
    const h = Number(custom.physHeight)
    const dpi = Number(custom.dpi)
    if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(dpi)) return null
    if (w <= 0 || h <= 0 || dpi <= 0) return null
    const mmPerUnit = custom.unit === 'cm' ? 10 : 1
    try {
      return dimensionsFromPhysical(
        { widthMm: w * mmPerUnit, heightMm: h * mmPerUnit },
        dpi,
      )
    } catch {
      return null
    }
  }, [custom.physWidth, custom.physHeight, custom.unit, custom.dpi])

  // Derived pixels fill the editable width/height fields (T017).
  useEffect(() => {
    if (!physical) return
    setCustom((current) =>
      current.width === String(physical.width) && current.height === String(physical.height)
        ? current
        : { ...current, width: String(physical.width), height: String(physical.height) },
    )
  }, [physical])

  // When navigating from Forms with a preset, autofill the manual fields for editing
  useEffect(() => {
    if (!presetProfile) return
    setManualEdited(false)
    // T019: presets may carry physical size and background preferences;
    // they prefill like pixels/format/file-size and stay editable.
    const physMm = presetProfile.physicalSizeMm
    const dpi = toPositiveInt(String(presetProfile.dpi ?? NaN))
    setCustom({
      width: presetProfile.dimensions ? String(presetProfile.dimensions.width) : DEFAULT_CUSTOM.width,
      height: presetProfile.dimensions ? String(presetProfile.dimensions.height) : DEFAULT_CUSTOM.height,
      minKb: presetProfile.fileSize?.minBytes
        ? String(Math.round(presetProfile.fileSize.minBytes / 1024))
        : '',
      maxKb: presetProfile.fileSize?.maxBytes
        ? String(Math.round(presetProfile.fileSize.maxBytes / 1024))
        : '',
      format: presetProfile.format ?? 'jpeg',
      whiteBg: presetProfile.background === 'white',
      physWidth: physMm ? String(physMm.width) : '',
      physHeight: physMm ? String(physMm.height) : '',
      unit: 'mm',
      dpi: dpi !== undefined ? String(dpi) : DEFAULT_CUSTOM.dpi,
    })
  }, [presetProfile])

  const reset = useCallback(() => {
    releaseSessionAssets({ loaded, result })
    setLoaded(null)
    setCapturedFace(null)
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

  const handleFile = async (file: File, normalizedFace?: NormalizedFace) => {
    setBusy(true)
    setError(null)
    try {
      const next = await loadPhotoSource(file)
      setCapturedFace(normalizedFace ?? null)
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
      if (presetId) {
        setKitAsset(presetId, 'photo', {
          blob: processed.blob,
          fileName: processed.fileName,
          sizeBytes: processed.sizeBytes,
        })
      }
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

  const handlePresetSelect = (id: string) => {
    setPresetSelect(id)
    if (!id) return
    const p = findProfile(id)
    if (!p) return
    setManualEdited(false)
    const physMm = p.physicalSizeMm
    setCustom({
      width: p.dimensions ? String(p.dimensions.width) : '',
      height: p.dimensions ? String(p.dimensions.height) : '',
      minKb: p.fileSize?.minBytes ? String(Math.round(p.fileSize.minBytes / 1024)) : '',
      maxKb: p.fileSize?.maxBytes ? String(Math.round(p.fileSize.maxBytes / 1024)) : '',
      format: p.format ?? 'jpeg',
      whiteBg: p.background === 'white',
      physWidth: physMm ? String(physMm.width) : '',
      physHeight: physMm ? String(physMm.height) : '',
      unit: 'mm',
      dpi: p.dpi !== undefined ? String(p.dpi) : '300',
    })
  }

  const requirementsPanel = (
    <div className="requirements-panel panel">
      <div className="panel-body">
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
              onClick={() => navigate('photo')}
              style={{ marginTop: '0.75rem' }}
            >
              Use generic settings instead
            </button>
          </div>
        )}
        <label className="field">
          <span>Load preset</span>
          <select
            aria-label="Load preset"
            value={presetSelect}
            onChange={(event) => handlePresetSelect(event.target.value)}
          >
            <option value="">— Choose a preset to autofill —</option>
            {PHOTO_PROFILES.map((option) => (
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
        <details className="advanced-fields">
          <summary>Physical size (advanced)</summary>
          <div className="custom-fields">
            <label className="field">
              <span>Unit</span>
              <select
                value={custom.unit}
                onChange={(event) =>
                  updateCustom({ unit: event.target.value as CustomSettings['unit'] })
                }
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </label>
            <label className="field">
              <span>DPI</span>
              <input
                type="number"
                min={1}
                value={custom.dpi}
                onChange={(event) => updateCustom({ dpi: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Physical width</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={custom.physWidth}
                placeholder="—"
                onChange={(event) => updateCustom({ physWidth: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Physical height</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={custom.physHeight}
                placeholder="—"
                onChange={(event) => updateCustom({ physHeight: event.target.value })}
              />
            </label>
          </div>
          {physical && (
            <p className="profile-note">
              Derived {physical.width} × {physical.height} px from{' '}
              {custom.physWidth} × {custom.physHeight} {custom.unit} at {custom.dpi} DPI.
              Pixels are editable afterwards.
            </p>
          )}
        </details>
        <label className="check-field">
          <input
            type="checkbox"
            checked={custom.whiteBg}
            onChange={(event) => updateCustom({ whiteBg: event.target.checked })}
          />
          <span>Lighten a plain background to white (best effort)</span>
        </label>
        <p className="target-summary">
          Target: <strong>{summary}</strong>
        </p>
        <p className="profile-note">{PROFILE_NOTE}</p>
      </div>
    </div>
  )

  return (
    <>
      {step === 'intake' && (
        <IntakeStep
          busy={busy}
          error={error}
          cameraAvailable={cameraAvailable}
          onFile={handleFile}
          onCamera={() => setStep('camera')}
        >
          {requirementsPanel}
        </IntakeStep>
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
          faceRect={capturedFace ?? undefined}
          summary={summary}
          busy={busy}
          error={error}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}
      {step === 'result' && result && (
        <ProcessedResult
          result={result}
          summary={summary}
          noun="photo"
          onReset={reset}
          preset={activePreset ?? undefined}
        />
      )}
    </>
  )
}
