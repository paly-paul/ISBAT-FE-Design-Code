'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PanelA from '@/components/PanelA'
import Icon from '@/components/Icon'
import { studentLogin, AuthError } from '@/lib/auth'
import { authErrorMessage, validateStudentId } from '@/lib/errorMessages'

export default function StudentLoginPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const disabled = loading || !studentId.trim() || !password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const idErr = validateStudentId(studentId)
    if (idErr) { setFieldError(idErr); return }
    setFieldError(null)
    setError(null)
    setLoading(true)

    try {
      const result = await studentLogin(studentId, password)
      window.location.href = result.redirect || '/academic'
    } catch (err) {
      if (err instanceof AuthError) {
        setError(authErrorMessage(err.code))
      } else {
        setError(authErrorMessage('unknown'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelA eyebrow="Students" headline="Student Portal sign-in.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12 }}>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="isb-btn link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Icon name="back" size={13} /> All portals
        </button>
        <span style={{ color: 'var(--isb-line)' }}>·</span>
        <span className="isb-chip" style={{ background: '#E4F4EB', color: '#1D6B3E' }}>
          /frmStudentLogin.aspx
        </span>
      </div>

      {error && (
        <div className="isb-error-banner">
          <Icon name="alert" size={16} color="var(--isb-red)" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="isb-field">
          <label className="isb-label" htmlFor="student-id">Student ID</label>
          <input
            id="student-id"
            className="isb-input"
            value={studentId}
            onChange={e => { setStudentId(e.target.value); setFieldError(null) }}
            placeholder="ISB/YYYY/PROG/NNNN"
            autoComplete="username"
            autoFocus
          />
          {fieldError
            ? <div className="err">{fieldError}</div>
            : <div className="hint">Printed on your admission letter and ID card.</div>
          }
        </div>

        <div className="isb-field">
          <label
            className="isb-label"
            htmlFor="password"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Password</span>
            <button
              type="button"
              onClick={() => router.push('/login/forgot')}
              className="isb-btn link"
              style={{ fontSize: 11 }}
            >
              Forgot password?
            </button>
          </label>
          <div className="isb-pw-wrap">
            <input
              id="password"
              className="isb-input"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ paddingRight: 62 }}
              autoComplete="current-password"
            />
            <button type="button" className="toggle" onClick={() => setShow(s => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="isb-btn primary full"
          disabled={disabled}
          style={{ background: '#2EA862', boxShadow: '0 2px 4px rgba(46,168,98,.25)', marginTop: 12 }}
        >
          {loading
            ? 'Signing in…'
            : <>Sign in to Student Portal <Icon name="arrow" size={15} color="#fff" /></>
          }
        </button>

        <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--isb-muted)', textAlign: 'center' }}>
          First time signing in?{' '}
          <a href="/login/activate" className="isb-link">Activate your student account</a>
        </div>
      </form>

      <div style={{
        marginTop: 28, padding: 14,
        background: 'var(--isb-paper-2)', border: '1px solid var(--isb-line-2)',
        borderRadius: 8, fontSize: 11.5, color: 'var(--isb-muted)',
      }}>
        Having trouble? Email{' '}
        <a href="mailto:studentsupport@isbatuniversity.ac.ug" className="isb-link">
          studentsupport@isbatuniversity.ac.ug
        </a>
        {' '}or call <span className="nums">+256 414 532 500</span>.
      </div>
    </PanelA>
  )
}
