import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs the standalone NCHE Payment page (src/app/finance/nche-payment).
// Confirmed via nche/*.md (2026-08-31) — NCHE has its own dedicated CRUD +
// status surface under erp-finance-compliance-service's own nche/ route,
// separate from the Payment Console's outstanding-all/search/profile
// endpoints (still reused here for the search+outstanding-balance half of
// this page). No currency, no receipt book, no bank, no receipt claimed on
// create/update; the amount must be an exact multiple of a fixed
// per-semester NCHE rate configured server-side and must not exceed rate ×
// semesterCount minus what's already paid — both enforced server-side, not
// pre-validated here since the rate isn't exposed to the client ahead of
// time.
//
// Every doc's own path header omits the /api/v1 gateway prefix every other
// endpoint in this app goes through (e.g. POST /finance/nche/payment-nche)
// — followed here as a likely doc omission, matching this app's own
// convention, rather than assumed literal.
export interface NchePaymentInput {
  applicationGuid: string
  studentGuid: string | null
  amount: number
  payDate: string
  pnrNumber: string | null
  remarks: string | null
}

export interface NchePaymentResult {
  paymentNcheGuid: string
  amount: number
  // What's still owed on NCHE after this payment (rate × semesterCount,
  // minus what's now paid) — there is no receipt field, none is issued.
  remainingBalance: number
}

// PUT's own request body — same fields as create minus applicationGuid/
// studentGuid, which the record already carries and can't be reassigned.
export type NchePaymentUpdateInput = Pick<NchePaymentInput, 'amount' | 'payDate' | 'pnrNumber' | 'remarks'>

export interface NchePaymentHistoryEntry {
  paymentNcheGuid: string
  applicationGuid: string
  studentGuid: string | null
  intakeGuid: string | null
  payDate: string
  pnrNumber: string | null
  amount: number
  remarks: string | null
}

// status is a free-text string per the doc's own sample ("Pending/Paid/
// Overdue") — not a documented enum, shown as-is rather than mapped to a
// badge color scheme not confirmed against real values.
export interface NcheSemesterStatus {
  semesterGuid: string
  semCode: number
  semName: string
  status: string
}

let mockPaymentSeq = 1
const mockNcheHistory: Record<string, NchePaymentHistoryEntry[]> = {}

export function createNchePayment(input: NchePaymentInput): Promise<NchePaymentResult> {
  if (MOCK_AUTH) {
    const paymentNcheGuid = `mock-nche-${mockPaymentSeq++}`
    const entry: NchePaymentHistoryEntry = {
      paymentNcheGuid, applicationGuid: input.applicationGuid, studentGuid: input.studentGuid, intakeGuid: null,
      payDate: input.payDate, pnrNumber: input.pnrNumber, amount: input.amount, remarks: input.remarks,
    }
    const key = input.studentGuid ?? input.applicationGuid
    mockNcheHistory[key] = [...(mockNcheHistory[key] ?? []), entry]
    return Promise.resolve({ paymentNcheGuid, amount: input.amount, remainingBalance: 0 })
  }
  return apiPost<NchePaymentResult>('/api/v1/finance/nche/payment-nche', input)
}

export function updateNchePayment(paymentNcheGuid: string, input: NchePaymentUpdateInput): Promise<NchePaymentResult> {
  if (MOCK_AUTH) return Promise.resolve({ paymentNcheGuid, amount: input.amount, remainingBalance: 0 })
  return apiPut<NchePaymentResult>(`/api/v1/finance/nche/payment-nche/${paymentNcheGuid}`, input)
}

export function deleteNchePayment(paymentNcheGuid: string): Promise<{ success: boolean }> {
  if (MOCK_AUTH) return Promise.resolve({ success: true })
  return apiDelete<{ success: boolean }>(`/api/v1/finance/nche/payment-nche/${paymentNcheGuid}`)
}

export function getNchePaymentHistory(studentGuid: string): Promise<NchePaymentHistoryEntry[]> {
  if (MOCK_AUTH) return Promise.resolve(mockNcheHistory[studentGuid] ?? [])
  return apiGet<NchePaymentHistoryEntry[] | null>(`/api/v1/finance/nche/payment-history/${studentGuid}`).then(data => data ?? [])
}

// A 404 here is documented as "Application not found" — but confirmed live
// (2026-08-31) on an application known to exist (its own outstanding-all/
// profile calls succeed), meaning this route isn't actually live on this
// backend yet. Swallowed unconditionally (not matched against a specific
// AuthError code) rather than surfaced as an error: this doc's error table
// is the least detailed of any endpoint wired so far ("Bearer cookie via
// gateway; requires permission (TBD)"), from what looks like a different
// codegen than the rest of this app's finance-service endpoints — its
// actual error code string (e.g. "NotFound" vs. this app's usual
// "not_found") isn't safe to assume. There's nothing actionable for the
// cashier to do about a missing status badge either way, and a hard error
// here shouldn't block the rest of the page (outstanding balance, payment
// form, history) from working.
export function getNcheSemesterStatus(applicationGuid: string, studentGuid?: string | null): Promise<NcheSemesterStatus | null> {
  if (MOCK_AUTH) return Promise.resolve({ semesterGuid: 'sem-mock-1', semCode: 1, semName: 'Semester 1', status: 'Pending' })
  const qs = studentGuid ? `?studentGuid=${encodeURIComponent(studentGuid)}` : ''
  return apiGet<NcheSemesterStatus>(`/api/v1/finance/nche/semester-status/${applicationGuid}${qs}`).catch(() => null)
}
