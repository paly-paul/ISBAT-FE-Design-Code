'use client'
import { useRef, useState, useEffect } from 'react'

export function ScrollTable({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function check() {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    check()
    const el = ref.current
    const ro = new ResizeObserver(check)
    if (el) ro.observe(el)
    window.addEventListener('resize', check)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', check)
    }
  }, [])

  function scrollBy(dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' })
  }

  return (
    <div className="tbl-scroll-host">
      {canLeft && (
        <button className="tbl-arrow tbl-arrow-l" onClick={() => scrollBy('left')} aria-label="Scroll left">
          <i className="lni lni-chevron-left" />
        </button>
      )}
      <div ref={ref} className={`tbl-wrap${className ? ' ' + className : ''}`} onScroll={check}>
        {children}
      </div>
      {canRight && (
        <button className="tbl-arrow tbl-arrow-r" onClick={() => scrollBy('right')} aria-label="Scroll right">
          <i className="lni lni-chevron-right" />
        </button>
      )}
    </div>
  )
}
