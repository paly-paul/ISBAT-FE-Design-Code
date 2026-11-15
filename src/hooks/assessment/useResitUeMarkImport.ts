import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  countMarkRows,
  downloadResitUeTemplate,
  getResitUeExams,
  getResitUeMarks,
  getResitUeStudents,
  importResitUeMarks,
  saveResitUeStudentMarks,
  ResitUeExamsParams,
  ResitUeImportRow,
  ResitUeMarkSheet,
} from '@/lib/api/assessment/resitUeMarkImport'

export const RESIT_UE_MARK_IMPORT_KEYS = {
  all: ['assessment-attendance-service', 'assessment', 'resit-ue-mark-import'] as const,
  exams: (params: ResitUeExamsParams) => [...RESIT_UE_MARK_IMPORT_KEYS.all, 'exams', params] as const,
  students: (resitScheduleGuid: string) => [...RESIT_UE_MARK_IMPORT_KEYS.all, 'students', resitScheduleGuid] as const,
  marks: (resitScheduleGuid: string) => [...RESIT_UE_MARK_IMPORT_KEYS.all, 'marks', resitScheduleGuid] as const,
}

export function useResitUeExams(params: ResitUeExamsParams, enabled = true) {
  return useQuery({
    queryKey: RESIT_UE_MARK_IMPORT_KEYS.exams(params),
    queryFn: () => getResitUeExams(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

// Loaded when the import drawer opens; staleTime 0 so "already imported" is
// current (another user may have imported or saved a row since).
export function useResitUeStudents(resitScheduleGuid: string | null) {
  return useQuery({
    queryKey: RESIT_UE_MARK_IMPORT_KEYS.students(resitScheduleGuid ?? ''),
    queryFn: () => getResitUeStudents(resitScheduleGuid as string),
    enabled: !!resitScheduleGuid,
    staleTime: 0,
  })
}

// The mark sheet of one exam, loaded once on open; reloaded explicitly after
// an import or a 409 (no automatic retry on error).
export function useResitUeMarks(resitScheduleGuid: string | null) {
  return useQuery({
    queryKey: RESIT_UE_MARK_IMPORT_KEYS.marks(resitScheduleGuid ?? ''),
    queryFn: () => getResitUeMarks(resitScheduleGuid as string),
    enabled: !!resitScheduleGuid,
    staleTime: 0,
    retry: false,
  })
}

export function useDownloadResitUeTemplate() {
  return useMutation({ mutationFn: (resitScheduleGuid: string) => downloadResitUeTemplate(resitScheduleGuid) })
}

export function useImportResitUeMarks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ resitScheduleGuid, rows }: { resitScheduleGuid: string; rows: ResitUeImportRow[] }) => importResitUeMarks(resitScheduleGuid, rows),
    // Counts/status change on success; the student list's "imported" flags
    // change on success and may be stale after a 409.
    onSettled: () => queryClient.invalidateQueries({ queryKey: RESIT_UE_MARK_IMPORT_KEYS.all }),
  })
}

// Saves one row and swaps the returned row into the cached mark sheet, then
// recounts the cards from the row statuses. The exam list's progress is
// marked stale so it is fresh on ‹ Back.
export function useSaveResitUeStudentMarks(resitScheduleGuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, marks }: { studentGuid: string; marks: Record<string, number> }) =>
      saveResitUeStudentMarks(resitScheduleGuid, studentGuid, marks),
    onSuccess: row => {
      queryClient.setQueryData<ResitUeMarkSheet>(RESIT_UE_MARK_IMPORT_KEYS.marks(resitScheduleGuid), old => {
        if (!old) return old
        const students = old.students.map(s => (s.studentGuid === row.studentGuid ? row : s))
        return { ...old, students, summary: countMarkRows(students) }
      })
      queryClient.invalidateQueries({ queryKey: [...RESIT_UE_MARK_IMPORT_KEYS.all, 'exams'], refetchType: 'none' })
    },
  })
}
