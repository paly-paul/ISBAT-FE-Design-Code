import { z } from 'zod'

export const GradeRecordSchema = z.object({
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  credits: z.number().int().positive(),
  grade: z.string().min(1),
  gradePoints: z.number().min(0).max(5),
  semester: z.string().min(1),
  status: z.enum(['Pass', 'Fail', 'Pending']),
})

export const GradesResponseSchema = z.object({
  data: z.array(GradeRecordSchema),
  meta: z
    .object({
      totalCredits: z.number().optional(),
      gpa: z.number().optional(),
      semester: z.string().optional(),
    })
    .optional(),
})

export type GradeRecord = z.infer<typeof GradeRecordSchema>
export type GradesResponse = z.infer<typeof GradesResponseSchema>
