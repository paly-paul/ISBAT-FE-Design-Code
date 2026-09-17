import { apiDelete, apiGet, apiPost, apiPut } from '../client'
import { QuestionBankCategory, QuestionBankCourseUnit } from './questionBank'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface QuestionDto {
  questionGuid: string
  questionText: string | null
  option1Text: string | null
  option2Text: string | null
  option3Text: string | null
  option4Text: string | null
  answerText: string | null
  questionType: number | null
  level: number | null
}

export interface CreateQuestionRequest {
  courseUnitGuid: string
  category: number
  intakeGuid: string
  questionType: number
  level: number | null
  questionText: string
  option1Text: string | null
  option2Text: string | null
  option3Text: string | null
  option4Text: string | null
  answerText: string
}

export interface UpdateQuestionRequest {
  questionType: number
  level: number | null
  questionText: string
  option1Text: string | null
  option2Text: string | null
  option3Text: string | null
  option4Text: string | null
  answerText: string
}

// ── Mock data for fallback testing ──────────────────────────────────────────

let mockQuestions: QuestionDto[] = []

// ── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch fixed Category dropdown for single-question view/edit.
 */
export function getSingleQuestionCategories(): Promise<QuestionBankCategory[]> {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { value: 1, name: 'Class Test' },
      { value: 2, name: 'Course Work' },
      { value: 3, name: 'Class Activity' }
    ])
  }
  return apiGet<QuestionBankCategory[]>('/api/v1/assessment/questions/categories')
    .then(data => data ?? [])
    .catch(() => [
      { value: 1, name: 'Class Test' },
      { value: 2, name: 'Course Work' },
      { value: 3, name: 'Class Activity' }
    ])
}

function normalizeCourseUnits(data: any): QuestionBankCourseUnit[] {
  const items = Array.isArray(data) ? data : data?.items ?? []
  return items
    .map((item: any) => ({
      courseUnitGuid: item.courseUnitGuid || item.guid || item.unitGuid || item.id || '',
      courseUnitCode: item.courseUnitCode || item.code || item.unitCode || '',
      courseUnitName: item.courseUnitName || item.name || item.unitName || item.title || 'Untitled Unit',
    }))
    .filter((u: QuestionBankCourseUnit) => Boolean(u.courseUnitGuid))
}

/**
 * Fetch course units for single-question and question-bank upload,
 * strictly scoped to the logged-in user's UUID (lecturerGuid) and academic intake.
 */
export async function getSingleQuestionCourseUnits(intakeGuid: string, lecturerGuid?: string): Promise<QuestionBankCourseUnit[]> {
  if (!intakeGuid && !lecturerGuid) {
    return []
  }

  const params = new URLSearchParams()
  if (intakeGuid) params.append('intakeGuid', intakeGuid)
  if (lecturerGuid) params.append('lecturerGuid', lecturerGuid)

  // 1. Try question-bank course-units endpoint scoped to lecturerGuid
  try {
    const data = await apiGet<any>(`/api/v1/assessment/question-bank/course-units?${params.toString()}`)
    const normalized = normalizeCourseUnits(data)
    if (normalized.length > 0) {
      return normalized
    }
  } catch {
    // Continue to next endpoint
  }

  // 2. Try questions course-units endpoint scoped to lecturerGuid
  try {
    const data = await apiGet<any>(`/api/v1/assessment/questions/course-units?${params.toString()}`)
    const normalized = normalizeCourseUnits(data)
    if (normalized.length > 0) {
      return normalized
    }
  } catch {
    // Both endpoints tried
  }

  return []
}

/**
 * Fetch all questions for a given course unit, category, and intake.
 */
export async function getQuestions(courseUnitGuid: string, category: number, intakeGuid: string): Promise<QuestionDto[]> {
  if (!courseUnitGuid) {
    return []
  }
  const params = new URLSearchParams({
    courseUnitGuid,
    category: String(category),
    intakeGuid,
  })
  try {
    const data = await apiGet<any>(`/api/v1/assessment/questions?${params.toString()}`)
    const items = Array.isArray(data) ? data : data?.items ?? []
    return items.map((q: any) => ({
      questionGuid: q.questionGuid || q.guid || q.id || '',
      questionText: q.questionText ?? q.question ?? '',
      option1Text: q.option1Text ?? q.option1 ?? null,
      option2Text: q.option2Text ?? q.option2 ?? null,
      option3Text: q.option3Text ?? q.option3 ?? null,
      option4Text: q.option4Text ?? q.option4 ?? null,
      answerText: q.answerText ?? q.answer ?? '',
      questionType: typeof q.questionType === 'number' ? q.questionType : (q.questionType === 'MCQ' ? 1 : 2),
      level: q.level ?? null,
    }))
  } catch (err) {
    console.warn('ℹ️ [Questions] Could not fetch questions from backend:', err)
    return []
  }
}

/**
 * Fetch a single question by its GUID.
 */
export async function getQuestionByGuid(guid: string): Promise<QuestionDto> {
  return await apiGet<QuestionDto>(`/api/v1/assessment/questions/${guid}`)
}

/**
 * Create a new question.
 */
export async function createQuestion(payload: CreateQuestionRequest): Promise<QuestionDto> {
  return await apiPost<QuestionDto>('/api/v1/assessment/questions', payload)
}

/**
 * Update an existing question.
 */
export async function updateQuestion(guid: string, payload: UpdateQuestionRequest): Promise<QuestionDto> {
  return await apiPut<QuestionDto>(`/api/v1/assessment/questions/${guid}`, payload)
}

/**
 * Soft-delete an existing question.
 */
export async function deleteQuestion(guid: string): Promise<boolean> {
  return await apiDelete<boolean>(`/api/v1/assessment/questions/${guid}`)
}
