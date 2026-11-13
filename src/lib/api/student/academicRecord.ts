import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Student academic record, modelled on the student portal's own "My Academic
// Record" page. Two endpoint families return the same shapes, each the staff
// equivalent of a student-portal call keyed by studentGuid instead of the
// logged-in session:
//   'dropout-rejoin' (Dropout Rejoin's tab; students/dropout-rejoin/*.md)
//     GET /students/dropout-rejoin/{guid}/credit-accumulation
//     GET /students/dropout-rejoin/{guid}/program-units
//   'profile' (Student Profile's tab; students/academic-record/*.md,
//   permission student.academicrecord.get)
//     GET /students/{guid}/academic-record/credit-accumulation
//     GET /students/{guid}/academic-record
// Both 400 (`failure`) when the student has no program/semester/batch.

export type AcademicRecordSource = 'dropout-rejoin' | 'profile'

const CREDITS_PATH: Record<AcademicRecordSource, (guid: string) => string> = {
  'dropout-rejoin': g => `/api/v1/students/dropout-rejoin/${g}/credit-accumulation`,
  profile: g => `/api/v1/students/${g}/academic-record/credit-accumulation`,
}
const UNITS_PATH: Record<AcademicRecordSource, (guid: string) => string> = {
  'dropout-rejoin': g => `/api/v1/students/dropout-rejoin/${g}/program-units`,
  profile: g => `/api/v1/students/${g}/academic-record`,
}

export interface CreditAccumulationDto {
  totalCredit: number
  earnedCredit: number
  // Rounded server-side; 0 when totalCredit is 0.
  creditPercentage: number
}

// Pending = no marks at all; RL = UE result late (UE null or 0).
export type UnitPassStatus = 'Pending' | 'Pass' | 'Fail' | 'RL'

export interface ProgramUnitDto {
  courseUnitGuid: string
  unitCode: string
  unitName: string
  credit: number
  iaMarksScored: number | null
  iaMaxMarks: number | null
  ueMarksScored: number | null
  ueMaxMarks: number | null
  passStatus: UnitPassStatus
}

export interface ProgramUnitSemesterDto {
  semesterGuid: string
  semesterName: string
  isCurrentSemester: boolean
  totalSemesterCredit: number
  units: ProgramUnitDto[]
}

export interface ProgramUnitsDto {
  studentName: string
  studentRegNo: string
  programGroupName: string
  totalProgramCredit: number
  // 0-based index into semesters; -1 = collapse all.
  autoExpandSemesterIndex: number
  semesters: ProgramUnitSemesterDto[]
}

const unit = (unitCode: string, unitName: string, credit: number, iaMarksScored: number | null, ueMarksScored: number | null, passStatus: UnitPassStatus): ProgramUnitDto =>
  ({ courseUnitGuid: unitCode, unitCode, unitName, credit, iaMarksScored, iaMaxMarks: 40, ueMarksScored, ueMaxMarks: 100, passStatus })

const mockProgramUnits: ProgramUnitsDto = {
  studentName: 'Aisha Nakamya',
  studentRegNo: '011240104',
  programGroupName: 'Bachelor of Information Technology',
  totalProgramCredit: 35,
  autoExpandSemesterIndex: 2,
  semesters: [
    { semesterGuid: 'sem-1', semesterName: 'Year One - Semester One', isCurrentSemester: false, totalSemesterCredit: 11, units: [
      unit('BIT1101', 'Introduction to Computing', 4, 34, 68, 'Pass'),
      unit('BIT1102', 'Mathematics for Computing', 4, 30, 61, 'Pass'),
      unit('BIT1103', 'Communication Skills', 3, 36, 70, 'Pass'),
    ] },
    { semesterGuid: 'sem-2', semesterName: 'Year One - Semester Two', isCurrentSemester: false, totalSemesterCredit: 8, units: [
      unit('BIT1201', 'Programming Fundamentals', 4, 32, 55, 'Pass'),
      unit('BIT1202', 'Database Systems', 4, 12, 30, 'Fail'),
    ] },
    { semesterGuid: 'sem-3', semesterName: 'Year Two - Semester One', isCurrentSemester: true, totalSemesterCredit: 16, units: [
      unit('BIT2101', 'Data Structures', 4, 31, null, 'RL'),
      unit('BIT2102', 'Computer Networks', 4, null, null, 'Pending'),
      unit('BIT2103', 'Artificial Intelligence', 4, null, null, 'Pending'),
      unit('BIT2104', 'Internet of Things', 4, null, null, 'Pending'),
    ] },
  ],
}

export function getCreditAccumulation(studentGuid: string, source: AcademicRecordSource): Promise<CreditAccumulationDto> {
  if (MOCK_AUTH) return Promise.resolve({ totalCredit: 120, earnedCredit: 63, creditPercentage: 53 })
  return apiGet<CreditAccumulationDto>(CREDITS_PATH[source](studentGuid))
}

export function getProgramUnits(studentGuid: string, source: AcademicRecordSource): Promise<ProgramUnitsDto> {
  if (MOCK_AUTH) return Promise.resolve(mockProgramUnits)
  return apiGet<ProgramUnitsDto>(UNITS_PATH[source](studentGuid))
    .then(data => ({ ...data, semesters: data?.semesters ?? [] }))
}
