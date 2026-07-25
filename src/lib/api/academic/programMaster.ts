import { apiGet, apiPostForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// One course unit assigned to a semester.
export interface ProgramUnitInput {
  semCode: number
  courseUnitGuid: string
  streamGuid: string
  unitType: string
  unitCat: string
  flag: number
}

// One fee row inside a fee structure.
export interface FeeLineInput {
  intLedger: number
  ledgerGuid: string
  intCurrency: number
  semCode: number
  ledgerNum: number
  amount: number
}

// One fee structure sent with the programme payload.
export interface FeeStructureInput {
  feeCode: string
  feeDesc: string
  status: boolean
  localOrForeign: boolean
  lef: number | null
  cef: number | null
  ace: number | null
  lec: number | null
  cec: number | null
  acec: number | null
  calcType: number
  amtPer: number | null
  intakeCode: number | null
  feeLines: FeeLineInput[]
}

// This is the confirmed create payload for the programme form.
export interface ProgramMasterInput {
  programCode: string
  programName: string
  programLevelGuid: string
  pgmStatus: boolean
  noIa: boolean
  programGroupGuid: string
  unitCount: number
  appFee: number
  lateFee: number
  facultyGuid: string
  // Despite the field name, this takes Currency.intCurrency (a number), not
  // the currency code string — every other currency field on this payload
  // (Lec/Cec/Acec/FeeLines[].IntCurrency) already used intCurrency, and
  // "Currency not found" persisted until this one was switched too.
  currencyCode: number
  dateAcc: string
  streamGuid: string
  intakeGuid: string
  programUnits: ProgramUnitInput[]
  feeStructures: FeeStructureInput[]
  accLetterFile?: File | null
}

// Confirmed shape via GET /api/v1/academic/program-master?search= — differs
// from ProgramMasterInput in a few notable ways: streamGuids comes back as an
// array (create only accepts one streamGuid), currency is currencyGuid here
// (nullable — was null in every sample so far, despite create using an
// intCurrency-based currencyCode), and yearCount/semCount are echoed back
// directly rather than needing a programLevel lookup. accLetter/semesters
// shapes aren't confirmed beyond "null" and "[]" respectively.
export interface ProgramMaster {
  programGuid: string
  programCode: string
  programName: string
  pgmStatus: boolean
  noIa: boolean
  programGroupGuid: string
  unitCount: number
  programLevelGuid: string
  yearCount: number
  semCount: number
  facultyGuid: string
  dateAcc: string
  accLetter: string | null
  appFee: number
  lateFee: number
  currencyGuid: string | null
  intakeGuid: string
  streamGuids: string[]
  semesters: unknown[]
}

// Same indexed flat-key convention as appendOutlines in courseUnit.ts.
function appendProgramUnits(formData: FormData, units: ProgramUnitInput[]) {
  units.forEach((u, i) => {
    formData.append(`ProgramUnits[${i}].SemCode`, String(u.semCode))
    formData.append(`ProgramUnits[${i}].CourseUnitGuid`, u.courseUnitGuid)
    formData.append(`ProgramUnits[${i}].StreamGuid`, u.streamGuid)
    formData.append(`ProgramUnits[${i}].UnitType`, u.unitType)
    formData.append(`ProgramUnits[${i}].UnitCat`, u.unitCat)
    formData.append(`ProgramUnits[${i}].Flag`, String(u.flag))
  })
}

function appendFeeStructures(formData: FormData, structures: FeeStructureInput[]) {
  structures.forEach((s, i) => {
    formData.append(`FeeStructures[${i}].FeeCode`, s.feeCode)
    formData.append(`FeeStructures[${i}].FeeDesc`, s.feeDesc)
    formData.append(`FeeStructures[${i}].Status`, String(s.status))
    formData.append(`FeeStructures[${i}].LocalOrForeign`, String(s.localOrForeign))
    if (s.lef !== null) formData.append(`FeeStructures[${i}].Lef`, String(s.lef))
    if (s.cef !== null) formData.append(`FeeStructures[${i}].Cef`, String(s.cef))
    if (s.ace !== null) formData.append(`FeeStructures[${i}].Ace`, String(s.ace))
    if (s.lec !== null) formData.append(`FeeStructures[${i}].Lec`, String(s.lec))
    if (s.cec !== null) formData.append(`FeeStructures[${i}].Cec`, String(s.cec))
    if (s.acec !== null) formData.append(`FeeStructures[${i}].Acec`, String(s.acec))
    formData.append(`FeeStructures[${i}].CalcType`, String(s.calcType))
    if (s.amtPer !== null) formData.append(`FeeStructures[${i}].AmtPer`, String(s.amtPer))
    if (s.intakeCode !== null) formData.append(`FeeStructures[${i}].IntakeCode`, String(s.intakeCode))
    s.feeLines.forEach((l, j) => {
      formData.append(`FeeStructures[${i}].FeeLines[${j}].IntLedger`, String(l.intLedger))
      formData.append(`FeeStructures[${i}].FeeLines[${j}].LedgerGuid`, l.ledgerGuid)
      formData.append(`FeeStructures[${i}].FeeLines[${j}].IntCurrency`, String(l.intCurrency))
      formData.append(`FeeStructures[${i}].FeeLines[${j}].SemCode`, String(l.semCode))
      formData.append(`FeeStructures[${i}].FeeLines[${j}].LedgerNum`, String(l.ledgerNum))
      formData.append(`FeeStructures[${i}].FeeLines[${j}].Amount`, String(l.amount))
    })
  })
}

let mockProgramSeq = 1

// In-memory list used while mock auth is enabled, so the now-real list query
// (getProgramMasters) has something to show after a mock create.
const mockProgramMasters: ProgramMaster[] = []

export function createProgramMaster(input: ProgramMasterInput): Promise<ProgramMaster> {
  if (MOCK_AUTH) {
    const program: ProgramMaster = {
      programGuid: String(mockProgramSeq++),
      programCode: input.programCode,
      programName: input.programName,
      pgmStatus: input.pgmStatus,
      noIa: input.noIa,
      programGroupGuid: input.programGroupGuid,
      unitCount: input.unitCount,
      programLevelGuid: input.programLevelGuid,
      yearCount: 0,
      semCount: 0,
      facultyGuid: input.facultyGuid,
      dateAcc: input.dateAcc,
      accLetter: null,
      appFee: input.appFee,
      lateFee: input.lateFee,
      currencyGuid: null,
      intakeGuid: input.intakeGuid,
      streamGuids: [input.streamGuid],
      semesters: [],
    }
    mockProgramMasters.push(program)
    return Promise.resolve(program)
  }

  const formData = new FormData()
  formData.append('programCode', input.programCode)
  formData.append('programName', input.programName)
  formData.append('programLevelGuid', input.programLevelGuid)
  formData.append('pgmStatus', String(input.pgmStatus))
  formData.append('noIa', String(input.noIa))
  formData.append('programGroupGuid', input.programGroupGuid)
  formData.append('unitCount', String(input.unitCount))
  formData.append('appFee', String(input.appFee))
  formData.append('lateFee', String(input.lateFee))
  formData.append('facultyGuid', input.facultyGuid)
  formData.append('currencyCode', String(input.currencyCode))
  formData.append('dateAcc', input.dateAcc)
  formData.append('streamGuid', input.streamGuid)
  formData.append('intakeGuid', input.intakeGuid)
  appendProgramUnits(formData, input.programUnits)
  appendFeeStructures(formData, input.feeStructures)
  if (input.accLetterFile) formData.append('accLetterFile', input.accLetterFile)
  return apiPostForm<ProgramMaster>('/api/v1/academic/program-master/save-complete', formData)
}

// List query for the programme-master table.
export function getProgramMasters(search = ''): Promise<ProgramMaster[]> {
  if (MOCK_AUTH) return Promise.resolve(mockProgramMasters)
  return apiGet<ProgramMaster[] | null>(`/api/v1/academic/program-master?search=${encodeURIComponent(search)}`)
    .then(data => data ?? [])
}
