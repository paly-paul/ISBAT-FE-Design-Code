import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getResitSchedules,
  getResitScheduleCourseUnits,
  createResitSchedule,
  getResitSchedule,
  updateResitSchedule,
  getResitCwSchedule,
  updateResitCwSchedule,
  getResitCtSchedule,
  updateResitCtSchedule,
  ResitScheduleSaveCommand,
  ResitCwScheduleSaveCommand,
  ResitCtScheduleSaveCommand
} from '@/lib/api/assessment/resitScheduling'

export function useResitSchedules(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['resit-schedules', params],
    queryFn: () => getResitSchedules(params)
  })
}

export function useResitScheduleCourseUnits() {
  return useQuery({
    queryKey: ['resit-schedule-course-units'],
    queryFn: () => getResitScheduleCourseUnits()
  })
}

export function useResitSchedule(resitScheduleGuid: string | null) {
  return useQuery({
    queryKey: ['resit-schedule', resitScheduleGuid],
    queryFn: () => getResitSchedule(resitScheduleGuid!),
    enabled: !!resitScheduleGuid
  })
}

export function useCreateResitSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ResitScheduleSaveCommand) => createResitSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resit-schedules'] })
      qc.invalidateQueries({ queryKey: ['resit-schedule-course-units'] })
    }
  })
}

export function useUpdateResitSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: ResitScheduleSaveCommand }) => updateResitSchedule(guid, data),
    onSuccess: (_, { guid }) => {
      qc.invalidateQueries({ queryKey: ['resit-schedules'] })
      qc.invalidateQueries({ queryKey: ['resit-schedule', guid] })
    }
  })
}

export function useResitCwSchedule() {
  return useQuery({
    queryKey: ['resit-cw-schedule'],
    queryFn: () => getResitCwSchedule()
  })
}

export function useUpdateResitCwSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ResitCwScheduleSaveCommand) => updateResitCwSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resit-cw-schedule'] })
    }
  })
}

export function useResitCtSchedule() {
  return useQuery({
    queryKey: ['resit-ct-schedule'],
    queryFn: () => getResitCtSchedule()
  })
}

export function useUpdateResitCtSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ResitCtScheduleSaveCommand) => updateResitCtSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resit-ct-schedule'] })
    }
  })
}
