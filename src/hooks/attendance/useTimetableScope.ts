import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTimetableIntakes } from '@/hooks/academic/useTimetable'
import { useLecturerTimetables } from './useClassAttendance'
import { getReportIntakes, getReportLecturers, getReportTerms } from '@/lib/api/attendance/attendanceReports'
import { getLoggedInUserGuid } from '@/lib/session'

const KEY = ['attendance', 'reports'] as const

// Intake → Term → Lecturer → that lecturer's timetabled slots, for the class
// attendance pages (the spec names no timetable-list endpoint). Starts on the
// current intake and, when they're timetabled, the logged-in lecturer. Each
// level clears the ones below it.
export function useTimetableScope() {
  const [intakeGuid, setIntake] = useState('')
  const [term, setTermState] = useState('')
  const [lecturerGuid, setLecturer] = useState('')

  const intakesQ = useQuery({ queryKey: [...KEY, 'intakes'], queryFn: getReportIntakes, staleTime: Infinity })
  const termsQ = useQuery({ queryKey: [...KEY, 'terms', intakeGuid], queryFn: () => getReportTerms(intakeGuid), enabled: !!intakeGuid, staleTime: Infinity })
  const lecturersQ = useQuery({
    queryKey: [...KEY, 'lecturers', intakeGuid, term],
    queryFn: () => getReportLecturers(intakeGuid, +term),
    enabled: !!intakeGuid && !!term,
    staleTime: Infinity,
  })
  const timetablesQ = useLecturerTimetables(intakeGuid || null, +term || 0, lecturerGuid || null)
  const { data: timetableIntakes } = useTimetableIntakes()

  // Defaults, applied once each when their list arrives.
  const [intakeDefaulted, setIntakeDefaulted] = useState(false)
  useEffect(() => {
    if (intakeDefaulted || !intakesQ.data) return
    const current = timetableIntakes?.currentIntakeGuid
    if (current && intakesQ.data.some(o => o.value === current)) setIntake(current)
    setIntakeDefaulted(true)
  }, [intakeDefaulted, intakesQ.data, timetableIntakes])

  const [lecturerDefaultedFor, setLecturerDefaultedFor] = useState('')
  useEffect(() => {
    const scope = `${intakeGuid}|${term}`
    if (!lecturersQ.data || lecturerDefaultedFor === scope || lecturerGuid) return
    const me = getLoggedInUserGuid()
    if (me && lecturersQ.data.some(o => o.value === me)) setLecturer(me)
    setLecturerDefaultedFor(scope)
  }, [lecturersQ.data, intakeGuid, term, lecturerGuid, lecturerDefaultedFor])

  const timetables = useMemo(() => timetablesQ.data ?? [], [timetablesQ.data])

  return {
    intakeGuid, term, lecturerGuid, timetables,
    intakesQ, termsQ, lecturersQ, timetablesQ,
    setIntake(v: string) { setIntake(v); setTermState(''); setLecturer('') },
    setTerm(v: string) { setTermState(v); setLecturer('') },
    setLecturer,
  }
}
