import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { AttendanceResponseSchema, type AttendanceRecord } from '@/lib/schemas/attendance'

async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const raw = await apiClient.get('/api/v1/academic/attendance')
  const parsed = AttendanceResponseSchema.parse(raw)
  return parsed.data
}

export function useFetchAttendance() {
  return useQuery({
    queryKey: ['academic', 'attendance'],
    queryFn: fetchAttendance,
  })
}
