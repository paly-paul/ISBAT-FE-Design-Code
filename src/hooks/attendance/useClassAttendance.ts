import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAttendanceSession,
  getAttendanceBatches,
  getAttendanceCourseUnits,
  getAttendanceSessions,
  getOutlinesByUnit,
  getPendingOutlineSessions,
  getSessionByGuid,
  getSessionByTimetableDate,
  getSessionStudents,
  getTimetables,
  recordAttendance,
  RecordAttendanceInput,
} from '@/lib/api/attendance/classAttendance'

const KEY = ['classAttendance']

export function useAttendanceTimetables() {
  return useQuery({ queryKey: [...KEY, 'timetables'], queryFn: getTimetables, staleTime: Infinity })
}

export function useAttendanceBatches() {
  return useQuery({ queryKey: [...KEY, 'batches'], queryFn: getAttendanceBatches, staleTime: Infinity })
}

export function useAttendanceCourseUnits() {
  return useQuery({ queryKey: [...KEY, 'courseUnits'], queryFn: getAttendanceCourseUnits, staleTime: Infinity })
}

export function useAttendanceSession(timetableGuid: string | null, date: string | null) {
  return useQuery({
    queryKey: [...KEY, 'session', timetableGuid, date],
    queryFn: () => getSessionByTimetableDate(timetableGuid as string, date as string),
    enabled: !!timetableGuid && !!date,
  })
}

export function useAttendanceSessionByGuid(guid: string | null) {
  return useQuery({
    queryKey: [...KEY, 'byGuid', guid],
    queryFn: () => getSessionByGuid(guid as string),
    enabled: !!guid,
  })
}

export function useSessionStudents(timetableGuid: string | null, date: string | null) {
  return useQuery({
    queryKey: [...KEY, 'students', timetableGuid, date],
    queryFn: () => getSessionStudents(timetableGuid as string, date as string),
    enabled: !!timetableGuid && !!date,
  })
}

export function useOutlinesByUnit(courseUnitGuid: string | null) {
  return useQuery({
    queryKey: [...KEY, 'outlines', courseUnitGuid],
    queryFn: () => getOutlinesByUnit(courseUnitGuid as string),
    enabled: !!courseUnitGuid,
    staleTime: Infinity,
  })
}

export function usePendingOutlineSessions(timetableGuid: string | null) {
  return useQuery({
    queryKey: [...KEY, 'pending', timetableGuid],
    queryFn: () => getPendingOutlineSessions(timetableGuid as string),
    enabled: !!timetableGuid,
  })
}

export function useAttendanceSessions(page: number, pageSize: number, filters: { batchGuid?: string; courseUnitGuid?: string }) {
  return useQuery({
    queryKey: [...KEY, 'list', page, pageSize, filters.batchGuid ?? '', filters.courseUnitGuid ?? ''],
    queryFn: () => getAttendanceSessions(page, pageSize, filters),
    placeholderData: keepPreviousData,
  })
}

// Saving changes the session, its roster, the pending list and the
// management list, so every attendance query is refreshed.
export function useRecordAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordAttendanceInput) => recordAttendance(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAttendanceSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteAttendanceSession(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
