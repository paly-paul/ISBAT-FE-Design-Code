import { Suspense } from 'react'
import { GradesTable } from '@/components/academic/GradesTable'
import { CourseSchedule } from '@/components/academic/CourseSchedule'
import { AttendanceTracker } from '@/components/academic/AttendanceTracker'
import { StatusBanner } from '@/components/common/StatusBanner'

export const metadata = {
  title: 'Dashboard – ISBAT Academic Portal',
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-40 rounded bg-white/10" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-white/10" />
      ))}
    </div>
  )
}

export default function AcademicDashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <StatusBanner type="loading" message="Syncing academic records…" />

      {/* Quick stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'GPA', value: '3.72' },
            { label: 'Credits', value: '96' },
            { label: 'Attendance', value: '87%' },
            { label: 'Semester', value: 'S2 2024' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/10 p-4 ring-1 ring-white/20"
            >
              <p className="text-xs font-medium text-blue-300">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grades */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Academic Grades
        </h2>
        <Suspense fallback={<SectionSkeleton rows={6} />}>
          <GradesTable />
        </Suspense>
      </section>

      {/* Schedule */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Course Schedule
        </h2>
        <Suspense fallback={<SectionSkeleton rows={5} />}>
          <CourseSchedule />
        </Suspense>
      </section>

      {/* Attendance */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Attendance Tracker
        </h2>
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <AttendanceTracker />
        </Suspense>
      </section>
    </div>
  )
}
