import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIntake, CreateIntakeInput, deleteIntake, getIntakeById, getIntakes, updateIntake } from '@/lib/api/academic/intake'

const INTAKES_KEY = ['intakes']

export function useIntakes() {
  return useQuery({
    queryKey: INTAKES_KEY,
    queryFn: () => getIntakes(),
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
