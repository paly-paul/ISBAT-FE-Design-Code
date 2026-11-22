import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createCourseLevel, deleteCourseLevel, updateCourseLevel, CourseLevel, CourseLevelInput } from '@/lib/api/academic/courseLevel'
import type { PaginatedItems } from '@/lib/pagination'

export const COURSE_LEVELS_KEY = ['course-levels']

// Every save returns the full row (course-level-master-page.md), so the page
// on screen is patched in place rather than refetched. Other cached pages and
// search terms are only marked stale, so they reload when next opened.
type Page = PaginatedItems<CourseLevel>

function patchActivePage(qc: QueryClient, patch: (page: Page) => Page) {
  qc.setQueriesData<Page>({ queryKey: COURSE_LEVELS_KEY, type: 'active' }, old => (old ? patch(old) : old))
  qc.invalidateQueries({ queryKey: COURSE_LEVELS_KEY, type: 'inactive', refetchType: 'none' })
}

export function useCreateCourseLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CourseLevelInput) => createCourseLevel(input),
    onSuccess: level => patchActivePage(qc, p => ({ ...p, items: [...p.items, level], totalCount: p.totalCount + 1 })),
  })
}

export function useUpdateCourseLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ intLevel, input }: { intLevel: number; input: CourseLevelInput }) => updateCourseLevel(intLevel, input),
    onSuccess: level => patchActivePage(qc, p => ({ ...p, items: p.items.map(r => (r.intLevel === level.intLevel ? level : r)) })),
  })
}

// Also used on not_found: the row was already deleted by someone else, so it
// is dropped from the page the same way.
export function removeCourseLevelRow(qc: QueryClient, intLevel: number) {
  patchActivePage(qc, p => (p.items.some(r => r.intLevel === intLevel)
    ? { ...p, items: p.items.filter(r => r.intLevel !== intLevel), totalCount: Math.max(0, p.totalCount - 1) }
    : p))
}

export function useDeleteCourseLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (intLevel: number) => deleteCourseLevel(intLevel),
    onSuccess: (_ok, intLevel) => removeCourseLevelRow(qc, intLevel),
  })
}

export type { CourseLevel, CourseLevelInput }
