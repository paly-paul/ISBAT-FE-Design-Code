'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IsbatLogo } from '@/components/common/IsbatLogo'

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/academic', icon: '⊞' },
  { label: 'Grades', href: '/academic/grades', icon: '📊' },
  { label: 'Schedule', href: '/academic/schedule', icon: '📅' },
  { label: 'Attendance', href: '/academic/attendance', icon: '✓' },
  { label: 'Courses', href: '/academic/courses', icon: '📚' },
  { label: 'Fees', href: '/academic/fees', icon: '💳' },
  { label: 'Documents', href: '/academic/documents', icon: '📄' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#1e2f6a] text-white shadow-2xl">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <IsbatLogo size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">
            ISBAT University
          </p>
          <p className="text-xs text-blue-300">Academic Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#60a5fa] text-white'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="w-5 text-center" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-300 hover:bg-white/10 hover:text-white transition-colors">
          <span aria-hidden="true">⏏</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
