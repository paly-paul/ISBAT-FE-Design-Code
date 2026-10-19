import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// GET /api/v1/admissions/application-payments/paid-students
// (application-payment/get-paid-students.md). Students who made an
// application payment for an intake, with their payment and where the
// application stands. Values come back as stored, so strings can carry
// stray spaces and most fields can be null on older records.

export type PaymentKindFilter = 'Paid' | 'Exempted' | 'All'

export interface PaidStudent {
  paymentGuid: string
  appRefNo: string | null
  studentName: string | null
  email: string | null
  mobile: number | null
  programGuid: string | null
  programName: string | null
  campusGuid: string | null
  campusName: string | null
  // In currencyName, not shillings; amountUsh is the converted figure.
  amount: number | null
  currencyGuid: string | null
  currencyName: string | null
  amountUsh: number | null
  payDate: string | null
  receiptNo: number | null
  paymentKind: 'Paid' | 'Exempted'
  isExempted: boolean
  exemptionTypeGuid: string | null
  exemptionTypeName: string | null
  // A number (1–7); stageName is the display label.
  stage: number
  stageName: string
  // Only while stage is 2 (in progress): the highest step saved.
  formStep: string | null
}

export interface PaidStudentsFilters {
  intakeGuid?: string
  paymentKind?: PaymentKindFilter
  stage?: number
  searchTerm?: string
  page: number
  pageSize: number
}

export interface PaidStudentsPage {
  items: PaidStudent[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export function getPaidStudents(f: PaidStudentsFilters): Promise<PaidStudentsPage> {
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: f.page, pageSize: f.pageSize })
  const qs = new URLSearchParams({ page: String(f.page), pageSize: String(f.pageSize) })
  if (f.intakeGuid) qs.set('intakeGuid', f.intakeGuid)
  if (f.paymentKind) qs.set('paymentKind', f.paymentKind)
  if (f.stage) qs.set('stage', String(f.stage))
  if (f.searchTerm?.trim()) qs.set('searchTerm', f.searchTerm.trim())
  return apiGet<PaidStudentsPage | null>(`/api/v1/admissions/application-payments/paid-students?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: f.page, pageSize: f.pageSize })
}

// A receipt exists only for a real payment with a receipt number, amount and
// currency (get-paid-students.md "Printing the receipt"); otherwise the
// receipt call returns 400.
export function canPrintPaidReceipt(r: PaidStudent): boolean {
  return !r.isExempted && r.receiptNo != null && r.receiptNo !== 0 && r.amount != null && r.currencyGuid != null
}
