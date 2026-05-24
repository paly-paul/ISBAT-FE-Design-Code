'use client'

import { useFetchAttendance } from '@/hooks/useFetchAttendance'
import { StatusBanner } from '@/components/common/StatusBanner'

function AttendanceBar({ percentage }: { percentage: number }) {
  const pct = Math.min(100, Math.max(0, percentage))
  const color =
    pct >= 75
      ? 'bg-emerald-400'
      : pct >= 60
        ? 'bg-amber-400'
        : 'bg-[#ff8a80]'

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span
        className={`w-10 text-right text-sm font-semibold ${
          pct >= 75
            ? 'text-emerald-400'
            : pct >= 60
              ? 'text-amber-400'
              : 'text-[#ff8a80]'
        }`}
      >
        {pct}%
      </span>
    </div>
  )
}

export function AttendanceTracker() {
  const { data, isLoading, isError, error } = useFetchAttendance()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/10" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <StatusBanner
        type="error"
        message={
          error instanceof Error
            ? error.message
            : 'Failed to load attendance records.'
        }
      />
    )
  }

  const records = data ?? []
  const below75 = records.filter((r) => r.percentage < 75)

  return (
    <div className="space-y-4">
      {below75.length > 0 && (
        <StatusBanner
          type="error"
          message={`Attendance warning: ${below75.length} course(s) below the 75% threshold.`}
        />
      )}

      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.courseCode}
            className="rounded-xl bg-white/10 px-4 py-4 ring-1 ring-white/20"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {record.courseName}
                </p>
                <p className="mt-0.5 text-xs text-blue-300">
                  {record.courseCode} · {record.attended}/{record.total} classes
                </p>
              </div>
              {record.percentage < 75 && (
                <span className="shrink-0 rounded-full bg-[#2a1215] px-2 py-0.5 text-xs font-medium text-[#ff8a80] ring-1 ring-red-900/60">
                  Low
                </span>
              )}
            </div>
            <AttendanceBar percentage={record.percentage} />
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div className="py-12 text-center text-sm text-blue-300">
          No attendance records found for this semester.
        </div>
      )}
    </div>
  )
}
