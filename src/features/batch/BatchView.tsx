import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PHOTO_PROFILES,
  SIGNATURE_PROFILES,
  THUMB_PROFILES,
  PROFILE_NOTE,
  describeRequirements,
  findProfile,
  findSignatureProfile,
  findThumbProfile,
} from '../../domain/requirements/profiles'
import { findFormPreset, requirementsFromPreset } from '../../domain/presets/registry'
import type { ImageRequirements } from '../../domain/requirements/types'
import type { PresetAssetKind } from '../../domain/presets/schema'
import { useHashRoute } from '../../hooks/useHashRoute'
import { dimensionsFromPhysical } from '../../processing/geometry'
import { createZipBlob, blobToUint8Array } from '../../utils/zip'
import { processBatch, type BatchItem, type BatchKind } from './batchProcess'
import { FileNamingField } from '../../components/FileNamingField'
import {
  getNamingTemplate,
  renderFileName,
  dedupeFileNames,
} from '../../domain/naming/fileNaming'
import { parseCSV, matchDatasetToFiles, type ParsedCSV } from '../../domain/dataset/csv'

interface CustomSettings {
  width: string
  height: string
  minKb: string
  maxKb: string
  format: ImageRequirements['format']
  whiteBg: boolean
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

const DEFAULT_CUSTOM_BY_KIND: Record<BatchKind, CustomSettings> = {
  photo: DEFAULT_CUSTOM,
  signature: {
    width: '300',
    height: '100',
    minKb: '',
    maxKb: '20',
    format: 'jpeg',
    whiteBg: false,
    physWidth: '',
    physHeight: '',
    unit: 'mm',
    dpi: '300',
  },
  thumb: {
    width: '240',
    height: '240',
    minKb: '',
    maxKb: '30',
    format: 'jpeg',
    whiteBg: false,
    physWidth: '',
    physHeight: '',
    unit: 'mm',
    dpi: '300',
  },
  thumbImpression: {
    width: '240',
    height: '240',
    minKb: '',
    maxKb: '30',
    format: 'jpeg',
    whiteBg: false,
    physWidth: '',
    physHeight: '',
    unit: 'mm',
    dpi: '300',
  },
}

function toPositiveInt(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function profileFromCustom(custom: CustomSettings, kind: BatchKind = 'photo'): ImageRequirements {
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

  const defaultAspect = kind === 'signature' ? 3 : kind === 'thumb' || kind === 'thumbImpression' ? 1 : 3 / 4
  return {
    id: 'manual',
    label: 'Manual',
    dimensions,
    aspectRatio: width !== undefined && height !== undefined ? width / height : defaultAspect,
    format: custom.format,
    fileSize,
    background: custom.whiteBg ? 'white' : undefined,
  }
}

export function BatchView() {
  const { presetId, navigate } = useHashRoute()
  const [batchKind, setBatchKind] = useState<BatchKind>('photo')
  const [custom, setCustom] = useState<CustomSettings>(DEFAULT_CUSTOM)
  const [presetSelect, setPresetSelect] = useState('')
  const [manualEdited, setManualEdited] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<BatchItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zipUrl, setZipUrl] = useState<string | null>(null)
  const [zipName, setZipName] = useState('')
  const [namingTemplate, setNamingTemplate] = useState(() => getNamingTemplate(presetId))
  const [dataset, setDataset] = useState<ParsedCSV | null>(null)
  const [datasetError, setDatasetError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const datasetInputRef = useRef<HTMLInputElement>(null)

  const activePreset = useMemo(() => findFormPreset(presetId), [presetId])
  const presetKind = useMemo(
    () => (batchKind === 'thumb' ? 'thumbImpression' : (batchKind as PresetAssetKind)),
    [batchKind],
  )
  const presetProfile = useMemo(
    () => (activePreset ? requirementsFromPreset(activePreset, presetKind) : undefined),
    [activePreset, presetKind],
  )
  const profile = useMemo(
    () => (presetProfile && !manualEdited ? presetProfile : profileFromCustom(custom, batchKind)),
    [presetProfile, manualEdited, custom, batchKind],
  )
  const summary = describeRequirements(profile)

  const datasetMatch = useMemo(() => {
    if (!dataset || dataset.rows.length === 0 || files.length === 0) return null
    return matchDatasetToFiles(files, dataset.rows)
  }, [dataset, files])

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
      whiteBg: presetProfile.background === 'white',
      physWidth: physMm ? String(physMm.width) : '',
      physHeight: physMm ? String(physMm.height) : '',
      unit: 'mm',
      dpi: dpi !== undefined ? String(dpi) : DEFAULT_CUSTOM.dpi,
    })
  }, [presetProfile])

  useEffect(() => {
    if (presetProfile) return
    if (manualEdited) return
    setCustom(DEFAULT_CUSTOM_BY_KIND[batchKind])
    setPresetSelect('')
  }, [batchKind, presetProfile, manualEdited])

  useEffect(() => {
    setNamingTemplate(getNamingTemplate(presetId))
  }, [presetId])

  useEffect(() => {
    return () => {
      if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
      for (const item of results) {
        if (item.asset?.url && typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(item.asset.url)
        }
      }
    }
  }, [zipUrl, results])

  const handleFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    const accepted = list.filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type))
    if (accepted.length < list.length) {
      setError('Some files were not images (only JPG/PNG/WebP allowed) and were skipped.')
    } else {
      setError(null)
    }
    if (accepted.length === 0) return
    setFiles((prev) => [...prev, ...accepted])
    setResults([])
    if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
    setZipUrl(null)
    setZipName('')
  }

  const handleDatasetFile = async (file: File | undefined) => {
    if (!file) return
    setDatasetError(null)
    try {
      let text: string
      if (typeof (file as unknown as { text?: () => Promise<string> }).text === 'function') {
        text = await (file as unknown as { text: () => Promise<string> }).text()
      } else {
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsText(file)
        })
      }
      const parsed = parseCSV(text)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setDatasetError('CSV appears empty or has no valid headers.')
        setDataset(null)
        return
      }
      setDataset(parsed)
    } catch (cause) {
      setDatasetError(cause instanceof Error ? cause.message : 'Could not parse CSV.')
      setDataset(null)
    }
  }

  const handleClearDataset = () => {
    setDataset(null)
    setDatasetError(null)
    if (datasetInputRef.current) datasetInputRef.current.value = ''
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      const kindLabel = batchKind === 'photo' ? 'photo' : batchKind === 'signature' ? 'signature' : 'thumb impression'
      setError(`Add at least one ${kindLabel} first.`)
      return
    }
    setBusy(true)
    setError(null)
    setResults([])
    if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
    setZipUrl(null)
    try {
      const batchResults = await processBatch(files, batchKind, profile)
      setResults(batchResults)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Batch processing failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleClear = () => {
    for (const item of results) {
      if (item.asset?.url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(item.asset.url)
    }
    if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
    setFiles([])
    setResults([])
    setError(null)
    setZipUrl(null)
    setZipName('')
  }

  const handleDownloadZip = async () => {
    const successful = results.filter((item) => item.status === 'done' && item.asset)
    if (successful.length === 0) {
      setError(`No successful ${kindLabel} to ZIP yet.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const template = namingTemplate || getNamingTemplate(presetId)
      const rawNames: string[] = []
      const entries: { name: string; data: Uint8Array }[] = []
      for (let index = 0; index < successful.length; index++) {
        const item = successful[index]
        const asset = item.asset!
        const originalBase = item.file.name.replace(/\.[^.]+$/, '') || 'photo'
        const ext = (asset.fileName.split('.').pop() ?? asset.format ?? 'jpg').replace(/^\.+/, '')
        const csvRow = datasetMatch?.matched.find((match) => match.file === item.file)?.row
        const rendered = renderFileName(template, {
          original: originalBase,
          index: index + 1,
          kind: batchKind,
          preset: presetId ?? 'manual',
          ext,
          csv: csvRow,
        })
        rawNames.push(rendered)
      }
      const deduped = dedupeFileNames(rawNames)
      for (let index = 0; index < successful.length; index++) {
        const asset = successful[index].asset!
        const data = await blobToUint8Array(asset.blob)
        entries.push({ name: deduped[index], data })
      }
      const zipBlob = createZipBlob(entries, new Date())
      const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(zipBlob) : ''
      if (zipUrl && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(zipUrl)
      setZipUrl(url)
      const presetPart = presetId ?? 'batch'
      const kindPart = batchKind === 'thumb' || batchKind === 'thumbImpression' ? 'thumb' : batchKind
      const name = `${presetPart}-${kindPart}-${successful.length}.zip`
      setZipName(name)
      if (url) {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = name
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The ZIP could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const handlePresetSelect = (id: string) => {
    setPresetSelect(id)
    if (!id) return
    let p
    if (batchKind === 'photo') p = findProfile(id)
    else if (batchKind === 'signature') p = findSignatureProfile(id)
    else p = findThumbProfile(id)
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

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    if (event.dataTransfer.files) handleFiles(event.dataTransfer.files)
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
              onClick={() => navigate('batch')}
              style={{ marginTop: '0.75rem' }}
            >
              Use generic settings instead
            </button>
          </div>
        )}
        <label className="field">
          <span>Asset kind</span>
          <select
            value={batchKind}
            onChange={(event) => setBatchKind(event.target.value as BatchKind)}
            aria-label="Batch asset kind"
          >
            <option value="photo">Photo</option>
            <option value="signature">Signature</option>
            <option value="thumb">Thumb impression</option>
          </select>
        </label>
        <label className="field">
          <span>Load preset</span>
          <select
            aria-label="Load preset"
            value={presetSelect}
            onChange={(event) => handlePresetSelect(event.target.value)}
          >
            <option value="">— Choose a preset to autofill —</option>
            {(batchKind === 'photo'
              ? PHOTO_PROFILES
              : batchKind === 'signature'
                ? SIGNATURE_PROFILES
                : THUMB_PROFILES
            ).map((option) => (
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

  const successful = results.filter((item) => item.status === 'done' && item.asset).length
  const failed = results.filter((item) => item.status === 'error').length

  const kindLabel = batchKind === 'photo' ? 'photos' : batchKind === 'signature' ? 'signatures' : 'thumb impressions'
  const kindSingular = batchKind === 'photo' ? 'photo' : batchKind === 'signature' ? 'signature' : 'thumb impression'

  return (
    <section className="view" aria-labelledby="batch-title">
      <h1 id="batch-title">Batch {kindLabel}</h1>
      <p className="lede">
        Prepare many {kindLabel} at once with the same preset.{' '}
        {batchKind === 'photo'
          ? 'Auto center-crop → resize → compress → validate, all in your browser.'
          : 'Trim → fit within → compress → validate, all in your browser.'}
      </p>

      {requirementsPanel}

      <details className="advanced-fields" style={{ marginBottom: '1rem' }}>
        <summary>Import dataset (CSV) — optional</summary>
        <div className="card" style={{ padding: '1rem', marginTop: '0.5rem' }}>
          <p className="profile-note">
            Local CSV parsed in this browser — never uploaded. Columns like <code>id</code>, <code>name</code>,{' '}
            <code>photo</code> are matched to files by filename (case-insensitive). First 5 rows previewed.
          </p>
          <input
            ref={datasetInputRef}
            type="file"
            accept=".csv,text/csv"
            aria-label="Import dataset CSV"
            onChange={(event) => {
              handleDatasetFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {datasetError && (
            <p className="error-note" role="alert" style={{ marginTop: '0.5rem' }}>
              {datasetError}
            </p>
          )}
          {dataset && (
            <>
              <p className="profile-note" style={{ marginTop: '0.5rem' }}>
                {dataset.rows.length} rows, columns: {dataset.headers.join(', ')}
              </p>
              <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                <table className="kit-table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {dataset.headers.slice(0, 5).map((header) => (
                        <th key={header} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '4px 8px' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {dataset.headers.slice(0, 5).map((header) => (
                          <td key={header} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataset.rows.length > 5 && (
                <p className="profile-note">Showing 5 of {dataset.rows.length} rows.</p>
              )}
              <div className="step-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="button button-ghost" onClick={handleClearDataset}>
                  Clear dataset
                </button>
              </div>
            </>
          )}
          {datasetMatch && (
            <p className="profile-note" style={{ marginTop: '0.5rem' }}>
              <strong>
                {datasetMatch.matched.length} of {files.length} files matched
              </strong>{' '}
              · {datasetMatch.unmatchedFiles.length} unmatched files · {datasetMatch.unmatchedRows.length} unmatched
              rows
              {datasetMatch.matched.length > 0 && (
                <> — e.g. {datasetMatch.matched[0].file.name} ↔ {Object.values(datasetMatch.matched[0].row)[0]}</>
              )}
            </p>
          )}
          {dataset && files.length === 0 && (
            <p className="profile-note">Add photos above to see matching.</p>
          )}
        </div>
      </details>

      <div
        className="drop-zone card"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label={`Batch ${kindSingular} drop zone`}
      >
        <span className="option-label">Add {kindLabel}</span>
        <span className="option-hint">JPG, PNG or WebP — drag and drop or click to choose (multiple allowed)</span>
        {files.length > 0 && <span className="action-hint">{files.length} files queued</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-label={`Upload batch ${kindLabel}`}
        className="visually-hidden"
        onChange={(event) => {
          if (event.target.files) handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {files.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <p className="profile-note">
            {files.length} files queued —{' '}
            {batchKind === 'photo'
              ? 'auto center-crop will be applied per photo to match the target aspect ratio.'
              : 'trim and fit-within will be applied per file.'}
          </p>
          <ul className="preset-list" aria-label="Queued files">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="preset-line">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </li>
            ))}
          </ul>
          <div className="step-actions">
            <button type="button" className="button button-secondary" onClick={handleClear} disabled={busy}>
              Clear
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleProcess}
              disabled={busy || files.length === 0}
            >
              {busy ? 'Processing…' : `Process ${files.length} ${kindLabel}`}
            </button>
          </div>
        </div>
      )}

      {busy && (
        <p className="busy-note" role="status">
          <span className="spinner" aria-hidden="true" /> Processing your batch…
        </p>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <>
          <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <p className={failed === 0 ? 'validation-banner pass' : 'validation-banner attention'} role="status">
              {successful} of {results.length} passed · {failed} failed
            </p>
            <p className="profile-note">
              {batchKind === 'photo' ? 'Auto center-crop applied' : 'Trim and fit-within applied'} — check thumbnails
              before submitting.
            </p>
          </div>

          <ul className="preset-list" aria-label="Batch results">
            {results.map((item) => (
              <li key={item.id}>
                <div className="card preset-card">
                  <div className="preset-main" style={{ cursor: 'default' }}>
                    <span className="preset-name">{item.file.name}</span>
                    {item.status === 'processing' && <span className="action-hint">Processing…</span>}
                    {item.status === 'done' && item.asset && (
                      <>
                        <span className="preset-line">
                          {item.asset.width} × {item.asset.height} px · {item.asset.format?.toUpperCase()} ·{' '}
                          {(item.asset.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                        <span
                          className={item.asset.validation.status === 'pass' ? 'badge badge-verified' : 'badge badge-stale'}
                        >
                          {item.asset.validation.status === 'pass' ? 'Passed' : 'Needs attention'}
                        </span>
                        {item.asset.validation.status === 'attention' && (
                          <span className="profile-note">
                            {item.asset.validation.checks
                              .filter((check) => check.status === 'attention')
                              .map((check) => check.label)
                              .join(' · ')}
                          </span>
                        )}
                      </>
                    )}
                    {item.status === 'error' && <span className="error-note">{item.error}</span>}
                    {item.status === 'queued' && <span className="action-hint">Queued</span>}
                  </div>
                  <div className="preset-actions">
                    {item.status === 'done' && item.asset && (
                      <>
                        {item.asset.url && (
                          <img
                            src={item.asset.url}
                            alt={`${item.file.name} preview`}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                          />
                        )}
                        <a className="button button-ghost" href={item.asset.url} download={item.asset.fileName}>
                          Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Download all</h3>
            <p className="profile-note">
              ZIP of all successful {kindLabel} — built in your browser (STORE, no recompression). Filenames follow
              your naming template.
            </p>
            <FileNamingField presetId={presetId} onChange={setNamingTemplate} />
            <div className="step-actions" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleDownloadZip}
                disabled={busy || successful === 0}
              >
                {busy ? 'Packaging…' : `Download ZIP (${successful} files)`}
              </button>
              {zipUrl && (
                <a className="button button-ghost" href={zipUrl} download={zipName}>
                  Re-download ZIP
                </a>
              )}
              <button type="button" className="button button-secondary" onClick={handleClear} disabled={busy}>
                Clear batch
              </button>
            </div>
          </div>
        </>
      )}

      <p className="privacy-note" style={{ marginTop: '1rem' }}>
        Your images stay on this device — nothing is uploaded. Batch runs entirely in your browser and is
        session-local. Auto center-crop is applied; review thumbnails before submitting.
      </p>
    </section>
  )
}
