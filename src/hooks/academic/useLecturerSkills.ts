import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { CreateLecturerSkillInput, LecturerSkill, UpdateLecturerSkillsInput, createSkill, deleteSkill, getEmployeeSkills, getSkillById, getSkills, updateSkills } from '@/lib/api/users/skills'

const LECTURER_SKILLS_KEY = ['lecturer-skills']

// Real server-side pagination (2026-09-09, now that the backend supports
// it — see getSkills' own comment) — only PAGE_SIZE rows are ever requested
// for the page on screen. Replaces the old useLecturerSkills()/
// useLecturerSkillSearch() pair (full 1000-row fetch + a separate page-1-only
// search query) with one hook, same consolidation useBatches went through.
// keepPreviousData avoids a loading flash between pages/searches.
export function useLecturerSkills(page: number, pageSize: number, search = '') {
  return useQuery({
    queryKey: [...LECTURER_SKILLS_KEY, page, pageSize, search],
    queryFn: () => getSkills(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Fetch-by-guid query for the Edit modal — only enabled while the modal is
// actually open with a guid, same convention as the other real domains.
export function useLecturerSkill(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...LECTURER_SKILLS_KEY, guid],
    queryFn: () => getSkillById(guid as string),
    enabled: enabled && !!guid,
  })
}

// mutationFn resolves to an array — one call now creates a skill entry per
// guid in input.skillGuids (see CreateLecturerSkillInput).
export function useCreateLecturerSkill() {
  return useMutation({
    mutationFn: (input: CreateLecturerSkillInput) => createSkill(input),
  })
}

// One employee's full skill set for the Edit modal. staleTime 0: PUT
// replaces the whole set, so it must start from what's stored now.
export function useEmployeeSkills(employeeGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...LECTURER_SKILLS_KEY, 'employee', employeeGuid],
    queryFn: () => getEmployeeSkills(employeeGuid as string),
    enabled: enabled && !!employeeGuid,
    staleTime: 0,
  })
}

// Saves an employee's complete skill list via the full-list PUT — skills
// left out are removed (see updateSkills).
export function useUpdateLecturerSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateLecturerSkillsInput) => updateSkills(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LECTURER_SKILLS_KEY }),
  })
}

export function useDeleteLecturerSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteSkill(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LECTURER_SKILLS_KEY }),
  })
}

export type { LecturerSkill, CreateLecturerSkillInput, UpdateLecturerSkillsInput }
