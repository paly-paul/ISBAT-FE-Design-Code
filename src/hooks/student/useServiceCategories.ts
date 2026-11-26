import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategoryDropdown,
  ServiceCategoryRequest,
  updateServiceCategory,
} from '@/lib/api/student/serviceCategories'

export const SERVICE_CATEGORIES_KEY = ['service-categories']

// Picker list, loaded once and filtered in the browser. Under
// SERVICE_CATEGORIES_KEY, so master-page saves refresh it too.
export function useServiceCategoryDropdown() {
  return useQuery({
    queryKey: [...SERVICE_CATEGORIES_KEY, 'dropdown'],
    queryFn: () => getServiceCategoryDropdown(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ServiceCategoryRequest) => createServiceCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY }),
  })
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, payload }: { guid: string; payload: ServiceCategoryRequest }) => updateServiceCategory(guid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY }),
  })
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteServiceCategory(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY }),
  })
}

export type { ServiceCategoryDto, ServiceCategoryRequest, PagedResult } from '@/lib/api/student/serviceCategories'
