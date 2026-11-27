'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Full-size view of a person's photo, opened by clicking their avatar.
// Closes with ✕ or Escape. Like the app's modals, a click on the backdrop
// does nothing. Focus stays inside while open and returns to the avatar
// after. Styles: .photo-lb* in globals.css.
interface PhotoLightboxProps {
  src: string
  name: string
  subtitle?: string | null
  onClose: () => void
  // Optional second control, e.g. "Change photo" on the profile pages.
  action?: { label: string; icon: string; onClick: () => void }
}

export function PhotoLightbox({ src, name, subtitle, onClose, action }: PhotoLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [failed, setFailed] = useState(false)
  // Callers pass an inline onClose; a ref keeps the effect below to one run
  // per open, so focus isn't re-grabbed on every re-render.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'))
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="photo-lb" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Photo of ${name}`}>
      <button ref={closeRef} type="button" className="photo-lb-close" onClick={onClose} aria-label="Close photo">
        <i className="lni lni-close" aria-hidden="true"></i>
      </button>
      <figure className="photo-lb-figure">
        {/* The caption sits inside the white frame: the backdrop is only a
            blur of the page, so text on it would have no reliable contrast. */}
        <div className="photo-lb-frame">
          {failed
            ? <div className="photo-lb-error" role="status">This photo couldn’t be loaded.</div>
            : <img src={src} alt={`Photo of ${name}`} onError={() => setFailed(true)} />}
          <figcaption className="photo-lb-caption">
            <div className="photo-lb-name">{name}</div>
            {subtitle && <div className="photo-lb-sub">{subtitle}</div>}
          </figcaption>
        </div>
        {action && (
          <button type="button" className="photo-lb-action" onClick={action.onClick}>
            <i className={`lni ${action.icon}`} aria-hidden="true"></i> {action.label}
          </button>
        )}
      </figure>
    </div>,
    document.body,
  )
}

// An avatar that opens the viewer on click. Takes the avatar's own class
// (and style) so it keeps its look; the button resets in globals.css have
// zero specificity, so that class always wins.
export function PhotoZoom({ src, name, subtitle, className, style, children }: {
  src: string
  name: string
  subtitle?: string | null
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`photo-zoom${className ? ` ${className}` : ''}`}
        style={style}
        title="View photo"
        aria-label={`View ${name}’s photo`}
        onClick={e => { e.stopPropagation(); setOpen(true) }}
      >
        {children}
      </button>
      {open && <PhotoLightbox src={src} name={name} subtitle={subtitle} onClose={() => setOpen(false)} />}
    </>
  )
}
