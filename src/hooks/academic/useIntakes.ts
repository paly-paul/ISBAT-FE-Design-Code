import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIntake, CreateIntakeInput, deleteIntake, getIntakeById, getIntakes, GetIntakesFilters, Intake, updateIntake } from '@/lib/api/academic/intake'

const INTAKES_KEY = ['intakes']

// Fetch a single page large enough to cover the whole list — nothing in
// this codebase currently paginates the master lists client-side, so the
// hook needs the full set in one request rather than the API's default
// page=1/pageSize=10 (which was silently hiding any row past the 10th).
const INTAKES_PAGE_SIZE = 1000

export function useIntakes() {
  return useQuery({
    queryKey: INTAKES_KEY,
    queryFn: () => getIntakes(1, INTAKES_PAGE_SIZE),
    // Same reasoning as the other master-data lists in this app: don't
    // re-fetch just because the user switched tabs and came back — only
    // refetch once a create/update mutation actually changes this data.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Fetches a single intake (with its full academicCalendar detail) for the
// Edit Intake modal. Only enabled while the modal is actually open with a
// guid, so it doesn't fire on every render of the intake table.
export function useIntake(intakeGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...INTAKES_KEY, intakeGuid],
    queryFn: () => getIntakeById(intakeGuid as string),
    enabled: enabled && !!intakeGuid,
  })
}

// Two hero-card queries for the top of Intake Master, backed by the
// backend's own currentIntake/currentAdmissionIntake filters rather than
// derived by scanning the full (paginated, page-size-1000) list client-side.
// Only one intake can ever be flagged current for each, so the first item
// back is the one to show — but that filtered list response only carries
// the same abbreviated academicCalendar as every other list row (see the
// note on getIntakeById above: only the by-guid endpoint fully populates
// it), which left the Academic card's Sem Start/Term 1 End/Sem End chips
// stuck on "—" even once the card itself resolved. Re-fetching by guid
// gives the hero cards the fully populated record to read date fields off.
async function fetchCurrentIntake(filters: GetIntakesFilters): Promise<Intake | undefined> {
  const [match] = await getIntakes(1, 10, filters)
  if (!match) return undefined
  return getIntakeById(match.intakeGuid)
}

export function useCurrentAcademicIntake() {
  return useQuery({
    queryKey: [...INTAKES_KEY, 'current-academic'],
    queryFn: () => fetchCurrentIntake({ currentIntake: true, currentAdmissionIntake: false }),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCurrentAdmissionIntake() {
  return useQuery({
    queryKey: [...INTAKES_KEY, 'current-admission'],
    queryFn: () => fetchCurrentIntake({ currentIntake: false, currentAdmissionIntake: true }),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateIntake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIntakeInput) => createIntake(input),
    // Once a new intake is saved, the cached list is out of date, so tell
    // react-query to go fetch it again next time useIntakes() is used.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INTAKES_KEY }),
  })
}

export function useUpdateIntake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ intakeGuid, input }: { intakeGuid: string; input: CreateIntakeInput }) => updateIntake(intakeGuid, input),
    // Invalidate both the list and the single-intake cache for this guid, so
    // the table and a re-opened Edit modal both pick up the change.
    onSuccess: (_data, { intakeGuid }) => {
      queryClient.invalidateQueries({ queryKey: INTAKES_KEY })
      queryClient.invalidateQueries({ queryKey: [...INTAKES_KEY, intakeGuid] })
    },
  })
}

export function useDeleteIntake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (intakeGuid: string) => deleteIntake(intakeGuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INTAKES_KEY }),
  })
}

export type { Intake, AcademicCalendarEntry, CreateIntakeInput, CreateAcademicCalendarEntryInput } from '@/lib/api/academic/intake'
