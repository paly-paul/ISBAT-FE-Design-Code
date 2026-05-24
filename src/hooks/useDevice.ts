'use client'

import { useState, useEffect } from 'react'

const MOBILE_UA_RE = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i
const MOBILE_BREAKPOINT = 768

export function useDevice() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (
      MOBILE_UA_RE.test(navigator.userAgent) ||
      window.innerWidth < MOBILE_BREAKPOINT
    )
  })

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    setIsMobile(mq.matches)

    return () => mq.removeEventListener('change', handler)
  }, [])

  return { isMobile, isDesktop: !isMobile }
}
