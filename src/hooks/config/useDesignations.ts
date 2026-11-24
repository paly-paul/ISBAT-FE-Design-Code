import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createDesignation, deleteDesignation, Designation, DesignationInput, getDesignationsDropdown, updateDesignation } from '@/lib/api/academic/designation'
import type { PaginatedItems } from '@/lib/pagination'

export const DESIGNATIONS_KEY = ['designations']

// Full list, independent of any department (get-designations-dropdown.md).
export function useDesignationsDropdown(enabled = true) {
  return useQuery({
    queryKey: [...DESIGNATIONS_KEY, 'dropdown'],
    queryFn: () => getDesignationsDropdown(),
    enabled })
}

// Every save returns the full row (designation-master-page.md), so the page
// on screen is patched in place rather than refetched. Other cached pages,
// search terms and the employee form's dropdown are only marked stale, so
// they reload when next opened.
type Page = PaginatedItems<Designation>

function patchActivePage(qc: QueryClient, patch: (page: Page) => Page) {
  qc.setQueriesData<Page>({ queryKey: DESIGNATIONS_KEY, type: 'active', predicate: q => q.queryKey[1] !== 'dropdown' }, old => (old?.items ? patch(old) : old))
  qc.invalidateQueries({ queryKey: DESIGNATIONS_KEY, type: 'inactive', refetchType: 'none' })
  qc.invalidateQueries({ queryKey: [...DESIGNATIONS_KEY, 'dropdown'] })
}

export function useCreateDesignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DesignationInput) => createDesignation(input),
    onSuccess: row => patchActivePage(qc, p => ({ ...p, items: [...p.items, row], totalCount: p.totalCount + 1 })),
  })
}

export function useUpdateDesignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ designationGuid, input }: { designationGuid: string; input: DesignationInput }) => updateDesignation(designationGuid, input),
    onSuccess: row => patchActivePage(qc, p => ({ ...p, items: p.items.map(r => (r.designationGuid === row.designationGuid ? row : r)) })),
  })
}

// Also used on not_found: the row was already deleted by someone else, so it
// is dropped from the page the same way.
export function removeDesignationRow(qc: QueryClient, designationGuid: string) {
  patchActivePage(qc, p => (p.items.some(r => r.designationGuid === designationGuid)
    ? { ...p, items: p.items.filter(r => r.designationGuid !== designationGuid), totalCount: Math.max(0, p.totalCount - 1) }
    : p))
}

export function useDeleteDesignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (designationGuid: string) => deleteDesignation(designationGuid),
    onSuccess: (_ok, designationGuid) => removeDesignationRow(qc, designationGuid),
  })
}

export type { Designation, DesignationInput }
