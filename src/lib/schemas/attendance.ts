import { z } from 'zod'

export const AttendanceRecordSchema = z.object({
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  attended: z.number().int().min(0),
  total: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  lastUpdated: z.string().datetime({ offset: true }).optional(),
})

export const AttendanceResponseSchema = z.object({
  data: z.array(AttendanceRecordSchema),
  meta: z
    .object({
      overallPercentage: z.number().optional(),
      semester: z.string().optional(),
    })
    .optional(),
})

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>
export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>
