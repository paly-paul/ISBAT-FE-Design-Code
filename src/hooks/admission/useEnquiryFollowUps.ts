import { useMutation, useQuery } from '@tanstack/react-query'
import { createEnquiryFollowUp, EnquiryFollowUpInput, EnquiryFollowUpListItem, getEnquiryFollowUps, getEnquiryFollowUpsByAdvisor } from '@/lib/api/admission/enquiryFollowUp'

const ENQUIRY_FOLLOW_UPS_KEY = ['enquiryFollowUps']
const ENQUIRY_FOLLOW_UPS_BY_ADVISOR_KEY = ['enquiryFollowUpsByAdvisor']

// Real (paginated) — 917 rows in the sample data.
export function useEnquiryFollowUps(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...ENQUIRY_FOLLOW_UPS_KEY, page, pageSize],
    queryFn: () => getEnquiryFollowUps(page, pageSize),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Real (paginated), scoped to the authenticated advisor server-side. Kept
// under a distinct query key from useEnquiryFollowUps so the two lists
// cache independently.
export function useEnquiryFollowUpsByAdvisor(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...ENQUIRY_FOLLOW_UPS_BY_ADVISOR_KEY, page, pageSize],
    queryFn: () => getEnquiryFollowUpsByAdvisor(page, pageSize),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// No onSuccess invalidation — the list endpoint doesn't echo back enough to
// know for certain the create actually landed correctly (see the note on
// EnquiryFollowUpInput), so let the page decide whether to refetch.
export function useCreateEnquiryFollowUp() {
  return useMutation({
    mutationFn: (input: EnquiryFollowUpInput) => createEnquiryFollowUp(input),
  })
}

export type { EnquiryFollowUpInput, EnquiryFollowUpListItem }
