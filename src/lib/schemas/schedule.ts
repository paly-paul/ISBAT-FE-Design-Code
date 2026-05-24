import { z } from 'zod'

export const DaySchema = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

export const ScheduleSlotSchema = z.object({
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  day: DaySchema,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  room: z.string().min(1),
  lecturer: z.string().min(1),
  type: z.enum(['Lecture', 'Lab', 'Tutorial', 'Seminar']).optional(),
})

export const ScheduleResponseSchema = z.object({
  data: z.array(ScheduleSlotSchema),
  meta: z
    .object({
      semester: z.string().optional(),
      academicYear: z.string().optional(),
    })
    .optional(),
})

export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>
export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>
