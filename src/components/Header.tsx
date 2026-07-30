'use client'
import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/lib/auth'
import { clearSessionIdentity } from '@/lib/session'

interface HeaderProps {
  panelOpen: boolean
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileOpen: boolean
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileRef: React.RefObject<HTMLDivElement>
  onSignOut: () => void
  displayName?: string
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

export function Header({ panelOpen, setPanelOpen, profileOpen, setProfileOpen, profileRef, onSignOut, displayName = 'Administrator' }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false)
  const queryClient = useQueryClient()

  async function handleSignOut(e: React.MouseEvent) {
    e.stopPropagation()
    setSigningOut(true)
    try {
      await logout()
    } catch {
      // Ignore — still sign the user out locally even if the API call fails.
    } finally {
      clearSessionIdentity()
      // onSignOut() navigates client-side (router.push), which does not
      // reset the app's single long-lived QueryClient (see providers.tsx) —
      // without this, every cached query (menu, employees, ...), including
      // any that's cached in an error state, survives into the next login
      // and can serve stale/wrong-user data or a stale error instead of a
      // genuinely fresh fetch.
      queryClient.clear()
      onSignOut()
    }
  }

  return (
    <header className="hdr">
      <div className="hdr-brand bg-bg">
        <div className="hdr-badge">IU</div>
        <button className="hdr-menu-btn" onClick={() => setPanelOpen(p => !p)} aria-label="Toggle menu">
          <i className={`lni ${panelOpen ? 'lni-close' : 'lni-menu'}`}></i>
        </button>
      </div>
      <div className="hdr-body">
        <div className="hdr-title-wrap">
          <div className="hdr-title">ISBAT University ERP</div>
          <div className="hdr-sub">Enterprise Resource Planning · Spring 2026</div>
        </div>
        <div className="hdr-right">
          <div className="hdr-module-pill acad"><i className="lni lni-graduation"></i> Academic</div>
          <div className="hdr-intake">Spring 2026 (20261)</div>
          <div className="hdr-user" ref={profileRef} onClick={() => setProfileOpen(p => !p)}>
            <div className="hdr-avatar">{initialsOf(displayName)}</div>
            <span>{displayName}</span>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  <div className="profile-dropdown-name">{displayName}</div>
                  <div className="profile-dropdown-role">System Admin · Academic</div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-signout"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <i className="lni lni-exit"></i> {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
