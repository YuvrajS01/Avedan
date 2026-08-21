import { useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface IntakeStepProps {
  busy: boolean
  error: string | null
  onFile: (file: File) => void
}

export function IntakeStep({ busy, error, onFile }: IntakeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <section className="view" aria-labelledby="photo-title">
      <h1 id="photo-title">Prepare a photo</h1>
      <div
        className="intake-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {busy ? (
          <p className="busy-note" role="status">
            Opening your photo…
          </p>
        ) : (
          <>
            <p className="intake-hint">
              Choose a photo from this device. It is opened locally and never
              uploaded.
            </p>
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
            <p className="intake-alt">or drag and drop an image here</p>
          </>
        )}
      </div>
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
