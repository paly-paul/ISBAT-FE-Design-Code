'use client'
import { useRef, useState, useEffect } from 'react'

export function ActionMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t))
        setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="act-menu">
      <button
        ref={triggerRef}
        className={`btn btn-neu btn-sm act-trigger${open ? ' open' : ''}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        Actions <i className={`lni lni-chevron-down act-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="act-menu-list"
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}
