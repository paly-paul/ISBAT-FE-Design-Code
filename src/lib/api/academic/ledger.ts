// Mock-only for now — the academic master endpoints aren't implemented on
// the real backend yet. Swap these for apiGet/apiPost calls (see
// src/lib/api/client.ts) once the API is available.

export interface Ledger {
  id: string
  ledgerCode: string
  ledgerName: string
}

export type LedgerInput = Omit<Ledger, 'id'>

const mockLedgers: Ledger[] = [
  { id: '1', ledgerCode: 'TUI', ledgerName: 'Tuition Fees' },
  { id: '2', ledgerCode: 'REG', ledgerName: 'Registration Fees' },
  { id: '3', ledgerCode: 'EXA', ledgerName: 'Examination Fees' },
  { id: '4', ledgerCode: 'ACC', ledgerName: 'Accommodation Fees' },
  { id: '5', ledgerCode: 'LIB', ledgerName: 'Library Fees' },
  { id: '6', ledgerCode: 'MED', ledgerName: 'Medical Fees' },
]

export function getLedgers(): Promise<Ledger[]> {
  return Promise.resolve(mockLedgers)
}

export function createLedger(input: LedgerInput): Promise<Ledger> {
  const ledger: Ledger = { id: String(mockLedgers.length + 1), ...input }
  mockLedgers.push(ledger)
  return Promise.resolve(ledger)
}

export function updateLedger(id: string, input: LedgerInput): Promise<Ledger> {
  const existing = mockLedgers.find(l => l.id === id)
  if (!existing) return Promise.reject(new Error('Ledger not found'))
  Object.assign(existing, input)
  return Promise.resolve(existing)
}
