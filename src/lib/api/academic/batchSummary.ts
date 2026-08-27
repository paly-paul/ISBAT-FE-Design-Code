import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs the Student module's Batch Summary page (see
// student/batch-summary/page.tsx). One row per batch, already resolved to
// display names server-side (programme/semester/faculty) plus a live
// headcount — unlike students/counts-by-batch (headcount only, needs known
// batch guids) or students/search/search (returns students, not batches),
// this is the one endpoint that returns the exact grid shape the page needs.
// Field names below (batchCode/programName/semesterName/facultyName/
// headCount) follow this app's existing naming for the same concepts
// (Batch.batchCode, StudentDto.programName/semesterName) but aren't
// confirmed against a real response yet — adjust here if the real payload
// uses different keys.
export interface BatchSummaryItem {
  batchGuid: string
  batchCode: string
  programName: string
  semesterName: string
  facultyName: string
  headCount: number
}

const mockBatchSummary: BatchSummaryItem[] = [
  { batchGuid: 'b1',  batchCode: 'BSC.IT-2024A', programName: 'BSc. Information Technology',           semesterName: 'Semester 3', facultyName: 'Faculty of Computing',       headCount: 52 },
  { batchGuid: 'b2',  batchCode: 'BBA-2024A',     programName: 'Bachelor of Business Admin.',           semesterName: 'Semester 3', facultyName: 'Faculty of Business',        headCount: 48 },
  { batchGuid: 'b3',  batchCode: 'BSC.IT-2025A', programName: 'BSc. Information Technology',           semesterName: 'Semester 1', facultyName: 'Faculty of Computing',       headCount: 37 },
  { batchGuid: 'b4',  batchCode: 'DNCS-2024A',    programName: 'Diploma in Networking & Cyber Security', semesterName: 'Semester 2', facultyName: 'Faculty of Computing',       headCount: 29 },
  { batchGuid: 'b5',  batchCode: 'NUR-2025A',     programName: 'Diploma in Nursing',                    semesterName: 'Semester 4', facultyName: 'Faculty of Health Sciences', headCount: 33 },
  { batchGuid: 'b6',  batchCode: 'BBA-2025A',     programName: 'Bachelor of Business Admin.',           semesterName: 'Semester 1', facultyName: 'Faculty of Business',        headCount: 41 },
  { batchGuid: 'b7',  batchCode: 'BSC.CS-2024A', programName: 'BSc. Computer Science',                 semesterName: 'Semester 3', facultyName: 'Faculty of Computing',       headCount: 26 },
  { batchGuid: 'b8',  batchCode: 'DIP.ED-2024A', programName: 'Diploma in Education',                  semesterName: 'Semester 2', facultyName: 'Faculty of Education',       headCount: 31 },
  { batchGuid: 'b9',  batchCode: 'BSC.IT-2023B', programName: 'BSc. Information Technology',           semesterName: 'Semester 5', facultyName: 'Faculty of Computing',       headCount: 22 },
  { batchGuid: 'b10', batchCode: 'BBA-2023B',     programName: 'Bachelor of Business Admin.',           semesterName: 'Semester 5', facultyName: 'Faculty of Business',        headCount: 19 },
  { batchGuid: 'b11', batchCode: 'NUR-2024B',     programName: 'Diploma in Nursing',                    semesterName: 'Semester 2', facultyName: 'Faculty of Health Sciences', headCount: 27 },
  { batchGuid: 'b12', batchCode: 'DIP.ED-2025A', programName: 'Diploma in Education',                  semesterName: 'Semester 1', facultyName: 'Faculty of Education',       headCount: 24 },
]
// Mock rows are spread round-robin across the mock campus guids ('1'
// Makerere, '2' Kampala City, '3' Mbarara, '4' Gulu — see
// lib/api/academic/campus.ts) purely so the dropdown filter has something to
// demonstrate in NEXT_PUBLIC_AUTH_MOCK mode; the real endpoint does this
// filtering server-side.
const mockBatchCampusGuids: Record<string, string> = {
  b1: '1', b2: '1', b3: '2', b4: '2', b5: '3', b6: '3', b7: '4', b8: '4', b9: '1', b10: '2', b11: '3', b12: '4',
}

export function getBatchSummary(campusGuid?: string | null): Promise<BatchSummaryItem[]> {
  if (MOCK_AUTH) {
    const items = campusGuid ? mockBatchSummary.filter(b => mockBatchCampusGuids[b.batchGuid] === campusGuid) : mockBatchSummary
    return Promise.resolve(items)
  }
  const qs = campusGuid ? `?campusGuid=${encodeURIComponent(campusGuid)}` : ''
  return apiGet<BatchSummaryItem[] | { items: BatchSummaryItem[] } | null>(`/api/v1/academic/batch-summary${qs}`)
    .then(data => (Array.isArray(data) ? data : data?.items) ?? [])
}
