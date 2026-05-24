'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IsbatLogo } from '@/components/common/IsbatLogo'
import { StatusBanner } from '@/components/common/StatusBanner'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const fromPath = params.get('from') ?? '/academic'
  const reason = params.get('reason')

  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? ''

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? 'Invalid credentials')
      }

      const { token } = (await res.json()) as { token: string }
      document.cookie = `isbat_session=${token}; path=/; SameSite=Lax; Secure`
      router.replace(fromPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2d448f] px-4">
      {reason === 'session_expired' && !error && (
        <StatusBanner
          type="error"
          message="Your session has expired. Please sign in again."
          fixed
        />
      )}

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/20 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <IsbatLogo size={80} />
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">ISBAT University</h1>
              <p className="text-sm text-blue-300">Academic Portal</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-[#2a1215] px-4 py-3 text-sm text-[#ff8a80]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="studentId"
                className="mb-1 block text-xs font-medium text-blue-200"
              >
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. ISB2024001"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-medium text-blue-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#60a5fa] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400 active:scale-95 disabled:opacity-60 transition-all"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} ISBAT University
          </p>
        </div>
      </div>
    </div>
  )
}
