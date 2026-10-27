'use client'

import React from 'react'

interface ProfileIdentityCardProps {
  displayName: string
  email: string
  phone: string
  photo: string | null
  handlePhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  copied: boolean
  onCopyStaffId: () => void
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (!parts[0]) return 'JO'
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function ProfileIdentityCard({
  displayName,
  email,
  phone,
  photo,
  handlePhoto,
  copied,
  onCopyStaffId,
}: ProfileIdentityCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <section className="profile-hero" aria-label="Profile identity">
      <div className="profile-hero-pattern" aria-hidden="true" />
      <div className="profile-hero-main">
        <div className="profile-avatar-wrap">
          <label className="profile-avatar" title="Click to update profile photo">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              aria-label="Upload profile photo"
            />
            {photo ? <img src={photo} alt={displayName} /> : <span>{initials(displayName)}</span>}
          </label>
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={() => fileInputRef.current?.click()}
            title="Edit profile photo"
            aria-label="Edit profile photo"
          >
            <i className="lni lni-pencil" />
          </button>
        </div>

        <div className="profile-hero-identity">
          <div className="profile-hero-kicker">STAFF ACCOUNT <span><i className="lni lni-checkmark-circle" /> VERIFIED</span></div>
          <h2>{displayName}</h2>
          <p>System Administrator <span className="profile-hero-divider">/</span> Academic Affairs</p>
          <div className="profile-hero-tags">
            <button type="button" className="profile-id-chip" onClick={onCopyStaffId} title="Copy Staff ID">
              <i className={`lni ${copied ? 'lni-checkmark' : 'lni-clipboard'}`} />
              {copied ? 'Copied!' : 'AR-2024-0001'}
            </button>
            <span className="profile-active-chip"><span /> Active staff</span>
          </div>
        </div>
      </div>

      <div className="profile-hero-contact">
        <div className="profile-hero-contact-item">
          <span className="profile-hero-contact-icon"><i className="lni lni-envelope" /></span>
          <span><small>OFFICIAL EMAIL</small><strong title={email}>{email}</strong></span>
        </div>
        <div className="profile-hero-contact-item">
          <span className="profile-hero-contact-icon"><i className="lni lni-phone" /></span>
          <span><small>PRIMARY PHONE</small><strong>{phone}</strong></span>
        </div>
        <div className="profile-hero-campus">
          <i className="lni lni-map-marker" /> Main Campus, Kampala
        </div>
      </div>
    </section>
  )
}
