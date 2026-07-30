import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteQualification,
  getFilingCountries,
  saveGeneral,
  saveQualification,
  SaveGeneralInput,
  SaveQualificationInput,
  searchApplicationsForFiling,
  submitApplication,
  uploadPhoto,
} from '@/lib/api/admission/applicationFiling'

const FILING_KEY = ['application-filing']

export function useFilingCountries() {
  return useQuery({
    queryKey: [...FILING_KEY, 'countries'],
    queryFn: () => getFilingCountries(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useSearchApplicationsForFiling(searchTerm: string, pageNumber: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: [...FILING_KEY, 'search', searchTerm, pageNumber, pageSize],
    queryFn: () => searchApplicationsForFiling(searchTerm, pageNumber, pageSize),
    enabled,
  })
}

export function useSaveGeneral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveGeneralInput) => saveGeneral(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FILING_KEY }),
  })
}

export function useSaveQualification() {
  return useMutation({
    mutationFn: (input: SaveQualificationInput) => saveQualification(input),
  })
}

export function useDeleteQualification() {
  return useMutation({
    mutationFn: (intApplicationQual: number) => deleteQualification(intApplicationQual),
  })
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: ({ appRefNo, photo }: { appRefNo: string; photo: File }) => uploadPhoto(appRefNo, photo),
  })
}

export function useSubmitApplication() {
  return useMutation({
    mutationFn: ({ intApplication, appRefNo }: { intApplication: number; appRefNo: string }) => submitApplication(intApplication, appRefNo),
  })
}

export type {
  CountryDropdownDto,
  FilingApplicationSearchResult,
  SaveGeneralInput,
  SaveGeneralResponse,
  SaveQualificationInput,
  SaveQualificationResponse,
  SubmitApplicationResponse,
} from '@/lib/api/admission/applicationFiling'
