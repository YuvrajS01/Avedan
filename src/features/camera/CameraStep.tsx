import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraFacing, CameraHandle } from './camera'
import { FlowSteps } from '../../components/FlowSteps'
import {
  attachStream,
  captureFrame,
  describeCameraError,
  frameToFile,
  isCameraSupported,
  startCamera,
} from './camera'
import { sampleVideoFraming, type GuidanceHint } from './framing'
import {
  combineHints,
  createNativeFaceDetector,
  deriveFaceHint,
  detectFaceBox,
  isFaceDetectorSupported,
  type FaceDetectorLike,
} from './faceGuidance'

type CameraStatus = 'starting' | 'ready' | 'denied' | 'not-found' | 'unsupported' | 'error'

interface CameraStepProps {
  onCaptured: (file: File) => void
  onUseUpload: () => void
}

/** Milliseconds between advisory framing samples of the live preview. */
const FRAMING_INTERVAL_MS = 700

export function CameraStep({ onCaptured, onUseUpload }: CameraStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<CameraHandle | null>(null)
  const facingRef = useRef<CameraFacing>('user')
  const [status, setStatus] = useState<CameraStatus>(() =>
    isCameraSupported() ? 'starting' : 'unsupported',
  )
  const [busy, setBusy] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [hint, setHint] = useState<GuidanceHint | null>(null)
  const [faceSupported] = useState(() => isFaceDetectorSupported())
  const [faceFramingOn, setFaceFramingOn] = useState(false)
  const faceDetectorRef = useRef<FaceDetectorLike | null>(null)

  const begin = useCallback(async () => {
    setStatus('starting')
    try {
      const handle = await startCamera(facingRef.current)
      handleRef.current = handle
      setStatus('ready')
    } catch (cause) {
      const kind = describeCameraError(cause)
      if (kind === 'denied') setStatus('denied')
      else if (kind === 'not-found') setStatus('not-found')
      else setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (isCameraSupported()) {
      begin()
    }
    return () => {
      handleRef.current?.stop()
    }
  }, [begin])

  // The <video> only mounts once the state is 'ready', so the stream must be
  // attached after that render — attaching during 'starting' finds no element.
  useEffect(() => {
    const video = videoRef.current
    const stream = handleRef.current?.stream
    if (status !== 'ready' || !video || !stream) return
    attachStream(video, stream)
    const playing = video.play()
    if (playing && typeof playing.catch === 'function') {
      playing.catch(() => undefined)
    }
  }, [status])

  // Advisory framing loop: sample a small frame periodically while the
  // preview is live. Purely local, fail-safe, and never blocks capture.
  // When face framing is enabled, the native FaceDetector refines the hint.
  useEffect(() => {
    if (status !== 'ready') {
      setHint(null)
      return
    }
    let cancelled = false
    let inFlight = false

    const sample = async () => {
      const video = videoRef.current
      if (!video || inFlight) return
      inFlight = true
      try {
        const qualityHint = sampleVideoFraming(video)?.hint ?? null

        let faceHint: GuidanceHint | null = null
        if (faceFramingOn) {
          if (!faceDetectorRef.current) faceDetectorRef.current = createNativeFaceDetector()
          const detector = faceDetectorRef.current
          if (detector && video.videoWidth > 0) {
            try {
              const box = await detectFaceBox(detector, video)
              if (!cancelled) {
                faceHint = deriveFaceHint(box, video.videoWidth, video.videoHeight)
              }
            } catch {
              // Detection failed this round — fall back to quality hints only.
            }
          }
        }

        if (!cancelled) setHint(combineHints(qualityHint, faceHint))
      } finally {
        inFlight = false
      }
    }

    sample()
    const timer = window.setInterval(sample, FRAMING_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [status, faceFramingOn])

  const switchCamera = async () => {
    handleRef.current?.stop()
    facingRef.current = facingRef.current === 'user' ? 'environment' : 'user'
    await begin()
  }

  const capture = async () => {
    const video = videoRef.current
    if (!video || status !== 'ready') return
    setBusy(true)
    try {
      const frame = captureFrame(video)
      const file = await frameToFile(frame.canvas)
      handleRef.current?.stop()
      onCaptured(file)
    } catch (cause) {
      setCaptureError(cause instanceof Error ? cause.message : 'The photo could not be captured.')
      setBusy(false)
    }
  }

  return (
    <section className="view" aria-labelledby="camera-title">
      <FlowSteps current="add" />
      <h1 id="camera-title">Take a photo</h1>
      {status === 'ready' && (
        <>
          <p className="lede">
            Face the camera with a plain background. Keep your head and shoulders inside the
            frame — the preview stays on this device.
          </p>
          <div className="camera-stage">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-guide" aria-hidden="true">
              <div className="camera-guide-oval" />
            </div>
          </div>
          {faceSupported && (
            <div className="camera-options">
              <button
                type="button"
                className={faceFramingOn ? 'button button-ghost is-active' : 'button button-ghost'}
                aria-pressed={faceFramingOn}
                disabled={busy}
                onClick={() => setFaceFramingOn((on) => !on)}
              >
                {faceFramingOn ? 'Face framing: on' : 'Face framing: off'}
              </button>
              <p className="option-hint">
                Uses this browser's built-in face detector — everything stays on
                this device.
              </p>
            </div>
          )}
          {busy && (
            <p className="busy-note" role="status">
              <span className="spinner" aria-hidden="true" />
              Saving your photo…
            </p>
          )}
          {captureError && (
            <p className="error-note" role="alert">
              {captureError}
            </p>
          )}
          {hint && hint.severity === 'attention' && (
            <p className="framing-hint" role="status">
              {hint.message}
            </p>
          )}
          <div className="camera-capture-row">
            <button
              type="button"
              className="button button-ghost"
              onClick={switchCamera}
              disabled={busy}
            >
              Switch
            </button>
            <button
              type="button"
              className="capture-button"
              onClick={capture}
              disabled={busy}
              aria-label="Capture"
            >
              <span className="capture-button-ring">
                <span className="capture-button-core" />
              </span>
            </button>
            <span className="button button-ghost" style={{ visibility: 'hidden' }} aria-hidden="true">
              Switch
            </span>
          </div>
        </>
      )}
      {status === 'starting' && (
        <p className="busy-note" role="status">
          <span className="spinner" aria-hidden="true" />
          Starting the camera…
        </p>
      )}
      {status === 'denied' && (
        <>
          <p className="error-note" role="alert">
            Camera access was blocked. Allow camera permission in your browser settings, or
            upload a photo instead.
          </p>
          <FallbackActions onUseUpload={onUseUpload} />
        </>
      )}
      {status === 'not-found' && (
        <>
          <p className="error-note" role="alert">
            No usable camera was found on this device. Upload a photo instead.
          </p>
          <FallbackActions onUseUpload={onUseUpload} />
        </>
      )}
      {status === 'unsupported' && (
        <>
          <p className="error-note" role="alert">
            This browser does not support camera capture. Upload a photo instead.
          </p>
          <FallbackActions onUseUpload={onUseUpload} />
        </>
      )}
      {status === 'error' && (
        <>
          <p className="error-note" role="alert">
            The camera could not be started. You can try again or upload a photo.
          </p>
          <FallbackActions onUseUpload={onUseUpload} onRetry={begin} />
        </>
      )}
    </section>
  )
}

function FallbackActions({
  onUseUpload,
  onRetry,
}: {
  onUseUpload: () => void
  onRetry?: () => void
}) {
  return (
    <div className="step-actions">
      {onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="button button-primary" onClick={onUseUpload}>
        Use upload instead
      </button>
    </div>
  )
}
