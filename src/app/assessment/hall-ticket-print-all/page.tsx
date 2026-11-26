'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Hall Ticket Print All was merged into /assessment/hall-ticket?tab=print-all (2026-11-26).
// Kept as a client-side redirect so old links and bookmarks keep working.
export default function HallTicketPrintAllRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/assessment/hall-ticket?tab=print-all')
  }, [router])
  return null
}
