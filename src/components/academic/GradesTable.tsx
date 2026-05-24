'use client'

import { useFetchGrades } from '@/hooks/useFetchGrades'
import { StatusBanner } from '@/components/common/StatusBanner'

type GradeRow = {
  courseCode: string
  courseName: string
  credits: number
  grade: string
  gradePoints: number
  semester: string
  status: 'Pass' | 'Fail' | 'Pending'
}

const STATUS_BADGE: Record<GradeRow['status'], string> = {
  Pass: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
  Fail: 'bg-red-500/20 text-[#ff8a80] ring-1 ring-red-500/30',
  Pending: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
}

export function GradesTable() {
  const { data, isLoading, isError, error } = useFetchGrades()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/10" />
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
            : 'Failed to load grades. Please try again.'
        }
      />
    )
  }

  const grades = data ?? []

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/20">
      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/10 text-left">
              {['Code', 'Course', 'Credits', 'Grade', 'Points', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-300"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {grades.map((row, i) => (
              <tr
                key={row.courseCode}
                className={`border-t border-white/10 transition-colors hover:bg-white/5 ${
                  i % 2 === 0 ? 'bg-white/[0.03]' : ''
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs text-blue-300">
                  {row.courseCode}
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  {row.courseName}
                </td>
                <td className="px-4 py-3 text-blue-200">{row.credits}</td>
                <td className="px-4 py-3 font-bold text-[#60a5fa]">
                  {row.grade}
                </td>
                <td className="px-4 py-3 text-blue-200">{row.gradePoints.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack */}
      <div className="sm:hidden divide-y divide-white/10">
        {grades.map((row) => (
          <div key={row.courseCode} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{row.courseName}</p>
                <p className="mt-0.5 text-xs text-blue-300">
                  {row.courseCode} · {row.credits} credits
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-[#60a5fa]">
                  {row.grade}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                >
                  {row.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {grades.length === 0 && (
        <div className="py-12 text-center text-sm text-blue-300">
          No grade records found for this semester.
        </div>
      )}
    </div>
  )
}
