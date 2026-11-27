import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { StudentDto, StudentDetailDto, StudentListFilters, StudentColumnFilters, getStudentByGuid, getStudents, getStudentTimeline, getStudentsFilter, updateStudentPhoto, StudentsFilterResult } from '@/lib/api/student/student'

const STUDENTS_LIST_KEY = ['students-list']
const STUDENT_DETAIL_KEY = ['student-detail']

// staleTime 0, unlike the app default: transfers on other pages add history
// rows, so each opening of the tab re-reads it. A failed read isn't re-sent
// on open (retryOnMount: false in providers.tsx); only Try again does that.
export function useStudentTimeline(studentGuid: string | null) {
  return useQuery({
    queryKey: ['student-timeline', studentGuid],
    queryFn: () => getStudentTimeline(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 0,
  })
}

export function useStudents(page: number, pageSize: number, filters?: StudentListFilters) {
  return useQuery({
    queryKey: [...STUDENTS_LIST_KEY, page, pageSize, filters?.searchTerm ?? ''],
    queryFn: () => getStudents(page, pageSize, filters),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Backs Student Master's Programme/Semester/Batch column filters (GET
// /api/v1/students/filter, get-students-filter.md) — a separate query from
// useStudents above since it hits a different endpoint with a different
// filter shape (guids, not just free text), rather than overloading one
// hook to cover both. `enabled` lets the page skip this one entirely while
// useStudentsFilterMulti below is the active path instead.
function studentsFilterKey(page: number, pageSize: number, f: StudentColumnFilters) {
  return [...STUDENTS_LIST_KEY, 'filter', page, pageSize, f.programGuid ?? '', f.semesterGuid ?? '', f.semCode ?? '', f.batchGuid ?? '', f.intakeGuid ?? '', f.academicIntake ?? '', f.regStatus ?? '', f.searchTerm ?? '']
}

export function useStudentsFilter(page: number, pageSize: number, filters: StudentColumnFilters, enabled = true) {
  return useQuery({
    queryKey: studentsFilterKey(page, pageSize, filters),
    queryFn: () => getStudentsFilter(page, pageSize, filters),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Multi-select column filters, layered on top of the single-value-per-field
// endpoint above — get-students-filter.md's programGuid/semCode/batchGuid/
// academicIntake/regStatus params each take exactly one value, no array/
// comma-list support documented. To let a column filter still check off
// "Programme A AND Programme B", each *combination* of the selected values
// (one per dimension, dimensions ANDed, values within a dimension ORed) is
// its own request — getStudentsFilterCombinations below builds that list.
// The page falls back to plain useStudentsFilter above whenever there's
// only a single combination (no filter, or one value per dimension).

// A picked semester (a semCode) is sent two ways:
// - with a Programme picked, as semCode — the server resolves it within that
//   combination's programGuid (get-students-filter.md, 2026-11-27);
// - on its own, semCode has no programme to resolve against, so it's turned
//   into every programme's semesterGuid for that code (from GET
//   /academic/semesters/filter/by-semcode/{semCode}), one combination each.
//   A code whose rows haven't loaded, or that has none, yields no
//   combination — the page treats that as "no results".
export function getStudentsFilterCombinations(
  colFilters: { programGuid: string[]; semCode: string[]; batchGuid: string[]; intakeGuid: string[]; academicIntake: string[]; regStatus: string[] },
  semesterRowsByCode: Map<string, { semesterGuid: string }[]>,
  searchTerm?: string,
): StudentColumnFilters[] {
  const each = (values: string[]) => values.length ? values : [undefined]
  const progSems: Pick<StudentColumnFilters, 'programGuid' | 'semCode' | 'semesterGuid'>[] = []
  for (const programGuid of each(colFilters.programGuid)) {
    if (!colFilters.semCode.length) progSems.push({ programGuid })
    else if (programGuid) colFilters.semCode.forEach(semCode => progSems.push({ programGuid, semCode }))
    else colFilters.semCode.forEach(code => (semesterRowsByCode.get(code) ?? []).forEach(r => progSems.push({ semesterGuid: r.semesterGuid })))
  }
  const combos: StudentColumnFilters[] = []
  for (const academicIntake of each(colFilters.academicIntake)) {
    for (const progSem of progSems) {
      for (const batchGuid of each(colFilters.batchGuid)) {
        for (const intakeGuid of each(colFilters.intakeGuid)) {
          for (const regStatus of each(colFilters.regStatus)) {
            combos.push({ academicIntake, ...progSem, batchGuid, intakeGuid, regStatus, searchTerm })
          }
        }
      }
    }
  }
  return combos
}

// Filter column options, merged across every combination's response: each
// one carries the programmes of its own academicIntake, the semesters of its
// own programme and the batches of its own programme + semester, so the
// union is exactly the options for everything picked. Semesters are keyed by
// semCode (that's what the Semester column filters on).
export interface StudentFilterOptions {
  programs: { value: string; label: string }[]
  semesters: { value: string; label: string }[]
  batches: { value: string; label: string }[]
}

const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })

export function mergeStudentFilterOptions(results: (StudentsFilterResult | undefined)[]): StudentFilterOptions {
  const programs = new Map<string, string>()
  const semesters = new Map<number, string>()
  const batches = new Map<string, string>()
  for (const r of results) {
    if (!r) continue
    r.programs.forEach(p => { if (!programs.has(p.guid)) programs.set(p.guid, p.label.trim()) })
    r.semesters.forEach(s => { if (!semesters.has(s.semCode)) semesters.set(s.semCode, s.label.trim()) })
    r.semCodes.forEach(code => { if (!semesters.has(code)) semesters.set(code, `Semester ${code}`) })
    r.batches.forEach(b => { if (!batches.has(b.guid)) batches.set(b.guid, b.label.trim()) })
  }
  return {
    programs: Array.from(programs, ([value, label]) => ({ value, label })).sort(byLabel),
    semesters: Array.from(semesters).sort(([a], [b]) => a - b).map(([code, label]) => ({ value: String(code), label })),
    batches: Array.from(batches, ([value, label]) => ({ value, label })).sort(byLabel),
  }
}

// Server-paged across combinations, sorted by name as one list. A student
// has exactly one programme, semester, batch, intake and status, so
// combinations never overlap. The server returns each combination sorted by
// name, so the first K rows of the merged, name-sorted list are always
// among the first K rows of each combination. For table page p (K = p ×
// pageSize): fetch each combination's first K rows (one request each),
// merge, sort by name, and take page p's slice. totalCount comes from each
// response. K is rounded up to a CHUNK so neighbouring pages reuse the same
// requests (pages 1–5 at pageSize 10 share one request per combination).
const MULTI_CHUNK = 50

function compareByName(a: StudentDto, b: StudentDto) {
  return (a.studentName ?? '').localeCompare(b.studentName ?? '', undefined, { sensitivity: 'base' })
    || a.studentGuid.localeCompare(b.studentGuid)
}

export function useStudentsFilterMulti(combos: StudentColumnFilters[], page: number, pageSize: number, enabled: boolean) {
  const needed = page * pageSize
  const fetchSize = Math.ceil(needed / MULTI_CHUNK) * MULTI_CHUNK

  const results = useQueries({
    queries: combos.map(f => ({
      queryKey: studentsFilterKey(1, fetchSize, f),
      queryFn: () => getStudentsFilter(1, fetchSize, f),
      enabled,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const ready = enabled && results.length > 0 && results.every(r => r.data)
  const totalCount = results.reduce((sum, r) => sum + (r.data?.students.totalCount ?? 0), 0)
  const items = ready
    ? results.flatMap(r => r.data!.students.items).sort(compareByName).slice((page - 1) * pageSize, needed)
    : []
  const isError = results.some(r => r.isError)
  return {
    items,
    totalCount,
    options: mergeStudentFilterOptions(results.map(r => r.data)),
    isLoading: !isError && !ready,
    isError,
  }
}

// Infinite-scroll variant for a search dropdown — each additional page is
// appended rather than replacing the list, and getNextPageParam stops
// offering a next page once pageNumber*pageSize has reached totalCount.
// Kept as its own hook rather than a mode on useStudents above since a
// paginated table (page/setPage, Pagination component) and an
// append-as-you-scroll dropdown want fundamentally different query shapes.
export function useStudentsInfinite(searchTerm: string, pageSize: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...STUDENTS_LIST_KEY, 'infinite', pageSize, searchTerm],
    queryFn: ({ pageParam }) => getStudents(pageParam, pageSize, { searchTerm: searchTerm || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.totalCount ? allPages.length + 1 : undefined
    },
    enabled: enabled && Boolean(searchTerm && searchTerm.trim()),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Fetch-by-guid, same convention as the rest of the app's real View modals —
// only enabled while the profile modal is actually open with a guid.
export function useStudent(studentGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...STUDENT_DETAIL_KEY, studentGuid],
    queryFn: () => getStudentByGuid(studentGuid as string),
    enabled: enabled && !!studentGuid,
  })
}

// The photo is stored against the student's application, which both the
// student detail and the ID card read their photoUrl from — so both are
// re-read to pick up the new signed link.
export function useUpdateStudentPhoto(studentGuid: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photo: File) => updateStudentPhoto(studentGuid as string, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...STUDENT_DETAIL_KEY, studentGuid] })
      queryClient.invalidateQueries({ queryKey: ['id-card', studentGuid] })
    },
  })
}

// Batched studentGuid → applicationGuid resolver — same useQueries-per-guid
// convention as useIntakesByGuids (useIntakes.ts). Backs Payment Console →
// Refund's Passout/Library-Deposit and Fake-Certificate-Termination search
// tabs: both eligibility-search DTOs carry only studentGuid, but the refund
// endpoints (ledger-details-batch, POST /refund/applications/{applicationGuid},
// the bulk endpoint) all key off applicationGuid — resolved here via
// StudentDetailDto.applicationSummary.applicationGuid, since there's no
// dedicated studentGuid→applicationGuid lookup endpoint.
export function useStudentsByGuids(guids: string[], enabled = true) {
  const unique = Array.from(new Set(guids.filter(Boolean)))
  const results = useQueries({
    queries: unique.map(guid => ({
      queryKey: [...STUDENT_DETAIL_KEY, guid],
      queryFn: () => getStudentByGuid(guid),
      enabled,
      staleTime: 5 * 60 * 1000,
    })),
  })
  return useMemo(() => {
    const byGuid = new Map<string, StudentDetailDto>()
    results.forEach((r, i) => { if (r.data) byGuid.set(unique[i], r.data) })
    return {
      byGuid,
      isLoading: results.some(r => r.isLoading),
      isError: results.some(r => r.isError),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])
}

export type { StudentDto, StudentDetailDto, StudentListFilters, StudentColumnFilters, PagedResult } from '@/lib/api/student/student'
