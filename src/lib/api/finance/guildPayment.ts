import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs the standalone Guild Payment page (src/app/finance/guild-payment)
// and the Guild Payment Console list page (src/app/finance/guild-console).
// Confirmed via guild/*.md (2026-08-31) — same CRUD + status + list surface
// as NCHE's sibling (see nchePayment.ts's own comment for the shared
// reasoning). Only payload difference from NCHE on create/update:
// bankDeposit instead of pnrNumber, no remarks field.
export interface GuildPaymentInput {
  applicationGuid: string
  studentGuid: string | null
  amount: number
  payDate: string
  bankDeposit: string | null
}

export interface GuildPaymentResult {
  paymentGuildGuid: string
  amount: number
  remainingBalance: number
}

export type GuildPaymentUpdateInput = Pick<GuildPaymentInput, 'amount' | 'payDate' | 'bankDeposit'>

// Payment-history and payment-guilds-list rows carry more resolved fields
// (studentName/intakeCode/receipt) than the create/update result does —
// separate shape rather than reusing GuildPaymentResult.
export interface GuildPaymentRecord {
  paymentGuildGuid: string
  applicationGuid: string
  studentGuid: string | null
  studentName: string | null
  intakeGuid: string | null
  intakeCode: number | null
  payDate: string
  bankDeposit: string | null
  receipt: string | null
  amount: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

// status is a free-text string per the doc's own sample ("Pending/Paid/
// Overdue") — not a documented enum, shown as-is rather than mapped to a
// badge color scheme not confirmed against real values.
export interface GuildSemesterStatus {
  semesterGuid: string
  semCode: number
  semName: string
  status: string
}

let mockPaymentSeq = 1
const mockGuildHistory: Record<string, GuildPaymentRecord[]> = {}

export function createGuildPayment(input: GuildPaymentInput): Promise<GuildPaymentResult> {
  if (MOCK_AUTH) {
    const paymentGuildGuid = `mock-guild-${mockPaymentSeq++}`
    const entry: GuildPaymentRecord = {
      paymentGuildGuid, applicationGuid: input.applicationGuid, studentGuid: input.studentGuid, studentName: null,
      intakeGuid: null, intakeCode: null, payDate: input.payDate, bankDeposit: input.bankDeposit, receipt: null, amount: input.amount,
    }
    const key = input.studentGuid ?? input.applicationGuid
    mockGuildHistory[key] = [...(mockGuildHistory[key] ?? []), entry]
    return Promise.resolve({ paymentGuildGuid, amount: input.amount, remainingBalance: 0 })
  }
  return apiPost<GuildPaymentResult>('/api/v1/finance/guild/payment-guild', input)
}

export function updateGuildPayment(paymentGuildGuid: string, input: GuildPaymentUpdateInput): Promise<GuildPaymentResult> {
  if (MOCK_AUTH) return Promise.resolve({ paymentGuildGuid, amount: input.amount, remainingBalance: 0 })
  return apiPut<GuildPaymentResult>(`/api/v1/finance/guild/payment-guild/${paymentGuildGuid}`, input)
}

export function deleteGuildPayment(paymentGuildGuid: string): Promise<{ success: boolean }> {
  if (MOCK_AUTH) return Promise.resolve({ success: true })
  return apiDelete<{ success: boolean }>(`/api/v1/finance/guild/payment-guild/${paymentGuildGuid}`)
}

export function getGuildPaymentHistory(studentGuid: string): Promise<GuildPaymentRecord[]> {
  if (MOCK_AUTH) return Promise.resolve(mockGuildHistory[studentGuid] ?? [])
  return apiGet<GuildPaymentRecord[] | null>(`/api/v1/finance/guild/payment-history/${studentGuid}`).then(data => data ?? [])
}

// A 404 here is documented as "Application not found" — but confirmed live
// (2026-08-31) on an application known to exist (its own outstanding-all/
// profile calls succeed), meaning this route isn't actually live on this
// backend yet. Swallowed unconditionally rather than surfaced as an error —
// see getNcheSemesterStatus's own comment (its Guild sibling) for the full
// reasoning: there's nothing actionable for the cashier to do about a
// missing status badge, and a hard error here shouldn't block the rest of
// the page from working.
export function getGuildSemesterStatus(applicationGuid: string, studentGuid?: string | null): Promise<GuildSemesterStatus | null> {
  if (MOCK_AUTH) return Promise.resolve({ semesterGuid: 'sem-mock-1', semCode: 1, semName: 'Semester 1', status: 'Pending' })
  const qs = studentGuid ? `?studentGuid=${encodeURIComponent(studentGuid)}` : ''
  return apiGet<GuildSemesterStatus>(`/api/v1/finance/guild/semester-status/${applicationGuid}${qs}`).catch(() => null)
}

// Admin/reporting list of every Guild payment across the system — a
// separate console page (get-payment-guilds.md's own "Used by pages" names
// /finance/guild/console, distinct from the payment-entry page), not scoped
// to one student the way payment-history is.
export function getGuildPaymentsList(page = 1, pageSize = 10): Promise<PagedResult<GuildPaymentRecord>> {
  if (MOCK_AUTH) {
    const items = Object.values(mockGuildHistory).flat()
    return Promise.resolve({ items, totalCount: items.length, page, pageSize })
  }
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return apiGet<PagedResult<GuildPaymentRecord> | null>(`/api/v1/finance/guild/payment-guilds?${params.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, page, pageSize })
}
