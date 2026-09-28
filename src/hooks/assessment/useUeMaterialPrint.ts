import { useQuery, useMutation } from '@tanstack/react-query'
import { getProgramDropdown } from '@/lib/api/academic/programMaster'
import { getSemestersForProgram } from '@/lib/api/academic/semester'
import { getProgramCourseUnits } from '@/lib/api/academic/programCourseUnits'
import {
  printUeBooklet,
  downloadUeBookletPdf,
  printUeQuestionTheory,
  downloadUeQuestionTheoryWord,
  printUeQuestionPractical,
  downloadUeQuestionPracticalWord,
  UeBookletPrintRequest,
} from '@/lib/api/assessment/ueMaterialPrint'

export function usePrintUeBooklet() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => printUeBooklet(data)
  })
}

export function useDownloadUeBookletPdf() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => downloadUeBookletPdf(data)
  })
}

export function usePrintUeQuestionTheory() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => printUeQuestionTheory(data)
  })
}

export function useDownloadUeQuestionTheoryWord() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => downloadUeQuestionTheoryWord(data)
  })
}

export function usePrintUeQuestionPractical() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => printUeQuestionPractical(data)
  })
}

export function useDownloadUeQuestionPracticalWord() {
  return useMutation({
    mutationFn: (data: UeBookletPrintRequest) => downloadUeQuestionPracticalWord(data)
  })
}

// Dropdown Queries
export function useUeMaterialPrintPrograms() {
  return useQuery({
    queryKey: ['ue-material-print-programs'],
    queryFn: () => getProgramDropdown(),
  })
}

export function useUeMaterialPrintSemesters(programGuid: string | null) {
  return useQuery({
    queryKey: ['ue-material-print-semesters', programGuid],
    queryFn: () => getSemestersForProgram(programGuid!),
    enabled: !!programGuid,
  })
}

export function useUeMaterialPrintCourseUnits(programGuid: string | null) {
  return useQuery({
    queryKey: ['ue-material-print-course-units', programGuid],
    queryFn: () => getProgramCourseUnits(programGuid!),
    enabled: !!programGuid,
  })
}

