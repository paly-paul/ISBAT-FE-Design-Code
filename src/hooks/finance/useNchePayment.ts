import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNchePayment,
  deleteNchePayment,
  getNchePaymentHistory,
  getNcheSemesterStatus,
  updateNchePayment,
  NchePaymentInput,
  NchePaymentUpdateInput,
} from '@/lib/api/finance/nchePayment'
import { invalidateAfterCategoryPayment } from './usePaymentConsole'

const NCHE_KEY = ['nche-payment']

export function useCreateNchePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NchePaymentInput) => createNchePayment(input),
    // Same invalidation Payment Console's own category-payment mutations
    // use — NCHE's outstanding-all entry and payment-history both go stale
    // the moment this lands, regardless of which page recorded it — plus
    // this page's own history/semester-status queries.
    onSuccess: (_result, input) => {
      invalidateAfterCategoryPayment(queryClient, input.applicationGuid)
      if (input.studentGuid) queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'history', input.studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'semester-status', input.applicationGuid] })
    },
  })
}

export function useUpdateNchePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentNcheGuid, input, applicationGuid, studentGuid }: { paymentNcheGuid: string; input: NchePaymentUpdateInput; applicationGuid: string; studentGuid: string | null }) =>
      updateNchePayment(paymentNcheGuid, input),
    onSuccess: (_result, { applicationGuid, studentGuid }) => {
      invalidateAfterCategoryPayment(queryClient, applicationGuid)
      if (studentGuid) queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'history', studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'semester-status', applicationGuid] })
    },
  })
}

export function useDeleteNchePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentNcheGuid }: { paymentNcheGuid: string; applicationGuid: string; studentGuid: string | null }) =>
      deleteNchePayment(paymentNcheGuid),
    onSuccess: (_result, { applicationGuid, studentGuid }) => {
      invalidateAfterCategoryPayment(queryClient, applicationGuid)
      if (studentGuid) queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'history', studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...NCHE_KEY, 'semester-status', applicationGuid] })
    },
  })
}

export function useNchePaymentHistory(studentGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...NCHE_KEY, 'history', studentGuid],
    queryFn: () => getNchePaymentHistory(studentGuid as string),
    enabled: enabled && !!studentGuid,
  })
}

export function useNcheSemesterStatus(applicationGuid: string | null, enabled: boolean, studentGuid?: string | null) {
  return useQuery({
    queryKey: [...NCHE_KEY, 'semester-status', applicationGuid, studentGuid],
    // getNcheSemesterStatus never rejects (see its own comment) — any
    // failure, including the 404 seen live before this route exists on the
    // backend, resolves to null instead, so there's nothing here for
    // react-query's retry to act on.
    queryFn: () => getNcheSemesterStatus(applicationGuid as string, studentGuid),
    enabled: enabled && !!applicationGuid,
  })
}

export type { NchePaymentInput, NchePaymentResult, NchePaymentUpdateInput, NchePaymentHistoryEntry, NcheSemesterStatus } from '@/lib/api/finance/nchePayment'
