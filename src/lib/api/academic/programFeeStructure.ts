import { apiPost } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// POST /api/v1/academic/Programfee-structure/hd — saves just the fee
// structure header. Confirmed shape via Academic/Fee-Structure/CreateHeader.bru.
// Doesn't carry fee lines — those belong to a separate, still-unconfirmed
// detail endpoint.
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

// Confirmed via a real POST response: guid key is feeHdGuid (not
// feeStructureHdGuid), and it echoes the input fields back plus an empty
// programFees array — presumably where the /fee line-item endpoint's rows
// show up once at least one has been saved. No numeric id anywhere on this
// response — see the note on ProgramFeeInput.intFee/intProgram below.
export interface ProgramFeeStructureHeader extends ProgramFeeStructureHeaderInput {
  feeHdGuid: string
  programFees: unknown[]
}

let mockHeaderSeq = 1

export function createProgramFeeStructureHeader(input: ProgramFeeStructureHeaderInput): Promise<ProgramFeeStructureHeader> {
  if (MOCK_AUTH) {
    return Promise.resolve({ ...input, feeHdGuid: String(mockHeaderSeq++), programFees: [] })
  }
  return apiPost<ProgramFeeStructureHeader>('/api/v1/academic/Programfee-structure/hd', input)
}
