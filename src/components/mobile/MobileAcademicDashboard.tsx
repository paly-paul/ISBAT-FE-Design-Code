import { IsbatLogo } from '@/components/common/IsbatLogo'
import { BottomNav } from './BottomNav'

interface MobileAcademicDashboardProps {
  children: React.ReactNode
}

export function MobileAcademicDashboard({
  children,
}: MobileAcademicDashboardProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#2d448f]">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#1e2f6a] px-4 py-3">
        <div className="flex items-center gap-2">
          <IsbatLogo size={32} />
          <span className="text-sm font-bold text-white">ISBAT</span>
        </div>
        <button
          aria-label="Open notifications"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
        >
          🔔
        </button>
      </header>

      {/* Scrollable content — padded for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <BottomNav />
    </div>
  )
}
