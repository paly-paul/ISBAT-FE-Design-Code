import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTimetable,
  deleteTimetable,
  getAvailableRooms,
  getLecturerLoad,
  getRoomDropdown,
  getTimetableByBatch,
  getTimetableByLecturer,
  getTimetableByRoom,
  getTimetableBySlot,
  getTimetableCourseUnits,
  getTimetableEligibleBatches,
  getTimetableIntakes,
  getTimetableLecturers,
  getTimetableSlots,
  updateTimetable,
  BatchTimetable,
  EligibleBatch,
  LecturerTimetable,
  RoomOption,
  RoomTimetable,
  TimeSlotAudit,
  TimetableBatchLink,
  TimetableCourseUnit,
  TimetableEntry,
  TimetableEntryBatch,
  TimetableInput,
  TimetableIntakes,
  TimetableLecturer,
  TimetableSlot,
} from '@/lib/api/academic/timetable'
import { getTimeSlotDropdown, TimeSlotDropdownItem } from '@/lib/api/academic/timeSlot'

const TIMETABLE_KEY = ['timetable']

// Call first — every other timetable query below is keyed by intakeGuid,
// and editableIntakeGuids is what the Schedule screen offers (current and
// next intake only; the server rejects changes to any other).
export function useTimetableIntakes() {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'intakes'],
    queryFn: () => getTimetableIntakes(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Lecturers planned for the intake and term (program planning).
// empName is null when Identity can't resolve the lecturer
// (get-timetable-lecturers.md). Those can't be told apart in a picker, so
// they're left out — fix the name in Identity / Employee Master to list them.
export function useTimetableLecturers(intakeGuid: string | null, term: number, enabled = true) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'lecturers', intakeGuid, term],
    queryFn: () => getTimetableLecturers(intakeGuid as string, term),
    select: (lecturers: TimetableLecturer[]) => lecturers.filter(l => {
      const name = l.empName?.trim()
      return !!name && name.toLowerCase() !== 'null'
    }),
    enabled: enabled && !!intakeGuid,
  })
}

export function useTimetableCourseUnits(intakeGuid: string | null, term: number, lecturerGuid: string | null) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'course-units', intakeGuid, term, lecturerGuid],
    queryFn: () => getTimetableCourseUnits(intakeGuid as string, term, lecturerGuid as string),
    enabled: !!intakeGuid && !!lecturerGuid,
  })
}

export function useTimetableEligibleBatches(intakeGuid: string | null, term: number, lecturerGuid: string | null, batchTimeGuid: string | null, courseUnitGuid: string | null) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'eligible-batches', intakeGuid, term, lecturerGuid, batchTimeGuid, courseUnitGuid],
    queryFn: () => getTimetableEligibleBatches(intakeGuid as string, term, lecturerGuid as string, batchTimeGuid as string, courseUnitGuid as string),
    enabled: !!intakeGuid && !!lecturerGuid && !!batchTimeGuid && !!courseUnitGuid,
  })
}

export function useTimetableSlots(intakeGuid: string | null, term: number, lecturerGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'slots', intakeGuid, term, lecturerGuid ?? null],
    queryFn: () => getTimetableSlots(intakeGuid as string, term, lecturerGuid),
    enabled: enabled && !!intakeGuid,
  })
}

// ── Views ──
export function useTimetableByLecturer(lecturerGuid: string | null, intakeGuid: string | null, term: number) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'by-lecturer', lecturerGuid, intakeGuid, term],
    queryFn: () => getTimetableByLecturer(lecturerGuid as string, intakeGuid as string, term),
    enabled: !!lecturerGuid && !!intakeGuid,
  })
}

export function useTimetableByBatch(batchGuid: string | null, intakeGuid: string | null, term: number) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'by-batch', batchGuid, intakeGuid, term],
    queryFn: () => getTimetableByBatch(batchGuid as string, intakeGuid as string, term),
    enabled: !!batchGuid && !!intakeGuid,
  })
}

export function useTimetableByRoom(roomGuid: string | null, intakeGuid: string | null, term: number) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'by-room', roomGuid, intakeGuid, term],
    queryFn: () => getTimetableByRoom(roomGuid as string, intakeGuid as string, term),
    enabled: !!roomGuid && !!intakeGuid,
  })
}

export type SlotAuditParams = { batchTimeGuid: string; weekDayGuid: string; timeSlotGuid: string; intakeGuid: string; term: number }

// Runs only for a submitted set of filters (the page's Search button).
export function useTimetableBySlot(params: SlotAuditParams | null) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'by-slot', params],
    queryFn: () => getTimetableBySlot(params!.batchTimeGuid, params!.weekDayGuid, params!.timeSlotGuid, params!.intakeGuid, params!.term),
    enabled: !!params,
  })
}

export function useLecturerLoad(lecturerGuid: string | null, intakeGuid: string | null, term: number) {
  return useQuery({
    queryKey: [...TIMETABLE_KEY, 'lecturer-load', lecturerGuid, intakeGuid, term],
    queryFn: () => getLecturerLoad(lecturerGuid as string, intakeGuid as string, term),
    enabled: !!lecturerGuid && !!intakeGuid,
  })
}

// ── Reference lists ──
// batchTimeGuid narrows to that batch time; null lists every slot.
// The master holds placeholder rows ("Unknown" / "Not Set", 12:00–12:00) that
// aren't real teaching slots — they showed up as extra calendar columns.
function isPlaceholderSlot(s: TimeSlotDropdownItem) {
  return /unknown|not set/i.test(`${s.timeSlot ?? ''} ${s.timeSlotCode ?? ''}`)
    || !s.startTime || !s.endTime
    || s.startTime.slice(0, 5) === s.endTime.slice(0, 5)
}

// Columns are the selected batch time's own slots (timetable-page.md). The
// guid is also checked here so a slot from another shift never becomes a
// column, and the result is ordered by start time.
export function useTimeSlots(batchTimeGuid: string | null, enabled = true) {
  return useQuery({
    queryKey: ['timeslots', 'dropdown', batchTimeGuid ?? 'all'],
    queryFn: () => getTimeSlotDropdown(batchTimeGuid),
    select: (slots: TimeSlotDropdownItem[]) => slots
      .filter(s => !isPlaceholderSlot(s) && (!batchTimeGuid || s.batchTimeGuid?.toLowerCase() === batchTimeGuid.toLowerCase()))
      .sort((a, b) => (a.batchTimeName ?? '').localeCompare(b.batchTimeName ?? '') || a.startTime.localeCompare(b.startTime)),
    enabled,
    staleTime: Infinity,
  })
}

export function useRoomDropdown(enabled = true) {
  return useQuery({
    queryKey: ['rooms', 'dropdown'],
    queryFn: () => getRoomDropdown(),
    enabled,
    staleTime: Infinity,
  })
}

export function useAvailableRooms(p: { batchTimeGuid: string; timeSlotGuid: string; weekDayGuid: string; intakeGuid: string; term: number; excludeTimetableGuid?: string | null } | null) {
  return useQuery({
    // Under TIMETABLE_KEY so a save/delete refreshes room availability too.
    queryKey: [...TIMETABLE_KEY, 'available-rooms', p],
    queryFn: () => getAvailableRooms(p!),
    enabled: !!p,
  })
}

// ── Writes — every change refreshes all timetable views, loads and rooms ──
export function useCreateTimetable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TimetableInput) => createTimetable(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY }),
  })
}

export function useUpdateTimetable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: TimetableInput }) => updateTimetable(guid, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY }),
  })
}

export function useDeleteTimetable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteTimetable(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY }),
  })
}

export type {
  BatchTimetable,
  EligibleBatch,
  LecturerTimetable,
  RoomOption,
  RoomTimetable,
  TimeSlotAudit,
  TimeSlotDropdownItem,
  TimetableBatchLink,
  TimetableCourseUnit,
  TimetableEntry,
  TimetableEntryBatch,
  TimetableInput,
  TimetableIntakes,
  TimetableLecturer,
  TimetableSlot,
}
