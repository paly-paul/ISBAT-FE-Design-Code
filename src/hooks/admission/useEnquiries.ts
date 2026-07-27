import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEnquiry, Enquiry, EnquiryInput, EnquiryUpdateInput, getEnquiries, getEnquiryById, updateEnquiry } from '@/lib/api/admission/enquiry'

const ENQUIRIES_KEY = ['enquiries']

// Real (paginated) — 11k+ rows in the sample data, so unlike the small
// master-data lists elsewhere in this app, this can't just fetch everything
// in one big page. page/pageSize are part of the query key so each page is
// cached separately.
export function useEnquiries(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...ENQUIRIES_KEY, page, pageSize],
    queryFn: () => getEnquiries(page, pageSize),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EnquiryInput) => createEnquiry(input),
    // Invalidates every cached page (partial key match), not just page 1.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENQUIRIES_KEY }),
  })
}

// Fetches a single enquiry for the assign/view modal. Only enabled while
// the modal is actually open with a guid, same convention as the other
// fetch-by-guid Edit modals in this app.
export function useEnquiry(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...ENQUIRIES_KEY, guid],
    queryFn: () => getEnquiryById(guid as string),
    enabled: enabled && !!guid,
  })
}

export function useUpdateEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: EnquiryUpdateInput }) => updateEnquiry(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: ENQUIRIES_KEY })
      queryClient.invalidateQueries({ queryKey: [...ENQUIRIES_KEY, guid] })
    },
  })
}

export type { Enquiry, EnquiryInput, EnquiryUpdateInput }
