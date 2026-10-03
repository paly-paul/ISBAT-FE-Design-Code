import { apiGet, apiPost } from '@/lib/api/client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface GownCollectionRow {
  studentGuid: string
  studentNumber: string | null
  studentName: string | null
  programName: string | null
  batchCode: string | null
  isGownCollected: boolean
}

export function searchGownCollection(searchTerm: string) {
  // FORCE MOCK DATA FOR UI TESTING
  return new Promise<GownCollectionRow[]>(resolve => setTimeout(() => {
    resolve([
      { studentGuid: 'sg-1', studentNumber: '012221999', studentName: 'JANE DOE SAMPLE', programName: 'BSc IT', batchCode: 'BATCH-2022', isGownCollected: false },
      { studentGuid: 'sg-2', studentNumber: '012222000', studentName: 'JOHN SMITH', programName: 'BSc CS', batchCode: 'BATCH-2022', isGownCollected: true },
      { studentGuid: 'sg-3', studentNumber: '012222001', studentName: 'ALICE WONDER', programName: 'BBA', batchCode: 'BATCH-2023', isGownCollected: false },
      { studentGuid: 'sg-4', studentNumber: '012222002', studentName: 'BOB MARLEY', programName: 'BSc SE', batchCode: 'BATCH-2021', isGownCollected: true }
    ])
  }, 800))
}

export function recordGownCollection(studentGuid: string) {
  // FORCE MOCK DATA FOR UI TESTING
  return new Promise<boolean>(resolve => setTimeout(() => resolve(true), 500))
}
