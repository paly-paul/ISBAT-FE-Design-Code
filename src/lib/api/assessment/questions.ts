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

let mockQuestions: QuestionDto[] = [
  {
    questionGuid: '8f14e45f-ceea-467e-a4c8-5c6e9df8a6a3',
    questionText: 'What is 2 + 2?',
    option1Text: '3',
    option2Text: '4',
    option3Text: '5',
    option4Text: '6',
    answerText: '4',
    questionType: 1,
    level: 2,
  },
]

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

/**
 * Fetch course units for single-question view/edit (lecturerGuid is optional).
 */
export function getSingleQuestionCourseUnits(intakeGuid: string, lecturerGuid?: string): Promise<QuestionBankCourseUnit[]> {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { courseUnitGuid: '017749e8-a325-4560-b8db-2230721d838f', courseUnitCode: 'BCS3127', courseUnitName: 'Compiler Design' }
    ])
  }
  const params = new URLSearchParams({ intakeGuid })
  if (lecturerGuid) {
    params.append('lecturerGuid', lecturerGuid)
  }
  return apiGet<QuestionBankCourseUnit[]>(`/api/v1/assessment/questions/course-units?${params.toString()}`)
    .then(data => data ?? [])
    .catch(async () => {
      // Fallback: try question-bank course-units if lecturerGuid was supplied
      if (lecturerGuid) {
        return apiGet<QuestionBankCourseUnit[]>(`/api/v1/assessment/question-bank/course-units?${params.toString()}`).catch(() => [])
      }
      return []
    })
}

/**
 * Fetch all questions for a given course unit, category, and intake.
 */
export function getQuestions(courseUnitGuid: string, category: number, intakeGuid: string): Promise<QuestionDto[] | null> {
  if (MOCK_AUTH) {
    return Promise.resolve(null)
  }
  const params = new URLSearchParams({
    courseUnitGuid,
    category: String(category),
    intakeGuid,
  })
  return apiGet<QuestionDto[]>(`/api/v1/assessment/questions?${params.toString()}`)
    .then(data => data ?? [])
    .catch((err) => {
      console.warn('Failed to load questions from backend:', err)
      return []
    })
}

/**
 * Fetch a single question by its GUID.
 */
export function getQuestionByGuid(guid: string): Promise<QuestionDto> {
  if (MOCK_AUTH) {
    const q = mockQuestions.find(mq => mq.questionGuid === guid)
    return q ? Promise.resolve(q) : Promise.reject(new Error('Not found'))
  }
  return apiGet<QuestionDto>(`/api/v1/assessment/questions/${guid}`)
}

/**
 * Create a new question.
 */
export function createQuestion(payload: CreateQuestionRequest): Promise<QuestionDto> {
  if (MOCK_AUTH) {
    const newQ: QuestionDto = {
      questionGuid: crypto.randomUUID(),
      questionText: payload.questionText,
      option1Text: payload.option1Text,
      option2Text: payload.option2Text,
      option3Text: payload.option3Text,
      option4Text: payload.option4Text,
      answerText: payload.answerText,
      questionType: payload.questionType,
      level: payload.level,
    }
    mockQuestions.push(newQ)
    return Promise.resolve(newQ)
  }
  return apiPost<QuestionDto>('/api/v1/assessment/questions', payload)
}

/**
 * Update an existing question.
 */
export function updateQuestion(guid: string, payload: UpdateQuestionRequest): Promise<QuestionDto> {
  if (MOCK_AUTH) {
    const idx = mockQuestions.findIndex(q => q.questionGuid === guid)
    if (idx === -1) return Promise.reject(new Error('Not found'))
    
    mockQuestions[idx] = {
      ...mockQuestions[idx],
      ...payload
    }
    return Promise.resolve(mockQuestions[idx])
  }
  return apiPut<QuestionDto>(`/api/v1/assessment/questions/${guid}`, payload)
}

/**
 * Soft-delete an existing question.
 */
export function deleteQuestion(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    mockQuestions = mockQuestions.filter(q => q.questionGuid !== guid)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/assessment/questions/${guid}`)
}
