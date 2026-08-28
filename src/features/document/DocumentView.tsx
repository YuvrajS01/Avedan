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
import { loadPhotoSource, type LoadedPhoto } from '../photo/processPhoto'
import { dimensionsFromPhysical } from '../../processing/geometry'
import { ProcessedResult } from '../../components/ProcessedResult'
import { releaseSessionAssets } from '../../utils/session'
import { defaultQuadForImage, clampQuad, type Quad } from '../../processing/perspective'
import { processDocument } from './processDocument'

type Step = 'intake' | 'adjust' | 'result'

interface CustomSettings {
  width: string
  height: string
  minKb: string
  maxKb: string
  format: ImageRequirements['format']
  physWidth: string
  physHeight: string
  unit: 'mm' | 'cm'
  dpi: string
}

const DEFAULT_CUSTOM: CustomSettings = {
  width: '800',
  height: '1100',
  minKb: '',
  maxKb: '',
  format: 'jpeg',
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
    aspectRatio: width !== undefined && height !== undefined ? width / height : 800 / 1100,
    format: custom.format,
    fileSize,
  }
}

export function DocumentView() {
  const { presetId, navigate } = useHashRoute()
  const [step, setStep] = useState<Step>('intake')
  const [custom, setCustom] = useState<CustomSettings>(DEFAULT_CUSTOM)
  const [presetSelect, setPresetSelect] = useState('')
  const [manualEdited, setManualEdited] = useState(false)
  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null)
  const [quad, setQuad] = useState<Quad | null>(null)
  const [dragging, setDragging] = useState<keyof Quad | null>(null)
  const [result, setResult] = useState<import('../../domain/jobs/result').ProcessedAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadedRef = useRef<LoadedPhoto | null>(null)
  const resultRef = useRef<import('../../domain/jobs/result').ProcessedAsset | null>(null)
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

  const physical = useMemo(() => {
    const w = Number(custom.physWidth)
    const h = Number(custom.physHeight)
    const dpi = Number(custom.dpi)
    if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(dpi)) return null
    if (w <= 0 || h <= 0 || dpi <= 0) return null
    const mmPerUnit = custom.unit === 'cm' ? 10 : 1
    try {
      return dimensionsFromPhysical({ widthMm: w * mmPerUnit, heightMm: h * mmPerUnit }, dpi)
    } catch {
      return null
    }
  }, [custom.physWidth, custom.physHeight, custom.unit, custom.dpi])

  useEffect(() => {
    if (!physical) return
    setCustom((current) =>
      current.width === String(physical.width) && current.height === String(physical.height)
        ? current
        : { ...current, width: String(physical.width), height: String(physical.height) },
    )
  }, [physical])

  useEffect(() => {
    if (!presetProfile) return
    setManualEdited(false)
    const physMm = presetProfile.physicalSizeMm
    const dpi = toPositiveInt(String(presetProfile.dpi ?? NaN))
    setCustom({
      width: presetProfile.dimensions ? String(presetProfile.dimensions.width) : DEFAULT_CUSTOM.width,
      height: presetProfile.dimensions ? String(presetProfile.dimensions.height) : DEFAULT_CUSTOM.height,
      minKb: presetProfile.fileSize?.minBytes ? String(Math.round(presetProfile.fileSize.minBytes / 1024)) : '',
      maxKb: presetProfile.fileSize?.maxBytes ? String(Math.round(presetProfile.fileSize.maxBytes / 1024)) : '',
      format: presetProfile.format ?? 'jpeg',
      physWidth: physMm ? String(physMm.width) : '',
      physHeight: physMm ? String(physMm.height) : '',
      unit: 'mm',
      dpi: dpi !== undefined ? String(dpi) : DEFAULT_CUSTOM.dpi,
    })
  }, [presetProfile])

  const reset = useCallback(() => {
    releaseSessionAssets({ loaded, result })
    setLoaded(null)
    setQuad(null)
    setResult(null)
    setBusy(false)
    setError(null)
    setStep('intake')
  }, [loaded, result])

  useEffect(() => {
    return () => {
      releaseSessionAssets({ loaded: loadedRef.current, result: resultRef.current })
    }
  }, [])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const next = await loadPhotoSource(file)
      setLoaded(next)
      setQuad(defaultQuadForImage(next.source.width, next.source.height))
      setStep('adjust')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This document could not be opened.')
    } finally {
      setBusy(false)
    }
  }

  const handleProcess = async () => {
    if (!loaded || !quad) return
    setBusy(true)
    setError(null)
    try {
      const clamped = clampQuad(quad, loaded.source.width, loaded.source.height)
      const processed = await processDocument({
        source: loaded.source,
        quad: clamped,
        profile,
        fileName: loaded.fileName,
      })
      setResult(processed)
      setStep('result')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The document could not be processed.')
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
      physWidth: physMm ? String(physMm.width) : '',
      physHeight: physMm ? String(physMm.height) : '',
      unit: 'mm',
      dpi: p.dpi !== undefined ? String(p.dpi) : '300',
    })
  }

  const handlePointerMove = useCallback(
    (event: React.PointerEvent | PointerEvent) => {
      if (!dragging || !loaded || !quad || !containerRef.current || !imageRef.current) return
      const rect = imageRef.current.getBoundingClientRect()
      const displayWidth = rect.width
      const displayHeight = rect.height
      // Map client coordinates to source pixel coordinates
      const scaleX = loaded.source.width / displayWidth
      const scaleY = loaded.source.height / displayHeight
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY
      setQuad((prev) => {
        if (!prev) return prev
        const next = { ...prev, [dragging]: { x, y } }
        return clampQuad(next as Quad, loaded.source.width, loaded.source.height)
      })
    },
    [dragging, loaded, quad],
  )

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (event: PointerEvent) => handlePointerMove(event)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, handlePointerMove, handlePointerUp])

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
              onClick={() => navigate('document')}
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
              onChange={(event) => updateCustom({ format: event.target.value as CustomSettings['format'] })}
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
                onChange={(event) => updateCustom({ unit: event.target.value as CustomSettings['unit'] })}
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
              Derived {physical.width} × {physical.height} px from {custom.physWidth} × {custom.physHeight}{' '}
              {custom.unit} at {custom.dpi} DPI. Pixels are editable afterwards.
            </p>
          )}
        </details>
        <p className="target-summary">
          Target: <strong>{summary}</strong>
        </p>
        <p className="profile-note">{PROFILE_NOTE}</p>
      </div>
    </div>
  )

  if (step === 'intake') {
    return (
      <section className="view" aria-labelledby="document-title">
        <h1 id="document-title">Document scan</h1>
        <p className="lede">
          Upload a photo of a document. Drag the 4 corners to outline the page — perspective will be corrected to a
          straight rectangle.
        </p>
        {requirementsPanel}
        <div
          className="drop-zone card"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFile(event.dataTransfer.files?.[0])
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          aria-label="Document drop zone"
        >
          <span className="option-label">Upload document</span>
          <span className="option-hint">JPG, PNG or WebP — click or drag and drop</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Upload document image"
          className="visually-hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {busy && (
          <p className="busy-note" role="status">
            <span className="spinner" aria-hidden="true" /> Opening your document…
          </p>
        )}
        {error && (
          <p className="error-note" role="alert">
            {error}
          </p>
        )}
        <p className="privacy-note">Your document stays on this device — nothing is uploaded.</p>
      </section>
    )
  }

  if (step === 'adjust' && loaded && quad) {
    return (
      <section className="view" aria-labelledby="adjust-title">
        <h1 id="adjust-title">Adjust corners</h1>
        <p className="lede">
          Drag the 4 handles to outline the document. The output will be warped to a straight rectangle of{' '}
          <strong>{summary}</strong>. Check the preview, then continue.
        </p>
        <div
          ref={containerRef}
          style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', marginInline: 'auto' }}
        >
          <img
            ref={imageRef}
            src={loaded.previewUrl}
            alt="Document to correct"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '60vh', userSelect: 'none' }}
            draggable={false}
          />
          {/* Quad overlay */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox={`0 0 ${loaded.source.width} ${loaded.source.height}`}
            preserveAspectRatio="none"
          >
            <polygon
              points={`${quad.tl.x},${quad.tl.y} ${quad.tr.x},${quad.tr.y} ${quad.br.x},${quad.br.y} ${quad.bl.x},${quad.bl.y}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={Math.max(2, loaded.source.width * 0.005)}
            />
          </svg>
          {(Object.keys(quad) as Array<keyof Quad>).map((key) => {
            const point = quad[key]
            return (
              <button
                key={key}
                type="button"
                aria-label={`Drag ${key} corner`}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setDragging(key)
                }}
                style={{
                  position: 'absolute',
                  left: `calc(${(point.x / loaded.source.width) * 100}% - 10px)`,
                  top: `calc(${(point.y / loaded.source.height) * 100}% - 10px)`,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  background: 'white',
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              />
            )
          })}
        </div>
        <div className="step-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="button button-secondary" onClick={reset} disabled={busy}>
            Back
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => setQuad(defaultQuadForImage(loaded.source.width, loaded.source.height))}
            disabled={busy}
          >
            Reset corners
          </button>
          <button type="button" className="button button-primary" onClick={handleProcess} disabled={busy}>
            {busy ? 'Processing…' : 'Continue'}
          </button>
        </div>
        {busy && (
          <p className="busy-note" role="status">
            <span className="spinner" aria-hidden="true" /> Correcting perspective…
          </p>
        )}
        {error && (
          <p className="error-note" role="alert">
            {error}
          </p>
        )}
        <p className="profile-note" style={{ marginTop: '0.75rem' }}>
          Tip: Place the document on a contrasting surface for best auto-detection. Manual corners always work — you’re
          in control.
        </p>
      </section>
    )
  }

  if (step === 'result' && result) {
    return <ProcessedResult result={result} summary={summary} noun="document" onReset={reset} preset={activePreset ?? undefined} />
  }

  return null
}
