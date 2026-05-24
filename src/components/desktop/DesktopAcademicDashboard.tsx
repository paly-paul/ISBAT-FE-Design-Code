import { Sidebar } from './Sidebar'

interface DesktopAcademicDashboardProps {
  children: React.ReactNode
}

export function DesktopAcademicDashboard({
  children,
}: DesktopAcademicDashboardProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#2d448f]">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#2d448f]/80 px-6 backdrop-blur-sm">
          <h1 className="text-sm font-semibold text-white">
            Academic Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#60a5fa] text-xs font-bold text-white">
              ST
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
