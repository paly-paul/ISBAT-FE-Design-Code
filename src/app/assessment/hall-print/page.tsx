'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Hall Ticket Print was merged into /assessment/hall-ticket?tab=print (2026-11-26).
// Kept as a client-side redirect so old links and bookmarks keep working.
export default function HallTicketPrintRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', 'print')
    router.replace(`/assessment/hall-ticket?${params.toString()}`)
  }, [router])
  return null
}
