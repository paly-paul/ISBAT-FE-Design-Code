import { useInfiniteQuery, useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  SkillMaster,
  SkillMasterInput,
  createSkillMaster,
  deleteSkillMaster,
  getSkillMasters,
  updateSkillMaster,
} from '@/lib/api/academic/skillMaster'
import { getNextPageParam } from '@/lib/pagination'

const SKILL_MASTERS_KEY = ['skillMasters']

// Kept for callers that still need the full first-page snapshot (e.g. some
// modal dropdowns) without forcing them to adopt the new infinite pattern.
// enabled defaults to true so every existing call site keeps eagerly
// fetching exactly as before — only a caller that shouldn't hit the network
// until it's actually open (e.g. a modal) needs to pass enabled={isOpen}.
export function useSkillMasters(enabled = true) {
  return useQuery({
    queryKey: SKILL_MASTERS_KEY,
    queryFn: () => getSkillMasters(1, 1000),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  })
}

// Real server-side pagination for the skill catalog's own table/search
// flow — same pattern as the other paged masters in the app.
export function useSkillMastersPaged(page: number, pageSize: number, search = '') {
  return useQuery({
    queryKey: [...SKILL_MASTERS_KEY, 'paged', page, pageSize, search],
    queryFn: () => getSkillMasters(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Search-as-you-type/infinite-scroll variant for the skill catalog search
// dropdowns or other live-search surfaces, mirroring the other master pickers.
export function useSearchSkillMastersInfinite(search: string, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...SKILL_MASTERS_KEY, 'search-infinite', search, pageSize],
    queryFn: ({ pageParam }) => getSkillMasters(pageParam, pageSize, search),
    initialPageParam: 1,
    getNextPageParam,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateSkillMaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SkillMasterInput) => createSkillMaster(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILL_MASTERS_KEY }),
  })
}

export function useUpdateSkillMaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ skillGuid, input }: { skillGuid: string; input: SkillMasterInput }) => updateSkillMaster(skillGuid, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILL_MASTERS_KEY }),
  })
}

export function useDeleteSkillMaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (skillGuid: string) => deleteSkillMaster(skillGuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILL_MASTERS_KEY }),
  })
}

export type { SkillMaster, SkillMasterInput }
