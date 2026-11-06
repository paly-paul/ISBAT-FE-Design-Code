import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteOdelQualification,
  getOdelPaymentSlip,
  getOdelPhoto,
  getOdelQualifications,
  OdelQualificationInput,
  OdelSaveGeneralInput,
  OdelSearchInput,
  saveOdelGeneral,
  saveOdelQualification,
  searchOdelApplication,
  uploadOdelPaymentSlip,
  uploadOdelPhoto,
} from '@/lib/api/admission/odelApplication'

const ODEL_KEY = ['odel-application']

// Search is an action (ref no. + email), not cached data — a mutation, like
// the other "look something up on submit" calls in this app.
export function useSearchOdelApplication() {
  return useMutation({
    mutationFn: (input: OdelSearchInput) => searchOdelApplication(input),
  })
}

export function useSaveOdelGeneral() {
  return useMutation({
    mutationFn: (input: OdelSaveGeneralInput) => saveOdelGeneral(input),
  })
}

export function useOdelQualifications(odelApplicationGuid: string | null) {
  return useQuery({
    queryKey: [...ODEL_KEY, 'qualifications', odelApplicationGuid],
    queryFn: () => getOdelQualifications(odelApplicationGuid as string),
    enabled: !!odelApplicationGuid,
  })
}

export function useSaveOdelQualification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OdelQualificationInput) => saveOdelQualification(input),
    onSuccess: (_res, input) => queryClient.invalidateQueries({ queryKey: [...ODEL_KEY, 'qualifications', input.odelApplicationGuid] }),
  })
}

export function useDeleteOdelQualification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ odelApplicationGuid, qualificationGuid }: { odelApplicationGuid: string; qualificationGuid: string }) =>
      deleteOdelQualification(odelApplicationGuid, qualificationGuid),
    onSuccess: (_res, v) => queryClient.invalidateQueries({ queryKey: [...ODEL_KEY, 'qualifications', v.odelApplicationGuid] }),
  })
}

export function useOdelPhoto(odelApplicationGuid: string | null) {
  return useQuery({
    queryKey: [...ODEL_KEY, 'photo', odelApplicationGuid],
    queryFn: () => getOdelPhoto(odelApplicationGuid as string),
    enabled: !!odelApplicationGuid,
  })
}

export function useUploadOdelPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ odelApplicationGuid, photo }: { odelApplicationGuid: string; photo: File }) => uploadOdelPhoto(odelApplicationGuid, photo),
    onSuccess: (_res, v) => queryClient.invalidateQueries({ queryKey: [...ODEL_KEY, 'photo', v.odelApplicationGuid] }),
  })
}

export function useOdelPaymentSlip(odelApplicationGuid: string | null) {
  return useQuery({
    queryKey: [...ODEL_KEY, 'payment-slip', odelApplicationGuid],
    queryFn: () => getOdelPaymentSlip(odelApplicationGuid as string),
    enabled: !!odelApplicationGuid,
  })
}

export function useUploadOdelPaymentSlip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ odelApplicationGuid, slip }: { odelApplicationGuid: string; slip: File }) => uploadOdelPaymentSlip(odelApplicationGuid, slip),
    onSuccess: (_res, v) => queryClient.invalidateQueries({ queryKey: [...ODEL_KEY, 'payment-slip', v.odelApplicationGuid] }),
  })
}


