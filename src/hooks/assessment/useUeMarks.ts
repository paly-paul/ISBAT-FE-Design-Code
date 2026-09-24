import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUeDetailedMarks, saveStudentUeMark, verifyUeMarks, UeDetailedMarksGridDto } from '@/lib/api/assessment/ueMarks'

export function useUeDetailedMarks(universityExamGuid: string | null) {
  return useQuery({
    queryKey: ['ue-detailed-marks', universityExamGuid],
    queryFn: () => getUeDetailedMarks(universityExamGuid!),
    enabled: !!universityExamGuid,
  })
}

export function useSaveStudentUeMark(universityExamGuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, mark, isAbsent }: { studentGuid: string, mark: number | null, isAbsent: boolean }) => 
      saveStudentUeMark(universityExamGuid, studentGuid, { mark, isAbsent }),
    onSuccess: () => {
      // We can invalidate, but usually we just let local state handle it, or background refetch
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
