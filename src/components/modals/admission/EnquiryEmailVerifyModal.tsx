'use client'
import { useEffect, useRef, useState } from 'react'
import OtpInput from '@/components/OtpInput'
import { useRequestEnquiryEmailOtp, useVerifyEnquiryEmailOtp } from '@/hooks/admission/useEnquiries'

// Verifies an enquiry's email with a 6-digit OTP (post-enquiry-email-otp-
// request.md / -verify.md). Sends the code as soon as it opens, so it's used
// right after an enquiry is saved (`afterCreate`: the copy says so and Cancel
// reads "Skip for now") and from the Enquiry List's "Verify Email" action.
//
// The server allows 3 wrong codes per OTP and a code lasts 10 minutes; a
// resend issues a fresh code and resets both. The 30s resend wait below is a
// UI guard against double-sends only — the API itself has no cooldown.
const RESEND_WAIT_S = 30
const EMPTY = ['', '', '', '', '', '']

interface Props {
  isOpen: boolean
  enquiryGuid: string | null
  email: string
  studentName?: string
  afterCreate?: boolean
  onClose: () => void
  onVerified: () => void
}

export function EnquiryEmailVerifyModal({ isOpen, enquiryGuid, email, studentName, afterCreate, onClose, onVerified }: Props) {
  const requestOtp = useRequestEnquiryEmailOtp()
  const verifyOtp = useVerifyEnquiryEmailOtp()
  const [masked, setMasked] = useState<string | null>(null)
  const [digits, setDigits] = useState<string[]>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [verified, setVerified] = useState(false)
  const [wait, setWait] = useState(0)
  const sentFor = useRef<string | null>(null)

  function send() {
    if (!enquiryGuid) return
    setError(null)
    setLocked(false)
    setDigits(EMPTY)
    requestOtp.mutate(enquiryGuid, {
      onSuccess: m => { setMasked(m || email); setWait(RESEND_WAIT_S) },
      onError: (e: Error) => {
        // Already verified (e.g. by another advisor) — nothing left to do.
        if (/already verified/i.test(e.message)) { setVerified(true); onVerified(); return }
        setError(e.message || 'Couldn’t send the code. Please try again.')
      },
    })
  }

  // Send once per enquiry each time the modal opens.
  useEffect(() => {
    if (!isOpen) { sentFor.current = null; return }
    if (!enquiryGuid || sentFor.current === enquiryGuid) return
    sentFor.current = enquiryGuid
    setMasked(null); setVerified(false)
    send()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, enquiryGuid])

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  if (!isOpen || !enquiryGuid) return null

  const code = digits.join('')

  function handleVerify() {
    if (!enquiryGuid || code.length !== 6) return
    setError(null)
    verifyOtp.mutate({ enquiryGuid, otp: code }, {
      onSuccess: () => { setVerified(true); onVerified() },
      onError: (e: Error) => {
        const msg = e.message || 'Couldn’t verify the code. Please try again.'
        setError(msg)
        setDigits(EMPTY)
        // Out of attempts — only a new code helps, so stop offering Verify.
        if (/too many/i.test(msg)) { setLocked(true); setWait(0) }
      },
    })
  }

  const sending = requestOtp.isPending
  const target = masked ?? email

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-envelope"></i> Verify Email</div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        {verified ? (
          <div className="eq-verify">
            <div className="eq-verify-icon ok"><i className="lni lni-checkmark"></i></div>
            <div className="eq-verify-title">Email verified</div>
            <div className="eq-verify-sub"><strong>{target}</strong>{studentName ? ` is confirmed for ${studentName}.` : ' is confirmed.'}</div>
          </div>
        ) : (
          <div className="eq-verify">
            {afterCreate && <div className="eq-verify-saved"><i className="lni lni-checkmark-circle"></i> Enquiry saved</div>}
            <div className="eq-verify-icon"><i className="lni lni-envelope"></i></div>
            <div className="eq-verify-title">Confirm the candidate&apos;s email</div>
            <div className="eq-verify-sub" aria-live="polite">
              {sending && !masked
                ? 'Sending a 6-digit code…'
                : <>We sent a 6-digit code to <strong>{target}</strong>. Ask {studentName || 'the candidate'} to read it out — it expires in 10 minutes.</>}
            </div>

            <div className={`eq-otp${locked ? ' locked' : ''}`}>
              <OtpInput value={digits} onChange={d => { setDigits(d); if (error && !locked) setError(null) }} />
            </div>

            {error && <div className="eq-verify-error" role="alert"><i className="lni lni-warning"></i> {error}</div>}

            <div className="eq-verify-resend">
              Didn&apos;t get it?{' '}
              <button type="button" className="pm-link" style={{ marginLeft: 0 }} disabled={sending || wait > 0} onClick={send}>
                {sending ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : 'Send a new code'}
              </button>
            </div>
          </div>
        )}

        <div className="modal-footer">
          {verified ? (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          ) : (
            <>
              <button className="btn btn-neu" onClick={onClose}>{afterCreate ? 'Skip for now' : 'Cancel'}</button>
              <button className="btn btn-primary" disabled={code.length !== 6 || locked || verifyOtp.isPending || sending} onClick={handleVerify}>
                <i className="lni lni-checkmark-circle"></i> {verifyOtp.isPending ? 'Verifying…' : 'Verify'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
