import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import {
  ApplicationPaymentInput,
  createApplicationPayment,
  getApplicationPaymentExemptionTypes,
  getApplicationPaymentTypes,
  getUnconvertedEnquiries,
} from '@/lib/api/admission/applicationPayment'

const APPLICATION_PAYMENTS_KEY = ['application-payments']

export function useApplicationPaymentExemptionTypes() {
  return useQuery({
    queryKey: [...APPLICATION_PAYMENTS_KEY, 'exemption-types'],
    queryFn: () => getApplicationPaymentExemptionTypes(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Per Application_Payment_Change_Requests_Final_Updated.md #1/#2 — only
// enabled once an Intake has actually been picked, same "gate the dependent
// dropdown" convention as useApplicationPaymentFees/useSemestersForProgram.
export function useUnconvertedEnquiries(intakeGuid: string, page: number, pageSize: number, enabled: boolean, search = '') {
  return useQuery({
    queryKey: [...APPLICATION_PAYMENTS_KEY, 'unconverted-enquiries', intakeGuid, page, pageSize, search],
    queryFn: () => getUnconvertedEnquiries(intakeGuid, page, pageSize, search),
    enabled: enabled && !!intakeGuid,
  })
}

// Real server-paginated, scroll-to-load-more variant of the same endpoint —
// backs the Payment page's Enquiry picker (EnquirySearchPicker), replacing
// the old single pageSize=1000 "fetch nearly everything for this intake up
// front" SearchSelect. Same useInfiniteQuery + fetch-next-on-scroll
// mechanism as useSearchCourseUnitsInfinite (useCourseUnits.ts). searchTerm
// is CONFIRMED real server-side (2026-09-08, see getUnconvertedEnquiries)
// and part of the query key — each typed term's pages are cached
// separately, no client-side re-filtering.
export function useUnconvertedEnquiriesInfinite(intakeGuid: string, searchTerm: string, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...APPLICATION_PAYMENTS_KEY, 'unconverted-enquiries-infinite', intakeGuid, searchTerm, pageSize],
    queryFn: ({ pageParam }) => getUnconvertedEnquiries(intakeGuid, pageParam, pageSize, searchTerm),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.totalCount ? allPages.length + 1 : undefined
    },
    enabled: enabled && !!intakeGuid,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useApplicationPaymentTypes() {
  return useQuery({
    queryKey: [...APPLICATION_PAYMENTS_KEY, 'payment-types'],
    queryFn: () => getApplicationPaymentTypes(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateApplicationPayment() {
  return useMutation({
    mutationFn: (input: ApplicationPaymentInput) => createApplicationPayment(input),
  })
}

export type {
  ApplicationPaymentInput,
  BankAccountInfoDto,
  BatchInfoDto,
  ExemptionTypeDto,
  ProgramFeeHeadInfoDto,
  PaymentTypeDto,
  CreateApplicationPaymentResponse,
} from '@/lib/api/admission/applicationPayment'
