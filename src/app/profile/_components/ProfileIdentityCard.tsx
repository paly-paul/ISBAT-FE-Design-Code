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
    <div className="profile-left-col">
      {/* Identity Card — Clean White Card without top banner */}
      <div className="card" style={{ padding: '20px', margin: 0 }}>
        {/* Horizontal Header: Photo circle on left, Name & Designation in front of it */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Circle Photo Upload with Visible Edit Pencil Badge */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <label
              title="Click to update profile photo"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'block',
                boxShadow: '0 3px 10px rgba(15, 23, 42, 0.12)',
                border: '2.5px solid var(--b300)',
                background: 'linear-gradient(135deg, var(--b700), var(--b500))',
                overflow: 'hidden',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 4 }}
              />
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 24,
                    letterSpacing: '0.04em',
                  }}
                >
                  {initials(displayName)}
                </div>
              )}
            </label>

            {/* Permanently Visible Floating Edit Icon Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Edit profile photo"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--b600)',
                color: '#ffffff',
                border: '2px solid var(--white)',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'var(--tr)',
                padding: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--b700)'
                e.currentTarget.style.transform = 'scale(1.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--b600)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <i className="lni lni-pencil" style={{ fontSize: 11 }}></i>
            </button>
          </div>

          {/* User Details next to the Avatar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--g900)',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={displayName}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--g500)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              System Administrator
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onCopyStaffId}
                title="Click to copy Staff ID"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'var(--surface)',
                  border: '1.5px solid var(--g200)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--g700)',
                  cursor: 'pointer',
                  transition: 'var(--tr)',
                }}
              >
                <i className={`lni ${copied ? 'lni-checkmark text-green' : 'lni-clipboard text-b700'}`}></i>
                <span className="font-mono">{copied ? 'Copied!' : 'AR-2024-0001'}</span>
              </button>
              <span className="badge badge-green" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                <span className="bdot"></span> Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info Strip */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: '1px solid var(--g200)',
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'var(--b50)',
                color: 'var(--b700)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <i className="lni lni-envelope"></i>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--g400)' }}>
                Official Email
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--g800)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={email}
              >
                {email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'var(--green-bg)',
                color: 'var(--green)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <i className="lni lni-phone"></i>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--g400)' }}>
                Primary Phone
              </div>
              <div style={{ fontWeight: 600, color: 'var(--g800)' }}>{phone}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'var(--b50)',
                color: 'var(--b600)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <i className="lni lni-briefcase"></i>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--g400)' }}>
                Department &amp; Campus
              </div>
              <div style={{ fontWeight: 600, color: 'var(--g800)' }}>
                Academic Affairs · Main Campus
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'var(--surface)',
                color: 'var(--g500)',
                border: '1px solid var(--g200)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <i className="lni lni-calendar"></i>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--g400)' }}>
                Member Since
              </div>
              <div style={{ fontWeight: 600, color: 'var(--g800)' }}>January 2024 (Full-time)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security & Institutional Status Card */}
      <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--g900)' }}>
            <i className="lni lni-shield text-b700" style={{ fontSize: 16 }}></i>
            Security &amp; Status
          </div>
          <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 7px' }}>
            <span className="bdot"></span> Verified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--g500)', fontWeight: 500 }}>Authentication:</span>
            <span style={{ color: 'var(--g800)', fontWeight: 600 }}>Single-Factor (Active)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--g500)', fontWeight: 500 }}>Active Sessions:</span>
            <span style={{ color: 'var(--b700)', fontWeight: 700 }}>3 Connected Devices</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--g500)', fontWeight: 500 }}>HR Status:</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>Approved Staff</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--g200)',
            fontSize: 11,
            color: 'var(--g500)',
            lineHeight: 1.4,
          }}
        >
          Your ERP profile is managed centrally. Always sign out when using shared campus workstations.
        </div>
      </div>
    </div>
  )
}
