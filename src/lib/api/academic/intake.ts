import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// One semester/term block inside an intake's academic calendar. An intake
// can have more than one of these (e.g. Semester 1 and Semester 2), which is
// why the backend nests them in an array instead of flattening them onto the
// intake itself.
//
// Heads up: the very first GET sample we saw only showed a short version of
// this object (semCode + the semester/term dates). Once we saw the real
// POST /api/v1/academic/intakes payload and response, it turned out there's
// a much longer list of date fields in here too (admission dates, re-entry
// dates, resit dates, and so on). Since we've only actually confirmed those
// extra fields exist on the create response — not on every GET result — they
// are marked optional below rather than required, just in case an older
// intake in the list doesn't have them filled in.
export interface AcademicCalendarEntry {
  academicCalendarGuid: string | null
  semCode: number
  // These six are nullable rather than plain `string` because we've now seen
  // first-hand that a calendar entry can legitimately have one left unset
  // (e.g. a semester whose end date hasn't been decided yet) — the backend
  // represents "not set" as null, not as an empty string.
  semesterStartDate: string | null
  semesterEndDate: string | null
  term1StartDate: string | null
  term1EndDate: string | null
  term2StartDate: string | null
  term2EndDate: string | null
  // Confirmed via the create response, not the original GET sample — see the
  // note above.
  admissionStartDate?: string | null
  admissionLateFeeDate?: string | null
  admissionEndDate?: string | null
  reentryStartDate?: string | null
  reentryLateFeeDate?: string | null
  reentryEndDate?: string | null
  lumpsumDate?: string | null
  resitStartDate?: string | null
  resitEndDate?: string | null
  finalExamStartDate?: string | null
  finalExamEndDate?: string | null
  clearanceDate?: string | null
}

// This is the shape of a single intake the way the backend hands it back to
// us, whether that's from the GET list or from creating a new one.
//
// intakeGuid and intakeCode used to be a mystery — the very first GET sample
// we were given didn't include either of them, so for a while the intake
// table had to fall back to a made-up row key (financialYear + examYear +
// intakes + examMonth glued together). The POST /api/v1/academic/intakes
// response cleared this up: the backend DOES have a real identifier for an
// intake, it just wasn't visible in that first example. intakeGuid is the
// one to use for anything that needs a stable id (editing, deleting, linking
// elsewhere); intakeCode is a human-friendly number (e.g. 20264) meant for
// display, similar to how shortCode works for departments.
export interface Intake {
  intakeGuid: string
  intakeCode: number
  description: string
  financialYear: number
  examYear: number
  intakes: number
  examMonth: number
  month: string
  durationInWeeks: number
  // Nullable for the same reason as the calendar-entry dates below — these
  // can be left unset on an intake, and the backend uses null for "not set"
  // rather than an empty string.
  lastDateForReRegistration: string | null
  currentIntake: boolean
  grievanceStartDate: string | null
  currentAdmissionIntake: boolean
  grievanceEndDate: string | null
  // This can genuinely be missing (undefined) for an intake that hasn't had
  // its semester calendar set up yet, not just an empty array — confirmed by
  // a real crash in the app when an intake came back without it. Every place
  // that reads this needs to handle "not there at all".
  academicCalendar?: AcademicCalendarEntry[]
}

interface IntakeListResponse {
  items: Intake[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// What the "Add Intake" form actually sends to POST /api/v1/academic/intakes.
// intakeGuid/intakeCode aren't part of this — the backend generates both of
// those itself and hands them back in the response, so they only belong on
// the `Intake` read-shape above, never on something we send up.
export interface CreateAcademicCalendarEntryInput {
  // Always sent as null when creating — the backend assigns the real guid
  // and gives it back to us in the response.
  academicCalendarGuid: null
  semCode: number
  // Every one of these date fields is `string | null` rather than plain
  // `string` on purpose: the backend deserializes them straight into .NET
  // DateTime fields, and it turns out DateTime can parse a real date string
  // or accept null, but NOT an empty string "" — sending "" (which is what
  // an empty <input type="date"> gives you) throws a JSON conversion error
  // ("The JSON value could not be converted..."). So any date left blank in
  // the form has to be converted to null before it goes in the request, not
  // left as "".
  admissionStartDate: string | null
  admissionLateFeeDate: string | null
  admissionEndDate: string | null
  reentryStartDate: string | null
  reentryLateFeeDate: string | null
  reentryEndDate: string | null
  semesterStartDate: string | null
  semesterEndDate: string | null
  lumpsumDate: string | null
  term1StartDate: string | null
  term1EndDate: string | null
  term2StartDate: string | null
  term2EndDate: string | null
  resitStartDate: string | null
  resitEndDate: string | null
  finalExamStartDate: string | null
  finalExamEndDate: string | null
  clearanceDate: string | null
}

export interface CreateIntakeInput {
  description: string
  financialYear: number
  examYear: number
  intakes: number
  examMonth: number
  month: string
  durationInWeeks: number
  // Same "" vs null issue as the calendar entry dates above — these three
  // are optional in the form, so they need to become null rather than ""
  // when left blank.
  lastDateForReRegistration: string | null
  currentIntake: boolean
  grievanceStartDate: string | null
  currentAdmissionIntake: boolean
  grievanceEndDate: string | null
  academicCalendar: CreateAcademicCalendarEntryInput[]
}

// Small stand-in dataset for local/offline work — only used when
// NEXT_PUBLIC_AUTH_MOCK is turned on. Shaped exactly like the real response
// so the table renders the same way whether the data comes from here or from
// the live backend.
const mockIntakes: Intake[] = [
  {
    intakeGuid: 'a1b2c3d4-0000-4000-8000-000000000001',
    intakeCode: 20241,
    description: '2024 Semester 1',
    financialYear: 2024,
    examYear: 2024,
    intakes: 1,
    examMonth: 8,
    month: 'August',
    durationInWeeks: 17,
    lastDateForReRegistration: '2024-02-28T00:00:00',
    currentIntake: true,
    grievanceStartDate: '2024-08-01T00:00:00',
    currentAdmissionIntake: false,
    grievanceEndDate: '2024-08-15T00:00:00',
    academicCalendar: [
      {
        academicCalendarGuid: null,
        semCode: 1,
        semesterStartDate: '2024-02-12T00:00:00',
        semesterEndDate: '2024-06-07T00:00:00',
        term1StartDate: '2024-02-12T00:00:00',
        term1EndDate: '2024-04-05T00:00:00',
        term2StartDate: '2024-04-08T00:00:00',
        term2EndDate: '2024-06-07T00:00:00',
      },
    ],
  },
  {
    intakeGuid: 'a1b2c3d4-0000-4000-8000-000000000002',
    intakeCode: 20242,
    description: '2024 Semester 2',
    financialYear: 2024,
    examYear: 2024,
    intakes: 2,
    examMonth: 12,
    month: 'December',
    durationInWeeks: 16,
    lastDateForReRegistration: '2024-08-30T00:00:00',
    currentIntake: false,
    grievanceStartDate: '2024-12-01T00:00:00',
    currentAdmissionIntake: true,
    grievanceEndDate: '2024-12-15T00:00:00',
    academicCalendar: [
      {
        academicCalendarGuid: null,
        semCode: 2,
        semesterStartDate: '2024-08-19T00:00:00',
        semesterEndDate: '2024-12-13T00:00:00',
        term1StartDate: '2024-08-19T00:00:00',
        term1EndDate: '2024-10-11T00:00:00',
        term2StartDate: '2024-10-14T00:00:00',
        term2EndDate: '2024-12-13T00:00:00',
      },
    ],
  },
]
let mockIntakeSeq = mockIntakes.length + 1

export function getIntakes(page = 1, pageSize = 10): Promise<Intake[]> {
  if (MOCK_AUTH) return Promise.resolve(mockIntakes)
  return apiGet<IntakeListResponse | null>(`/api/v1/academic/intakes?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

// Confirmed via GET /api/v1/academic/intakes/:intakeGuid — returns the same
// Intake shape as the list/create endpoints, but with every academicCalendar
// entry fully populated (admission/re-entry/resit/final-exam/clearance
// dates included), which is what the Edit Intake form needs to prefill.
export function getIntakeById(intakeGuid: string): Promise<Intake> {
  if (MOCK_AUTH) {
    const found = mockIntakes.find(i => i.intakeGuid === intakeGuid)
    if (!found) return Promise.reject(new Error('Intake not found'))
    return Promise.resolve(found)
  }
  return apiGet<Intake>(`/api/v1/academic/intakes/${intakeGuid}`)
}

export function createIntake(input: CreateIntakeInput): Promise<Intake> {
  if (MOCK_AUTH) {
    const intake: Intake = {
      intakeGuid: crypto.randomUUID(),
      intakeCode: input.financialYear * 10 + (mockIntakeSeq++),
      ...input,
      // The backend assigns a real guid to each calendar entry on save —
      // mimic that here instead of leaving the null we sent it with.
      academicCalendar: input.academicCalendar.map(entry => ({ ...entry, academicCalendarGuid: crypto.randomUUID() })),
    }
    mockIntakes.push(intake)
    return Promise.resolve(intake)
  }
  return apiPost<Intake>('/api/v1/academic/intakes', input)
}

// Confirmed via PUT /api/v1/academic/intakes/:intakeGuid — takes the exact
// same body shape as create (including academicCalendarGuid: null on every
// entry; the backend re-associates calendar rows itself rather than needing
// their existing guids echoed back).
export function updateIntake(intakeGuid: string, input: CreateIntakeInput): Promise<Intake> {
  if (MOCK_AUTH) {
    const existing = mockIntakes.find(i => i.intakeGuid === intakeGuid)
    if (!existing) return Promise.reject(new Error('Intake not found'))
    Object.assign(existing, input, {
      // Same reasoning as createIntake's mock branch — mimic the backend
      // assigning a real guid to each calendar entry, reusing the existing
      // one for a semCode that was already there.
      academicCalendar: input.academicCalendar.map(entry => ({
        ...entry,
        academicCalendarGuid: existing.academicCalendar?.find(e => e.semCode === entry.semCode)?.academicCalendarGuid ?? crypto.randomUUID(),
      })),
    })
    return Promise.resolve(existing)
  }
  return apiPut<Intake>(`/api/v1/academic/intakes/${intakeGuid}`, input)
}

// DELETE /api/v1/academic/intakes/:intakeGuid — same envelope-wrapped boolean
// result convention as deleteCountry/deleteDepartment/deleteDesignation.
export function deleteIntake(intakeGuid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockIntakes.findIndex(i => i.intakeGuid === intakeGuid)
    if (index === -1) return Promise.reject(new Error('Intake not found'))
    mockIntakes.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/intakes/${intakeGuid}`)
}
