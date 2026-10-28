'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Batch Summary was merged into Batch Management (2026-10-21). Kept as a
// client-side redirect so old links and bookmarks still land there — the
// static export can't use next.config redirects.
export default function Page() {
  const router = useRouter()
  useEffect(() => { router.replace('/academic/batch-management') }, [router])
  return null
}
