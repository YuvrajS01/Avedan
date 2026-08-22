import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent, ReactNode } from 'react'
import { FlowSteps } from '../../components/FlowSteps'

interface IntakeStepProps {
  busy: boolean
  error: string | null
  cameraAvailable?: boolean
  onFile: (file: File) => void
  onCamera: () => void
  children?: ReactNode
}

export function IntakeStep({ busy, error, cameraAvailable = false, onFile, onCamera, children }: IntakeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <section className="view" aria-labelledby="photo-title">
      <FlowSteps current="add" />
      <h1 id="photo-title">Prepare a photo</h1>
      <p className="lede">
        Choose a photo from this device. It is opened locally and never uploaded.
      </p>
      <div className="intake-grid">
        <div>{children}</div>
        <div>
          <div
            className={dragging ? 'intake-zone is-dragging' : 'intake-zone'}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
        {busy ? (
          <p className="busy-note" role="status">
            <span className="spinner" aria-hidden="true" />
            Opening your photo…
          </p>
        ) : (
          <>
            <p className="intake-title">Drop your photo here</p>
            <input
              ref={inputRef}
              id="photo-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload photo"
              onChange={handleChange}
              className="visually-hidden"
            />
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Upload photo
            </button>
            <p className="intake-alt" aria-hidden="true">
              or drag and drop an image here
            </p>
            {cameraAvailable && (
              <>
                <div className="intake-divider" aria-hidden="true">
                  or
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={onCamera}
                >
                  Take a photo
                </button>
              </>
            )}
          </>
        )}
      </div>
        </div>
      </div>
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
