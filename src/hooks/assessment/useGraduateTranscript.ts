import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getGraduateTranscriptPending,
  generateGraduateTranscripts,
  GraduateTranscriptGenerateRequest 
} from '@/lib/api/assessment/graduateTranscript'

export function useGraduateTranscriptPending(academicIntakeGuid: string | null, programGuid?: string | null) {
  return useQuery({
    queryKey: ['graduate-transcript-pending', academicIntakeGuid, programGuid],
    queryFn: () => getGraduateTranscriptPending(academicIntakeGuid!, programGuid || undefined),
    enabled: !!academicIntakeGuid && !!programGuid,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

export function useGenerateGraduateTranscripts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: GraduateTranscriptGenerateRequest) => generateGraduateTranscripts(req),
    onSuccess: (data, variables) => {
      // Invalidate the pending list so generated students disappear
      queryClient.invalidateQueries({ queryKey: ['graduate-transcript-pending', variables.academicIntakeGuid] })
    }
  })
}
