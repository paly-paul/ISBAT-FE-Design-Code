import { useQuery } from '@tanstack/react-query'
import {
  getAssessmentOverview,
  getHallTicketDashboard,
  getResitDashboard,
  getLecturerDashboard,
  AssessmentOverviewDto,
  HallTicketDashboardDto,
  ResitDashboardDto,
  LecturerDashboardDto,
} from '@/lib/api/assessment/dashboard'

export const ASSESSMENT_DASHBOARD_KEYS = {
  all: ['assessment-dashboard'] as const,
  overview: () => [...ASSESSMENT_DASHBOARD_KEYS.all, 'overview'] as const,
  hallTicket: () => [...ASSESSMENT_DASHBOARD_KEYS.all, 'hall-ticket'] as const,
  resit: (page: number, pageSize: number) => [...ASSESSMENT_DASHBOARD_KEYS.all, 'resit', page, pageSize] as const,
  lecturer: () => [...ASSESSMENT_DASHBOARD_KEYS.all, 'lecturer'] as const,
}

// 1. Overview counts for Admin / Registrar / Dean
// Safe fallback to null if 403 (e.g. caller is lecturer) or server temporarily unavailable
export function useAssessmentOverview(options?: { enabled?: boolean }) {
  return useQuery<AssessmentOverviewDto | null>({
    queryKey: ASSESSMENT_DASHBOARD_KEYS.overview(),
    queryFn: async () => {
      try {
        return await getAssessmentOverview()
      } catch (err: any) {
        const isForbidden =
          err?.code === 'forbidden' ||
          err?.code === 'unauthorized' ||
          err?.status === 403 ||
          /forbidden|403|unauthorized/i.test(err?.message ?? '')
        if (!isForbidden) {
          console.warn('[AssessmentDashboard] Overview API request failed:', err?.message || err)
        }
        return null
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  })
}

// 2. Intake-wide Hall Ticket summary
export function useHallTicketDashboard(options?: { enabled?: boolean }) {
  return useQuery<HallTicketDashboardDto | null>({
    queryKey: ASSESSMENT_DASHBOARD_KEYS.hallTicket(),
    queryFn: async () => {
      try {
        return await getHallTicketDashboard()
      } catch (err: any) {
        console.warn('[AssessmentDashboard] Hall ticket API request failed:', err?.message || err)
        return null
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  })
}

// 3. Resit summary & schedule
// Graceful fallback to null when 400 "No active window" or permissions lack
export function useResitDashboard(page: number = 1, pageSize: number = 10, options?: { enabled?: boolean }) {
  return useQuery<ResitDashboardDto | null>({
    queryKey: ASSESSMENT_DASHBOARD_KEYS.resit(page, pageSize),
    queryFn: async () => {
      try {
        return await getResitDashboard(page, pageSize)
      } catch (err: any) {
        // "No active window" or 400 bad_request is a standard expected response when no resit is running
        console.warn('[AssessmentDashboard] Resit API returned:', err?.message || err)
        return null
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  })
}

// 4. "My subjects" for lecturers
export function useLecturerDashboard(options?: { enabled?: boolean }) {
  return useQuery<LecturerDashboardDto | null>({
    queryKey: ASSESSMENT_DASHBOARD_KEYS.lecturer(),
    queryFn: async () => {
      try {
        return await getLecturerDashboard()
      } catch (err: any) {
        // Expected for non-lecturers (Admin/Registrar) or lecturers with no units this intake
        return null
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  })
}

export type {
  AssessmentOverviewDto,
  HallTicketDashboardDto,
  HallTicketTermCount,
  ResitDashboardDto,
  LecturerDashboardDto,
  ScheduledResitExamItem,
  PendingResitEvaluationItem,
  LecturerScheduleItem,
} from '@/lib/api/assessment/dashboard'
