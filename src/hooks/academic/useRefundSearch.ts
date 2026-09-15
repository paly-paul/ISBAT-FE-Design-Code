import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  PassoutLibraryDepositSearchParams,
  RefundSearchParams,
  searchFakeCertificateTerminations,
  searchPassoutLibraryDeposit,
  searchRejectedApplications,
} from '@/lib/api/academic/refundSearch'

const REFUND_SEARCH_KEY = ['refund-search']

// Backs Payment Console → Refund's three eligibility-search tabs. Paged like
// every other master table in this app (keepPreviousData so the page number
// doesn't flash empty between fetches) rather than the infinite-scroll
// pattern the old free-text student search used — these lists are meant to
// be reviewed row by row (and, for Passout/Library Deposit, bulk-selected),
// not typed past.
export function useRejectedApplicationsSearch(params: RefundSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: [...REFUND_SEARCH_KEY, 'rejected', params],
    queryFn: () => searchRejectedApplications(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function usePassoutLibraryDepositSearch(params: PassoutLibraryDepositSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: [...REFUND_SEARCH_KEY, 'passout-library-deposit', params],
    queryFn: () => searchPassoutLibraryDeposit(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useFakeCertificateTerminationsSearch(params: RefundSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: [...REFUND_SEARCH_KEY, 'fake-certificate', params],
    queryFn: () => searchFakeCertificateTerminations(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export type {
  PagedResult,
  PassoutLedgerLineDto,
  PassoutLibraryDepositRefundCandidateDto,
  PassoutLibraryDepositSearchParams,
  RefundSearchParams,
  RejectedApplicationRefundCandidateDto,
  TerminatedStudentRefundCandidateDto,
} from '@/lib/api/academic/refundSearch'
