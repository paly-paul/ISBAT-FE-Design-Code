import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { ScheduleResponseSchema, type ScheduleSlot } from '@/lib/schemas/schedule'

async function fetchSchedule(): Promise<ScheduleSlot[]> {
  const raw = await apiClient.get('/api/v1/academic/schedule')
  const parsed = ScheduleResponseSchema.parse(raw)
  return parsed.data
}

export function useFetchSchedule() {
  return useQuery({
    queryKey: ['academic', 'schedule'],
    queryFn: fetchSchedule,
  })
}
