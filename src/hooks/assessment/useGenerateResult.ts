import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyModeration,
  deleteResults,
  deleteResultsScope,
  exportResults,
  generateResults,
  generateResultsScope,
  getGeneratedResults,
  getGenerateResultCourseUnits,
  getGenerateResultInit,
  getGenerateResultSemesters,
  getGenerateResultStatus,
  publishResults,
  publishResultsScope,
  withdrawResultsScope,
  BatchActionResponse,
  BatchResultStatus,
  BatchSkippedItem,
  BatchStatusItem,
  BatchStatusSummaryCounts,
  GenerateBatchResponse,
  GenerateResultResponse,
  GenerateResultStatusParams,
  GenerateResultStatusResponse,
  GenerateResultSummary,
  GenerateResultsScopeBody,
  GenerateWarning,
  ModerationField,
  ModerationResponse,
  ModerationSkippedItem,
  ProgramStatusNode,
  ResultFilters,
  ResultOperator,
  ScopeQueryParams,
  SemesterStatusNode,
} from '@/lib/api/assessment/generateResult'

export const GENERATE_RESULT_KEYS = {
  all: ['assessment-attendance-service', 'assessment', 'generate-result'] as const,
  init: () => [...GENERATE_RESULT_KEYS.all, 'init'] as const,
  semesters: (programGuid: string) => [...GENERATE_RESULT_KEYS.all, 'semesters', programGuid] as const,
  units: (programGuid: string, semesterGuid: string) => [...GENERATE_RESULT_KEYS.all, 'units', programGuid, semesterGuid] as const,
  results: () => [...GENERATE_RESULT_KEYS.all, 'results'] as const,
  list: (filters: ResultFilters, page: number, pageSize: number) => [...GENERATE_RESULT_KEYS.results(), filters, page, pageSize] as const,
  status: (params: GenerateResultStatusParams) => [...GENERATE_RESULT_KEYS.all, 'status', params] as const,
}

export function useGenerateResultInit() {
  return useQuery({ queryKey: GENERATE_RESULT_KEYS.init(), queryFn: getGenerateResultInit, staleTime: Infinity })
}

export function useGenerateResultSemesters(programGuid: string) {
  return useQuery({
    queryKey: GENERATE_RESULT_KEYS.semesters(programGuid),
    queryFn: () => getGenerateResultSemesters(programGuid),
    enabled: !!programGuid,
    staleTime: Infinity,
  })
}

export function useGenerateResultCourseUnits(programGuid: string, semesterGuid: string) {
  return useQuery({
    queryKey: GENERATE_RESULT_KEYS.units(programGuid, semesterGuid),
    queryFn: () => getGenerateResultCourseUnits(programGuid, semesterGuid),
    enabled: !!programGuid && !!semesterGuid,
    staleTime: Infinity,
  })
}

// `filters` is null until Show Result is clicked.
export function useGeneratedResults(filters: ResultFilters | null, page: number, pageSize: number) {
  return useQuery({
    queryKey: GENERATE_RESULT_KEYS.list(filters ?? { intakeGuid: '' }, page, pageSize),
    queryFn: () => getGeneratedResults(filters as ResultFilters, page, pageSize),
    enabled: !!filters?.intakeGuid,
    placeholderData: keepPreviousData,
  })
}

// Per-Batch Status Query
export function useGenerateResultStatus(params: GenerateResultStatusParams | null, enabled = true) {
  return useQuery({
    queryKey: params ? GENERATE_RESULT_KEYS.status(params) : [...GENERATE_RESULT_KEYS.all, 'status', 'null'],
    queryFn: () => getGenerateResultStatus(params as GenerateResultStatusParams),
    enabled: enabled && !!params?.intakeGuid,
    placeholderData: keepPreviousData,
  })
}

// Every write changes the grid/tree, so they all reload it.
function useResultsMutation<TVars, TData>(fn: (v: TVars) => Promise<TData>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.all }),
  })
}

export function useGenerateResults() {
  return useResultsMutation((intakeGuid: string) => generateResults(intakeGuid))
}

export function useApplyModeration() {
  return useResultsMutation(({ filters, field, value }: { filters: ResultFilters; field: ModerationField; value: number }) => applyModeration(filters, field, value))
}

export function usePublishResults() {
  return useResultsMutation(({ intakeGuid, publish }: { intakeGuid: string; publish: boolean }) => publishResults(intakeGuid, publish))
}

export function useDeleteResults() {
  return useResultsMutation((intakeGuid: string) => deleteResults(intakeGuid))
}

export function useExportResults() {
  return useMutation({ mutationFn: (filters: ResultFilters) => exportResults(filters) })
}

// Per-Batch Mutations
export function useGenerateResultsScope() {
  return useResultsMutation((body: GenerateResultsScopeBody) => generateResultsScope(body))
}

export function usePublishResultsScope() {
  return useResultsMutation((params: ScopeQueryParams) => publishResultsScope(params))
}

export function useWithdrawResultsScope() {
  return useResultsMutation((params: ScopeQueryParams) => withdrawResultsScope(params))
}

export function useDeleteResultsScope() {
  return useResultsMutation((params: ScopeQueryParams) => deleteResultsScope(params))
}

export type {
  BatchActionResponse,
  BatchResultStatus,
  BatchSkippedItem,
  BatchStatusItem,
  BatchStatusSummaryCounts,
  ExamResultRow,
  GenerateBatchResponse,
  GenerateResultResponse,
  GenerateResultStatusParams,
  GenerateResultStatusResponse,
  GenerateResultSummary,
  GenerateResultsScopeBody,
  GenerateWarning,
  ModerationField,
  ModerationResponse,
  ModerationSkippedItem,
  ProgramStatusNode,
  ResultFilters,
  ResultOperator,
  ScopeQueryParams,
  SemesterStatusNode,
} from '@/lib/api/assessment/generateResult'
