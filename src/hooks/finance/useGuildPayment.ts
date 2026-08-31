import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGuildPayment,
  deleteGuildPayment,
  getGuildPaymentHistory,
  getGuildPaymentsList,
  getGuildSemesterStatus,
  updateGuildPayment,
  GuildPaymentInput,
  GuildPaymentUpdateInput,
} from '@/lib/api/finance/guildPayment'
import { invalidateAfterCategoryPayment } from './usePaymentConsole'

const GUILD_KEY = ['guild-payment']

export function useCreateGuildPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuildPaymentInput) => createGuildPayment(input),
    onSuccess: (_result, input) => {
      invalidateAfterCategoryPayment(queryClient, input.applicationGuid)
      if (input.studentGuid) queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'history', input.studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'semester-status', input.applicationGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'list'] })
    },
  })
}

export function useUpdateGuildPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentGuildGuid, input }: { paymentGuildGuid: string; input: GuildPaymentUpdateInput; applicationGuid: string; studentGuid: string | null }) =>
      updateGuildPayment(paymentGuildGuid, input),
    onSuccess: (_result, { applicationGuid, studentGuid }) => {
      invalidateAfterCategoryPayment(queryClient, applicationGuid)
      if (studentGuid) queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'history', studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'semester-status', applicationGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'list'] })
    },
  })
}

export function useDeleteGuildPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentGuildGuid }: { paymentGuildGuid: string; applicationGuid: string; studentGuid: string | null }) =>
      deleteGuildPayment(paymentGuildGuid),
    onSuccess: (_result, { applicationGuid, studentGuid }) => {
      invalidateAfterCategoryPayment(queryClient, applicationGuid)
      if (studentGuid) queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'history', studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'semester-status', applicationGuid] })
      queryClient.invalidateQueries({ queryKey: [...GUILD_KEY, 'list'] })
    },
  })
}

export function useGuildPaymentHistory(studentGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...GUILD_KEY, 'history', studentGuid],
    queryFn: () => getGuildPaymentHistory(studentGuid as string),
    enabled: enabled && !!studentGuid,
  })
}

export function useGuildSemesterStatus(applicationGuid: string | null, enabled: boolean, studentGuid?: string | null) {
  return useQuery({
    queryKey: [...GUILD_KEY, 'semester-status', applicationGuid, studentGuid],
    queryFn: () => getGuildSemesterStatus(applicationGuid as string, studentGuid),
    enabled: enabled && !!applicationGuid,
  })
}

// Backs the Guild Payment Console list page — every payment in the system,
// paginated server-side, unrelated to whichever student the entry-form
// pages have loaded.
export function useGuildPaymentsList(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...GUILD_KEY, 'list', page, pageSize],
    queryFn: () => getGuildPaymentsList(page, pageSize),
  })
}

export type { GuildPaymentInput, GuildPaymentResult, GuildPaymentUpdateInput, GuildPaymentRecord, GuildSemesterStatus, PagedResult } from '@/lib/api/finance/guildPayment'
