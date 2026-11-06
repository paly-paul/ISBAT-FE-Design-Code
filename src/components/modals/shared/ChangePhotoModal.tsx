'use client'
import { useEffect, useRef, useState } from 'react'

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
// The stage is square, so the saved photo is exactly the framing on screen.
const CAPTURE_SIZE = 640

type Step = 'choose' | 'camera' | 'review'

interface ChangePhotoModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  onPhoto: (dataUrl: string) => void
}

function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera access is blocked. Allow it in your browser’s site settings, or upload a photo instead.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. Upload a photo instead.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The camera is being used by another app. Close that app and try again, or upload a photo instead.'
  return 'The camera couldn’t be started. Try again, or upload a photo instead.'
}

export function ChangePhotoModal({ isOpen, onClose, showToast, onPhoto }: ChangePhotoModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  // Bumped by Try again, which re-runs the effect below.
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // The stream only lives while the camera step is showing; the cleanup is what
  // turns the camera (and the browser's recording light) off again.
  useEffect(() => {
    if (!isOpen || step !== 'camera') return
    let cancelled = false
    let stream: MediaStream | null = null
    setCameraError(null)
    setCameraReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('The camera only works on a secure (https) connection. Upload a photo instead.')
      return
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(err => { if (!cancelled) setCameraError(cameraErrorMessage(err)) })
    return () => {
      cancelled = true
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [isOpen, step, cameraAttempt])

  if (!isOpen) return null

  function handleClose() {
    setStep('choose')
    setCaptured(null)
    setCameraError(null)
    onClose()
  }

  function finish(dataUrl: string) {
    onPhoto(dataUrl)
    handleClose()
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) return showToast('Photo must be under 2 MB.', 'err')
    const reader = new FileReader()
    reader.onload = ev => finish(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const side = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = CAPTURE_SIZE
    canvas.height = CAPTURE_SIZE
    canvas.getContext('2d')?.drawImage(
      video,
      (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side,
      0, 0, CAPTURE_SIZE, CAPTURE_SIZE,
    )
    setCaptured(canvas.toDataURL('image/jpeg', 0.9))
    setStep('review')
  }

  const uploadInput = <input type="file" accept="image/*" onChange={handleUpload} aria-label="Upload a photo" />

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" role="dialog" aria-modal="true" aria-label="Change profile photo" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-camera"></i> {step === 'choose' ? 'Change Photo' : step === 'camera' ? 'Take Photo' : 'Use This Photo?'}</div>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div style={{ padding: 20 }}>
          {step === 'choose' && (
            <div className="mp-photo-sources">
              <button type="button" className="mp-photo-source" onClick={() => setStep('camera')}>
                <i className="lni lni-camera" aria-hidden="true"></i>
                <span>Take Photo</span>
                <small>Use this device’s camera</small>
              </button>
              <label className="mp-photo-source">
                {uploadInput}
                <i className="lni lni-upload" aria-hidden="true"></i>
                <span>Upload Photo</span>
                <small>Image file, up to 2 MB</small>
              </label>
            </div>
          )}

          {step === 'camera' && (cameraError ? (
            <div className="warn-box" role="alert">
              <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--amber)', flexShrink: 0 }}></i>
              <div>{cameraError}</div>
            </div>
          ) : (
            <div className="mp-photo-stage is-live">
              <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => setCameraReady(true)} aria-label="Camera preview" />
              {!cameraReady && <div className="mp-photo-stage-msg">Starting camera…</div>}
            </div>
          ))}

          {step === 'review' && captured && (
            <div className="mp-photo-stage">
              <img src={captured} alt="Captured profile" />
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'choose' && <button className="btn btn-neu flex-1 justify-center" onClick={handleClose}>Cancel</button>}

          {step === 'camera' && (
            <>
              <button className="btn btn-neu" onClick={() => { setCameraError(null); setStep('choose') }}>Back</button>
              {cameraError ? (
                <>
                  <button className="btn btn-neu" onClick={() => setCameraAttempt(n => n + 1)}><i className="lni lni-reload"></i> Try Again</button>
                  <label className="btn btn-primary mp-photo-upload-btn">
                    {uploadInput}
                    <i className="lni lni-upload"></i> Upload Photo
                  </label>
                </>
              ) : (
                <button className="btn btn-primary flex-1 justify-center" disabled={!cameraReady} onClick={capture}><i className="lni lni-camera"></i> Capture</button>
              )}
            </>
          )}

          {step === 'review' && captured && (
            <>
              <button className="btn btn-neu" onClick={() => { setCaptured(null); setStep('camera') }}><i className="lni lni-reload"></i> Retake</button>
              <button className="btn btn-primary flex-1 justify-center" onClick={() => finish(captured)}><i className="lni lni-checkmark"></i> Use Photo</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
