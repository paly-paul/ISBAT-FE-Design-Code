import { useQuery } from '@tanstack/react-query'
import { getAdmissionDashboard, AdmissionDashboard, AdmissionSourceMixEntry, AdmissionConversionStep } from '@/lib/api/admission/dashboard'

// No intakeGuid = the current admission intake.
export function useAdmissionDashboard(intakeGuid?: string) {
  return useQuery({
    queryKey: ['admission', 'dashboard', intakeGuid ?? 'current'],
    queryFn: () => getAdmissionDashboard(intakeGuid),
  })
}

export type { AdmissionDashboard, AdmissionSourceMixEntry, AdmissionConversionStep }
