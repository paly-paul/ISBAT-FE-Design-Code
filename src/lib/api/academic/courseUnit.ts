import { apiDelete, apiGet, apiPostForm, apiPutForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface CourseUnitTopic {
  courseUnitTopicGuid: string
  courseUnitTopicCode: string
  courseUnitTopicDetails: string
  studySequence: number
  // The API uses different names for this field in different requests.
  employeeGuid: string
}

export interface CourseUnitOutline {
  courseUnitOutlineGuid: string
  courseUnitGuid: string
  chapter: number
  chapterName: string
  topics: CourseUnitTopic[]
}

// This matches the real API shape for course units.
export interface CourseUnit {
  courseUnitGuid: string
  courseUnitCode: string
  courseUnitName: string
  maxCredits: number
  chapterCount: number
  courseUnitRepetitionGuid: string | null
  mid: number
  cw: number
  ca: number
  syllabus: string | null
  outlines: CourseUnitOutline[]
}

interface CourseUnitListResponse {
  items: CourseUnit[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Backing store used only when NEXT_PUBLIC_AUTH_MOCK is on — reuses the two
// confirmed real sample records from the GET response.
const mockCourseUnits: CourseUnit[] = [
  {
    courseUnitGuid: '8ff9b8a2-144e-41c1-b4c4-002b954ef0d8',
    courseUnitCode: 'CS1012',
    courseUnitName: 'Introduction to Programming',
    maxCredits: 3,
    chapterCount: 3,
    courseUnitRepetitionGuid: '1',
    mid: 1,
    cw: 1,
    ca: 0,
    syllabus: 'http://host.docker.internal:5200/api/v1/local-files/academic/courseunit/2026/07/0a11b425447b4d57a91c50f24840439c.md',
    outlines: [
      {
        courseUnitOutlineGuid: '9ae7f67a-932a-4edf-9f26-2e2b52b80227',
        courseUnitGuid: '8ff9b8a2-144e-41c1-b4c4-002b954ef0d8',
        chapter: 1,
        chapterName: 'Basics of Programming',
        topics: [
          { courseUnitTopicGuid: '282f843c-4f55-43fd-811d-ef1ce58552b4', courseUnitTopicCode: 'CS1012_1', courseUnitTopicDetails: 'Variables and Data Types', studySequence: 1, employeeGuid: '5' },
          { courseUnitTopicGuid: '0a5a1d5f-42bc-4fe2-ad62-f4597d8b548f', courseUnitTopicCode: 'CS1012_2', courseUnitTopicDetails: 'Operators and Expressions', studySequence: 2, employeeGuid: '5' },
        ],
      },
      {
        courseUnitOutlineGuid: '7d0aa3a4-a801-47db-baee-771219db3001',
        courseUnitGuid: '8ff9b8a2-144e-41c1-b4c4-002b954ef0d8',
        chapter: 2,
        chapterName: 'Control Structures',
        topics: [
          { courseUnitTopicGuid: '32955c9f-e3b1-4f15-a27d-b1c2ffd3be8f', courseUnitTopicCode: 'CS1012_3', courseUnitTopicDetails: 'Loops and Conditionals', studySequence: 1, employeeGuid: '5' },
        ],
      },
      {
        courseUnitOutlineGuid: 'f4db9dbc-5597-44c1-a1a2-1f46042087ef',
        courseUnitGuid: '8ff9b8a2-144e-41c1-b4c4-002b954ef0d8',
        chapter: 3,
        chapterName: 'Functions and Modularity',
        topics: [
          { courseUnitTopicGuid: 'b7569cb1-669e-4738-b156-bf6fbfa88ec3', courseUnitTopicCode: 'CS1012_4', courseUnitTopicDetails: 'Function Declaration and Scope', studySequence: 1, employeeGuid: '6' },
        ],
      },
    ],
  },
  {
    courseUnitGuid: '4d74c802-679f-48bc-8c64-3e427017da76',
    courseUnitCode: 'CS101',
    courseUnitName: 'Introduction to Programming',
    maxCredits: 3,
    chapterCount: 3,
    courseUnitRepetitionGuid: '1',
    mid: 1,
    cw: 1,
    ca: 0,
    syllabus: null,
    outlines: [
      {
        courseUnitOutlineGuid: '8d7c89ab-8451-46cc-90a9-8fa0d9bb0f1c',
        courseUnitGuid: '4d74c802-679f-48bc-8c64-3e427017da76',
        chapter: 1,
        chapterName: 'Basics of Programming',
        topics: [
          { courseUnitTopicGuid: '87df8261-5528-43ac-9de3-615372ee0c7d', courseUnitTopicCode: 'CS101_1', courseUnitTopicDetails: 'Variables and Data Types', studySequence: 1, employeeGuid: '5' },
          { courseUnitTopicGuid: 'c586134e-1f49-4539-a296-37b726e28e90', courseUnitTopicCode: 'CS101_2', courseUnitTopicDetails: 'Operators and Expressions', studySequence: 2, employeeGuid: '5' },
        ],
      },
      {
        courseUnitOutlineGuid: '724ec531-1cf7-44b1-8062-283c8c71a8b5',
        courseUnitGuid: '4d74c802-679f-48bc-8c64-3e427017da76',
        chapter: 2,
        chapterName: 'Control Structures',
        topics: [
          { courseUnitTopicGuid: '748bab9e-9071-4d65-a719-27f0e7372d4c', courseUnitTopicCode: 'CS101_3', courseUnitTopicDetails: 'Loops and Conditionals', studySequence: 1, employeeGuid: '5' },
        ],
      },
      {
        courseUnitOutlineGuid: '4a724ff1-89e4-487c-9815-493e941cb3ca',
        courseUnitGuid: '4d74c802-679f-48bc-8c64-3e427017da76',
        chapter: 3,
        chapterName: 'Functions and Modularity',
        topics: [
          { courseUnitTopicGuid: '725c313f-0bf5-4d33-9353-804dc0674d97', courseUnitTopicCode: 'CS101_4', courseUnitTopicDetails: 'Function Declaration and Scope', studySequence: 1, employeeGuid: '6' },
        ],
      },
    ],
  },
]

export function getCourseUnits(pageNumber = 1, pageSize = 1000): Promise<CourseUnit[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCourseUnits)
  return apiGet<CourseUnitListResponse | null>(`/api/v1/academic/courseunits?pageNumber=${pageNumber}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

export interface CourseUnitTopicInput {
  courseUnitTopicDetails: string
  studySequence: number
  // Employee guid — see the comment on CourseUnitTopic.employeeGuid above.
  // Kept as taughtBy here since that's the payload's own field name
  // (appendOutlines sends it under the EmployeeGuid form key regardless).
  taughtBy: string
}

export interface CourseUnitOutlineInput {
  chapter: number
  chapterName: string
  topics: CourseUnitTopicInput[]
}

// Confirmed create payload — sent as multipart/form-data (not JSON) since
// syllabus is an optional file. Outlines is sent using ASP.NET's indexed
// flat-key convention (see appendOutlines below), not a single JSON string
// field — a JSON string came back as an empty list in testing. Note the
// PascalCase keys under Outlines[] (Chapter/ChapterName/Topics[]/...) versus
// camelCase for the top-level fields — that's the confirmed casing from a
// working Bruno request, not a typo. courseUnitRepetitionGuid
// (RepetitionTag.courseUnitRepetitionGuid) is optional — omitted/null when
// no tag is picked. cwWeightage/cbtWeightage/ueWeightage are the "Final Wt."
// marks from the Assessment Weightage section. approved has no UI control
// yet — hardcoded to 1 at the call site pending a real toggle.
export interface CourseUnitInput {
  courseUnitCode: string
  courseUnitName: string
  maxCredits: number
  chapterCount: number
  courseUnitRepetitionGuid: string | null
  mid: number
  cw: number
  ca: number
  approved: number
  cbtWeightage: number
  cwWeightage: number
  ueWeightage: number
  outlines: CourseUnitOutlineInput[]
  syllabus?: File | null
}

// ASP.NET Core's default model binder doesn't auto-parse a JSON string
// sitting in one multipart/form-data field into a nested List<T> — it needs
// either an explicit server-side JsonSerializer.Deserialize on that field,
// or the indexed flat-key convention below, which the default binder does
// understand for [FromForm] complex-object lists. A single JSON-string
// 'outlines' field came back as an empty list in testing; this flat-key
// form (with the confirmed PascalCase casing) is what a working Bruno
// request used instead.
function appendOutlines(formData: FormData, outlines: CourseUnitOutlineInput[]) {
  outlines.forEach((o, oi) => {
    formData.append(`Outlines[${oi}].Chapter`, String(o.chapter))
    formData.append(`Outlines[${oi}].ChapterName`, o.chapterName)
    o.topics.forEach((t, ti) => {
      formData.append(`Outlines[${oi}].Topics[${ti}].CourseUnitTopicDetails`, t.courseUnitTopicDetails)
      formData.append(`Outlines[${oi}].Topics[${ti}].StudySequence`, String(t.studySequence))
      formData.append(`Outlines[${oi}].Topics[${ti}].EmployeeGuid`, t.taughtBy)
    })
  })
}

let mockCourseUnitSeq = mockCourseUnits.length + 1

export function createCourseUnit(input: CourseUnitInput): Promise<CourseUnit> {
  if (MOCK_AUTH) {
    const guid = String(mockCourseUnitSeq++)
    const unit: CourseUnit = {
      courseUnitGuid: guid,
      courseUnitCode: input.courseUnitCode,
      courseUnitName: input.courseUnitName,
      maxCredits: input.maxCredits,
      chapterCount: input.chapterCount,
      courseUnitRepetitionGuid: input.courseUnitRepetitionGuid,
      mid: input.mid,
      cw: input.cw,
      ca: input.ca,
      // Real syllabus value is a server-hosted URL once uploaded — no local
      // file host to resolve one against in mock mode.
      syllabus: input.syllabus ? input.syllabus.name : null,
      outlines: input.outlines.map((o, oi) => ({
        courseUnitOutlineGuid: `${guid}-${oi}`,
        courseUnitGuid: guid,
        chapter: o.chapter,
        chapterName: o.chapterName,
        topics: o.topics.map((t, ti) => ({
          courseUnitTopicGuid: `${guid}-${oi}-${ti}`,
          courseUnitTopicCode: `${input.courseUnitCode}_${ti + 1}`,
          courseUnitTopicDetails: t.courseUnitTopicDetails,
          studySequence: t.studySequence,
          employeeGuid: t.taughtBy,
        })),
      })),
    }
    mockCourseUnits.push(unit)
    return Promise.resolve(unit)
  }

  const formData = new FormData()
  formData.append('courseUnitCode', input.courseUnitCode)
  formData.append('courseUnitName', input.courseUnitName)
  formData.append('maxCredits', String(input.maxCredits))
  formData.append('chapterCount', String(input.chapterCount))
  if (input.courseUnitRepetitionGuid) formData.append('courseUnitRepetitionGuid', input.courseUnitRepetitionGuid)
  formData.append('mid', String(input.mid))
  formData.append('cw', String(input.cw))
  formData.append('ca', String(input.ca))
  formData.append('approved', String(input.approved))
  formData.append('cbtWeightage', String(input.cbtWeightage))
  formData.append('cwWeightage', String(input.cwWeightage))
  formData.append('ueWeightage', String(input.ueWeightage))
  appendOutlines(formData, input.outlines)
  if (input.syllabus) formData.append('syllabus', input.syllabus)
  return apiPostForm<CourseUnit>('/api/v1/academic/courseunits', formData)
}

// Confirmed GET-by-guid endpoint. Returns the same shape as one item of the
// list response (including outlines).
export function getCourseUnitById(guid: string): Promise<CourseUnit> {
  if (MOCK_AUTH) {
    const existing = mockCourseUnits.find(u => u.courseUnitGuid === guid)
    if (!existing) return Promise.reject(new Error('Course unit not found'))
    return Promise.resolve(existing)
  }
  return apiGet<CourseUnit>(`/api/v1/academic/courseunits/${guid}`)
}

// Same payload shape as create (see CourseUnitInput above), sent as
// multipart/form-data to the same .../courseunits/:guid endpoint used for
// GET. syllabus is only appended when the user picks a new file — omitting
// it leaves the existing attachment untouched rather than clearing it.
export function updateCourseUnit(guid: string, input: CourseUnitInput): Promise<CourseUnit> {
  if (MOCK_AUTH) {
    const existing = mockCourseUnits.find(u => u.courseUnitGuid === guid)
    if (!existing) return Promise.reject(new Error('Course unit not found'))
    existing.courseUnitCode = input.courseUnitCode
    existing.courseUnitName = input.courseUnitName
    existing.maxCredits = input.maxCredits
    existing.chapterCount = input.chapterCount
    existing.courseUnitRepetitionGuid = input.courseUnitRepetitionGuid
    existing.mid = input.mid
    existing.cw = input.cw
    existing.ca = input.ca
    if (input.syllabus) existing.syllabus = input.syllabus.name
    existing.outlines = input.outlines.map((o, oi) => ({
      courseUnitOutlineGuid: `${guid}-${oi}`,
      courseUnitGuid: guid,
      chapter: o.chapter,
      chapterName: o.chapterName,
      topics: o.topics.map((t, ti) => ({
        courseUnitTopicGuid: `${guid}-${oi}-${ti}`,
        courseUnitTopicCode: `${input.courseUnitCode}_${ti + 1}`,
        courseUnitTopicDetails: t.courseUnitTopicDetails,
        studySequence: t.studySequence,
        employeeGuid: t.taughtBy,
      })),
    }))
    return Promise.resolve(existing)
  }

  const formData = new FormData()
  formData.append('courseUnitCode', input.courseUnitCode)
  formData.append('courseUnitName', input.courseUnitName)
  formData.append('maxCredits', String(input.maxCredits))
  formData.append('chapterCount', String(input.chapterCount))
  if (input.courseUnitRepetitionGuid) formData.append('courseUnitRepetitionGuid', input.courseUnitRepetitionGuid)
  formData.append('mid', String(input.mid))
  formData.append('cw', String(input.cw))
  formData.append('ca', String(input.ca))
  formData.append('approved', String(input.approved))
  formData.append('cbtWeightage', String(input.cbtWeightage))
  formData.append('cwWeightage', String(input.cwWeightage))
  formData.append('ueWeightage', String(input.ueWeightage))
  appendOutlines(formData, input.outlines)
  if (input.syllabus) formData.append('syllabus', input.syllabus)
  return apiPutForm<CourseUnit>(`/api/v1/academic/courseunits/${guid}`, formData)
}

export function deleteCourseUnit(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockCourseUnits.findIndex(u => u.courseUnitGuid === guid)
    if (index === -1) return Promise.reject(new Error('Course unit not found'))
    mockCourseUnits.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/courseunits/${guid}`)
}
