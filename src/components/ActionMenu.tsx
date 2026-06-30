'use client'
import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ActionMenuProps {
  children: React.ReactNode
  tooltip?: string
}

export function ActionMenu({ children, tooltip = 'Actions' }: ActionMenuProps) {
  const [open, setOpen]       = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0 })
  const [tipPos, setTipPos]   = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left + r.width / 2 })
    }
    setShowTip(false)
    setOpen(true)
  }

  function onMouseEnter() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setTipPos({ top: r.top - 30, left: r.left + r.width / 2 })
      setShowTip(true)
    }
  }

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t))
        setOpen(false)
    }
    function updatePos() {
      if (!triggerRef.current) return
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left + r.width / 2 })
    }
    function onScroll() { requestAnimationFrame(updatePos) }
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setOpen(false) },
      { threshold: 0 }
    )
    if (triggerRef.current) observer.observe(triggerRef.current)
    document.addEventListener('mousedown', handle)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('scroll', onScroll, true)
      observer.disconnect()
    }
  }, [open])

  return (
    <div className="act-menu">
      <button
        ref={triggerRef}
        className={`btn btn-neu btn-sm act-trigger${open ? ' open' : ''}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onMouseEnter={onMouseEnter}
        onMouseLeave={() => setShowTip(false)}
      >
        <i className="lni lni-more-alt" style={{ fontSize: 15 }} />
      </button>

      {showTip && !open && createPortal(
        <div style={{
          position: 'fixed',
          top: tipPos.top,
          left: tipPos.left,
          transform: 'translateX(-50%)',
          background: 'var(--g900)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '4px 9px',
          borderRadius: 'var(--rxs)',
          pointerEvents: 'none',
          zIndex: 10000,
          whiteSpace: 'nowrap',
          letterSpacing: '.02em',
        }}>
          {tooltip}
        </div>,
        document.body
      )}

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="act-menu-list"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  )
}
