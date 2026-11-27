'use client'
import { useState } from 'react'
import { sameOriginApiUrl } from '@/lib/apiFileUrl'
import { PhotoZoom } from '@/components/PhotoLightbox'

// A student's photo inside an existing avatar box (.pcx-avatar,
// .pc-hero-avatar), falling back to initials when there's no photo or it
// fails to load. photoUrl is a signed, expiring link from the API (payment
// console profile, student statement): used as returned, never stored. It's
// routed through our own /api origin so the login cookies go with it.
// With a `name`, a shown photo opens full size on click (PhotoLightbox).
export function StudentAvatar({ photoUrl, initials, className, name, subtitle }: {
  photoUrl: string | null | undefined
  initials: React.ReactNode
  className: string
  name?: string | null
  subtitle?: string | null
}) {
  const src = sameOriginApiUrl(photoUrl)
  // Remembers which link failed, so a new link (another student, or the
  // same student re-fetched) gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showPhoto = !!src && failedSrc !== src
  const img = showPhoto ? <img src={src} alt="" onError={() => setFailedSrc(src)} /> : null

  if (img && src && name) {
    return <PhotoZoom src={src} name={name} subtitle={subtitle} className={className}>{img}</PhotoZoom>
  }
  return (
    <div className={className} aria-hidden="true">
      {img ?? initials}
    </div>
  )
}
