import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUeDetailedMarks, saveStudentUeMark, verifyUeMarks, UeDetailedMarksGridDto, UeMarkValues } from '@/lib/api/assessment/ueMarks'

export function useUeDetailedMarks(universityExamGuid: string | null) {
  return useQuery({
    queryKey: ['ue-detailed-marks', universityExamGuid],
    queryFn: () => getUeDetailedMarks(universityExamGuid!),
    enabled: !!universityExamGuid,
  })
}

// The API saves one student per PUT, so "Save All" fans out one call per
// edited row. allSettled so one rejected row doesn't hide which others
// saved; the grid is refetched once at the end (not per row) to pick up the
// server-computed totalMark.
export function useSaveUeMarks(universityExamGuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: { studentGuid: string, marks: UeMarkValues }[]) =>
      Promise.allSettled(entries.map(e => saveStudentUeMark(universityExamGuid, e.studentGuid, e.marks))),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ue-detailed-marks', universityExamGuid] })
    }
  })
}

export function useVerifyUeMarks(universityExamGuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => verifyUeMarks(universityExamGuid),
    onSuccess: (data) => {
      // Update the query cache with isVerified: true
      queryClient.setQueryData<UeDetailedMarksGridDto | undefined>(
        ['ue-detailed-marks', universityExamGuid],
        (old) => old ? { ...old, isVerified: data.isVerified } : old
      )
    }
  })
}
