import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getPaidStudents, PaidStudent, PaidStudentsFilters, PaymentKindFilter } from '@/lib/api/admission/paidStudents'

// Server-paged; the previous page stays on screen while the next loads.
export function usePaidStudents(filters: PaidStudentsFilters) {
  return useQuery({
    queryKey: ['admission', 'paid-students', filters],
    queryFn: () => getPaidStudents(filters),
    placeholderData: keepPreviousData,
  })
}

export type { PaidStudent, PaidStudentsFilters, PaymentKindFilter }
