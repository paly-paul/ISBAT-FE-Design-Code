import { apiGet, apiPost } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs Batch Transfer (see student/batch-transfer/page.tsx). There is no
// endpoint literally called "batch transfer" — this is students/resume/*,
// documented as the "Student Resuming" workflow, but it's the only endpoint
// that actually moves ANY student's semester/batch/fee (dropout-rejoin's
// sibling endpoint only works for REGSTATUS = 3 students). Reused
// deliberately per user direction — worth knowing the backend's own audit
// trail will record every transfer made through this page as
// T_STUDENT_RESUME / "Resuming Student", not as a distinct "batch transfer"
// event, since no such event type exists server-side. There's also no GET
// history endpoint anywhere for this — the Transfer History grid on the page
// stays mock regardless of this wiring.
export interface ResumeSemesterOption { semesterGuid: string; semName: string }
export interface ResumeFeeHeadOption { feeHdGuid: string; feeCode: string; feeDesc: string }
export interface ResumeBatchOption { batchGuid: string; batchCode: string }

export interface ResumeCandidateDto {
  studentGuid: string
  studentRegNo: string
  studentName: string
  currentProgramGuid: string
  currentProgramName: string
  currentSemesterGuid: string
  currentSemesterName: string
  availableSemesters: ResumeSemesterOption[]
  availableFeeHeads: ResumeFeeHeadOption[]
  availableBatches: ResumeBatchOption[]
}

export interface ResumeStudentRequest {
  newSemesterGuid: string
  newBatchGuid: string
  newFeeGuid: string
}

export interface ResumeResultDto {
  studentGuid: string
  studentRegNo: string
  studentName: string
}

// Minimal identity fields needed to synthesize a mock candidate — StudentDto
// itself carries no guids for programme/semester/batch (only display
// strings), so the mock's own currentProgramGuid/currentSemesterGuid below
// are synthetic placeholders, not real lookups.
export interface ResumeCandidateMockSeed {
  studentRegNo: string
  studentName: string
  programName: string
  semesterName: string
}

const mockOptions = {
  availableSemesters: [
    { semesterGuid: 'mock-sem-1', semName: 'Semester 1' },
    { semesterGuid: 'mock-sem-2', semName: 'Semester 2' },
    { semesterGuid: 'mock-sem-3', semName: 'Semester 3' },
  ],
  availableFeeHeads: [
    { feeHdGuid: 'mock-fee-1', feeCode: 'BSC.IT.DA.LCL', feeDesc: 'BSc. IT — Day · Local' },
    { feeHdGuid: 'mock-fee-2', feeCode: 'BSC.IT.EV.LCL', feeDesc: 'BSc. IT — Evening · Local' },
  ],
  availableBatches: [
    { batchGuid: 'mock-batch-1', batchCode: 'BSc.IT-2024B' },
    { batchGuid: 'mock-batch-2', batchCode: 'BSc.IT-2025A' },
  ],
}

// Any active student is a valid candidate (no REGSTATUS precondition, unlike
// dropout-rejoin).
export function getResumeCandidate(studentGuid: string, mockSeed: ResumeCandidateMockSeed): Promise<ResumeCandidateDto> {
  if (MOCK_AUTH) {
    return Promise.resolve({
      studentGuid,
      studentRegNo: mockSeed.studentRegNo,
      studentName: mockSeed.studentName,
      currentProgramGuid: 'mock-current-program',
      currentProgramName: mockSeed.programName,
      currentSemesterGuid: 'mock-current-semester',
      currentSemesterName: mockSeed.semesterName,
      ...mockOptions,
    })
  }
  return apiGet<ResumeCandidateDto>(`/api/v1/students/resume/${studentGuid}/candidate`)
}

export function resumeStudent(studentGuid: string, payload: ResumeStudentRequest): Promise<ResumeResultDto> {
  if (MOCK_AUTH) return Promise.resolve({ studentGuid, studentRegNo: 'MOCK', studentName: 'Mock Student' })
  return apiPost<ResumeResultDto>(`/api/v1/students/resume/${studentGuid}/resume`, payload)
}
