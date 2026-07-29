import { apiPost } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Shared header-field shape — used both standalone (the old header-only
// endpoint, since removed) and as the base for the combined save-complete
// payload below. Confirmed shape via Academic/Fee-Structure/CreateHeader.bru.
export interface ProgramFeeStructureHeaderInput {
  feeCode: string
  feeDesc: string
  status: boolean
  localOrForeign: boolean
  programGuid: string
  lef: number | null
  cef: number | null
  ace: number | null
  lec: number | null
  cec: number | null
  acec: number | null
  calcType: number
  amtPer: number | null
  intakeGuid: string | null
}

// Confirmed via a real POST response (from the old header-only endpoint):
// guid key is feeHdGuid (not feeStructureHdGuid), and it echoes the input
// fields back plus a programFees array. Reused as the save-complete response
// shape too — not independently confirmed for that endpoint, but the same
// resource, so a reasonable best-effort assumption until seen live.
export interface ProgramFeeStructureHeader extends ProgramFeeStructureHeaderInput {
  feeHdGuid: string
  programFees: unknown[]
}

// One fee line inside a save-complete payload — semesterGuid is a real guid
// here, unlike Program Master's own embedded fee structure (semCode, a
// 1-based int position) — see the note on FeeLineUpdateInput in
// programMaster.ts for that other convention.
export interface ProgramFeeLineSaveInput {
  semesterGuid: string
  ledgerGuid: string
  currencyGuid: string
  ledgerNum: number
  amount: number
}

// Confirmed via the user-provided save-complete payload — combines the
// header fields above with feeLines in one request, replacing the old
// header-only endpoint + a separate (never-built) line-item endpoint.
export interface ProgramFeeStructureSaveCompleteInput extends ProgramFeeStructureHeaderInput {
  feeLines: ProgramFeeLineSaveInput[]
}

let mockHeaderSeq = 1

export function saveProgramFeeStructureComplete(input: ProgramFeeStructureSaveCompleteInput): Promise<ProgramFeeStructureHeader> {
  if (MOCK_AUTH) {
    return Promise.resolve({ ...input, feeHdGuid: String(mockHeaderSeq++), programFees: input.feeLines })
  }
  return apiPost<ProgramFeeStructureHeader>('/api/v1/academic/Programfee-structure/hd/save-complete', input)
}
