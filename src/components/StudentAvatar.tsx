'use client'
import { useState } from 'react'
import { sameOriginApiUrl } from '@/lib/apiFileUrl'

// A student's photo inside an existing avatar box (.pcx-avatar,
// .pc-hero-avatar), falling back to initials when there's no photo or it
// fails to load. photoUrl is a signed, expiring link from the API (payment
// console profile, student statement): used as returned, never stored. It's
// routed through our own /api origin so the login cookies go with it.
export function StudentAvatar({ photoUrl, initials, className }: {
  photoUrl: string | null | undefined
  initials: React.ReactNode
  className: string
}) {
  const src = sameOriginApiUrl(photoUrl)
  // Remembers which link failed, so a new link (another student, or the
  // same student re-fetched) gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showPhoto = !!src && failedSrc !== src

  return (
    <div className={className} aria-hidden="true">
      {showPhoto ? <img src={src} alt="" onError={() => setFailedSrc(src)} /> : initials}
    </div>
  )
}
