'use client'

interface ToastProps {
  toast: { msg: string; type: string } | null
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null
  const rawType = (toast.type || '').toLowerCase().trim()
  const normalizedType =
    rawType === 'error' || rawType === 'err' || rawType === 'danger'
      ? 'danger'
      : rawType === 'success' || rawType === 'ok'
      ? 'success'
      : rawType === 'warning' || rawType === 'warn'
      ? 'warn'
      : rawType === 'info'
      ? 'info'
      : rawType

  return (
    <div className={`toast${normalizedType ? ' toast-' + normalizedType : ''} show`}>
      {toast.msg}
    </div>
  )
}
