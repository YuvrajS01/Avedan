import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CameraStep } from '../features/camera/CameraStep'
import {
  isCameraSupported,
  startCamera,
  captureFrame,
  frameToFile,
} from '../features/camera/camera'
import { sampleVideoFraming } from '../features/camera/framing'
import {
  detectFaceBox,
  isFaceDetectorSupported,
} from '../features/camera/faceGuidance'

vi.mock('../features/camera/camera', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/camera/camera')>()
  return {
    ...actual,
    isCameraSupported: vi.fn(() => false),
    startCamera: vi.fn(),
    captureFrame: vi.fn(),
    frameToFile: vi.fn(),
  }
})

vi.mock('../features/camera/framing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/camera/framing')>()
  return {
    ...actual,
    sampleVideoFraming: vi.fn(() => null),
  }
})

vi.mock('../features/camera/faceGuidance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/camera/faceGuidance')>()
  return {
    ...actual,
    isFaceDetectorSupported: vi.fn(() => false),
    createNativeFaceDetector: vi.fn(() => ({ detect: async () => [] })),
    detectFaceBox: vi.fn(async () => null),
  }
})

const mockedIsSupported = vi.mocked(isCameraSupported)
const mockedStart = vi.mocked(startCamera)
const mockedCapture = vi.mocked(captureFrame)
const mockedFrameToFile = vi.mocked(frameToFile)
const mockedSample = vi.mocked(sampleVideoFraming)
const mockedFaceSupported = vi.mocked(isFaceDetectorSupported)
const mockedDetect = vi.mocked(detectFaceBox)

function stubMediaDevices(getUserMedia?: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
}

afterEach(() => {
  stubMediaDevices(undefined)
  vi.clearAllMocks()
  mockedIsSupported.mockImplementation(() => false)
  mockedSample.mockImplementation(() => null)
  mockedFaceSupported.mockImplementation(() => false)
  mockedDetect.mockImplementation(async () => null)
})

describe('CameraStep', () => {
  it('shows an upload fallback when the camera API is unavailable', async () => {
    const onUseUpload = vi.fn()
    const user = userEvent.setup()
    render(<CameraStep onCaptured={vi.fn()} onUseUpload={onUseUpload} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/does not support camera/i)
    await user.click(screen.getByRole('button', { name: /use upload instead/i }))
    expect(onUseUpload).toHaveBeenCalledTimes(1)
  })

  it('starts the stream and captures into a file for the pipeline', async () => {
    mockedIsSupported.mockImplementation(() => true)
    const stop = vi.fn()
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop })
    mockedCapture.mockReturnValue({
      canvas: document.createElement('canvas'),
      width: 640,
      height: 480,
    })
    const file = new File([new Uint8Array(5)], 'camera.jpg', { type: 'image/jpeg' })
    mockedFrameToFile.mockResolvedValue(file)
    const onCaptured = vi.fn()

    render(<CameraStep onCaptured={onCaptured} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Capture' }))

    await waitFor(() => expect(onCaptured).toHaveBeenCalledWith(file))
    expect(mockedCapture).toHaveBeenCalledTimes(1)
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('attaches the live stream to the visible video preview', async () => {
    mockedIsSupported.mockImplementation(() => true)
    const stop = vi.fn()
    const stream = {} as MediaStream
    mockedStart.mockResolvedValue({ stream, stop })

    const { container } = render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    // The attach effect runs after the ready-state render — retry until then.
    await waitFor(() => expect(video?.srcObject).toBe(stream))
  })

  it('shows an advisory hint for a dark preview without blocking capture', async () => {
    mockedIsSupported.mockImplementation(() => true)
    const stop = vi.fn()
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop })
    mockedSample.mockReturnValue({
      checks: [],
      hint: { id: 'light', severity: 'attention', message: 'Too dark — face a window or brighter light.' },
    })

    render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    expect(await screen.findByText(/too dark/i)).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: 'Capture' })).toBeEnabled()
  })

  it('hides the hint while the preview looks good', async () => {
    mockedIsSupported.mockImplementation(() => true)
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop: vi.fn() })
    mockedSample.mockReturnValue({
      checks: [],
      hint: { id: 'ok', severity: 'ok', message: 'Looks good — hold steady and capture.' },
    })

    render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    // The framing effect runs after the ready-state render — retry until then.
    await waitFor(() => expect(mockedSample).toHaveBeenCalled())
    expect(screen.queryByText(/looks good/i)).not.toBeInTheDocument()
  })

  it('offers opt-in face framing with positioning hints', async () => {
    mockedIsSupported.mockImplementation(() => true)
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop: vi.fn() })
    mockedFaceSupported.mockImplementation(() => true)
    // A small, centered face → "move closer" guidance from real geometry math.
    mockedDetect.mockResolvedValue({ x: 300, y: 200, width: 40, height: 40 })

    const { container } = render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    // jsdom reports no video dimensions; give the preview a real frame size.
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    Object.defineProperty(video, 'videoWidth', { value: 640 })
    Object.defineProperty(video, 'videoHeight', { value: 480 })

    const user = userEvent.setup()
    const toggle = screen.getByRole('button', { name: /face framing: off/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)

    expect(await screen.findByText(/move closer/i)).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: /face framing: on/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('never shows face framing when the platform has no detector', async () => {
    mockedIsSupported.mockImplementation(() => true)
    mockedFaceSupported.mockImplementation(() => false)
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop: vi.fn() })

    render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera with a plain background/i)

    expect(screen.queryByRole('button', { name: /face framing/i })).not.toBeInTheDocument()
  })

  it('shows a denied state with an upload fallback when permission is refused', async () => {
    mockedIsSupported.mockImplementation(() => true)
    mockedStart.mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))

    render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/camera access was blocked/i)
    expect(screen.getByRole('button', { name: /use upload instead/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Capture' })).not.toBeInTheDocument()
  })

  it('offers retry after a generic failure', async () => {
    mockedIsSupported.mockImplementation(() => true)
    mockedStart.mockRejectedValueOnce(new Error('boom'))

    const user = userEvent.setup()
    render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be started/i)

    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop: vi.fn() })
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(/face the camera/i)).toBeInTheDocument()
    expect(mockedStart).toHaveBeenCalledTimes(2)
  })

  it('stops the stream when leaving the camera step', async () => {
    mockedIsSupported.mockImplementation(() => true)
    const stop = vi.fn()
    mockedStart.mockResolvedValue({ stream: {} as MediaStream, stop })

    const { unmount } = render(<CameraStep onCaptured={vi.fn()} onUseUpload={vi.fn()} />)
    await screen.findByText(/face the camera/i)
    unmount()

    expect(stop).toHaveBeenCalled()
  })
})
