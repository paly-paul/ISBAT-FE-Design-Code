'use client'

import { useState, useEffect } from 'react'

type BannerType = 'loading' | 'error' | 'success' | 'info'

interface StatusBannerProps {
  type: BannerType
  message: string
  /** Render as a fixed overlay (bottom-right pill) instead of inline */
  fixed?: boolean
  /** Auto-dismiss after ms — omit to persist */
  autoDismissMs?: number
}

const STYLES: Record<BannerType, string> = {
  loading:
    'bg-white text-gray-600 shadow-md ring-1 ring-gray-200/60',
  error:
    'bg-[#2a1215] text-[#ff8a80] ring-1 ring-red-900/60',
  success:
    'bg-emerald-950 text-emerald-300 ring-1 ring-emerald-800/60',
  info: 'bg-[#2d448f] text-blue-200 ring-1 ring-blue-700/60',
}

const ICONS: Record<BannerType, string> = {
  loading: '⏳',
  error: '⚠',
  success: '✓',
  info: 'ℹ',
}

export function StatusBanner({
  type,
  message,
  fixed = false,
  autoDismissMs,
}: StatusBannerProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!autoDismissMs) return
    const t = setTimeout(() => setVisible(false), autoDismissMs)
    return () => clearTimeout(t)
  }, [autoDismissMs])

  if (!visible) return null

  const base = `flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${STYLES[type]}`

  if (fixed) {
    return (
      <div
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        className={`fixed bottom-5 right-5 z-[10000] ${base}`}
      >
        <span aria-hidden="true">{ICONS[type]}</span>
        <span>{message}</span>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
          className="ml-2 opacity-60 hover:opacity-100 transition"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={base}
    >
      <span aria-hidden="true">{ICONS[type]}</span>
      <span>{message}</span>
    </div>
  )
}
