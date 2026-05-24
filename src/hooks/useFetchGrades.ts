import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { GradesResponseSchema, type GradeRecord } from '@/lib/schemas/grades'

async function fetchGrades(): Promise<GradeRecord[]> {
  const raw = await apiClient.get('/api/v1/academic/grades')
  const parsed = GradesResponseSchema.parse(raw)
  return parsed.data
}

export function useFetchGrades() {
  return useQuery({
    queryKey: ['academic', 'grades'],
    queryFn: fetchGrades,
  })
}
