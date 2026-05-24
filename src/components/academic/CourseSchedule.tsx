'use client'

import { useFetchSchedule } from '@/hooks/useFetchSchedule'
import { StatusBanner } from '@/components/common/StatusBanner'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAY_COLORS: Record<string, string> = {
  Mon: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  Tue: 'bg-purple-500/20 text-purple-300 ring-purple-500/30',
  Wed: 'bg-teal-500/20 text-teal-300 ring-teal-500/30',
  Thu: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  Fri: 'bg-pink-500/20 text-pink-300 ring-pink-500/30',
  Sat: 'bg-orange-500/20 text-orange-300 ring-orange-500/30',
}

export function CourseSchedule() {
  const { data, isLoading, isError, error } = useFetchSchedule()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/10" />
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
            : 'Failed to load schedule. Please try again.'
        }
      />
    )
  }

  const schedule = data ?? []

  // Group by day for a timetable-style view
  const byDay = DAY_ORDER.reduce<Record<string, typeof schedule>>((acc, day) => {
    acc[day] = schedule.filter((s) => s.day === day)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {DAY_ORDER.filter((day) => byDay[day].length > 0).map((day) => (
        <div key={day}>
          <div
            className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${DAY_COLORS[day] ?? 'bg-white/10 text-blue-200 ring-white/20'}`}
          >
            {day}
          </div>
          <div className="space-y-2">
            {byDay[day].map((slot) => (
              <div
                key={`${slot.courseCode}-${slot.startTime}`}
                className="flex items-center gap-4 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 hover:bg-white/[0.15] transition"
              >
                {/* Time */}
                <div className="w-28 shrink-0 text-sm text-blue-300">
                  <span className="font-mono">{slot.startTime}</span>
                  <span className="mx-1 text-white/30">–</span>
                  <span className="font-mono">{slot.endTime}</span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {slot.courseName}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-300">
                    {slot.courseCode} · {slot.lecturer}
                  </p>
                </div>

                {/* Room */}
                <div className="shrink-0 text-right">
                  <span className="inline-flex rounded-lg bg-[#2d448f] px-2 py-1 text-xs font-medium text-blue-200">
                    {slot.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {schedule.length === 0 && (
        <div className="py-12 text-center text-sm text-blue-300">
          No schedule entries found for this semester.
        </div>
      )}
    </div>
  )
}
