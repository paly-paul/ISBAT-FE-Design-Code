'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavTab {
  label: string
  href: string
  icon: string
}

const TABS: NavTab[] = [
  { label: 'Home', href: '/academic', icon: '⊞' },
  { label: 'Grades', href: '/academic/grades', icon: '📊' },
  { label: 'Schedule', href: '/academic/schedule', icon: '📅' },
  { label: 'Attendance', href: '/academic/attendance', icon: '✓' },
  { label: 'More', href: '/academic/more', icon: '⋯' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/10 bg-[#1e2f6a] pb-safe"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              active ? 'text-[#60a5fa]' : 'text-blue-300 hover:text-white'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
