import type { MenuPermissions } from '@/lib/api/users/menu'

export const HALL_TICKET_TERM_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
]

export interface PrintOneHandoff {
  term?: string
  semCode?: string
  program?: string
  q?: string
  nonce: number
}

export function formatIntakeLabel(
  intake?: { description?: string | null; intakeCode?: string | number | null } | null,
): string {
  if (!intake) return ''
  return intake.description ? `${intake.description} (${intake.intakeCode})` : String(intake.intakeCode ?? '')
}

function matchRawKeys(raw: MenuPermissions, patterns: RegExp[]) {
  const matched = Object.entries(raw).filter(([k]) => patterns.some(re => re.test(k)))
  return {
    hasKeys: matched.length > 0,
    granted: matched.some(([, v]) => v === true),
  }
}

const ISSUE_ACTION_PATTERNS = [/^issue$/i, /[._-]issue$/i, /issuehallticket/i]
const PRINT_ONE_VIEW_PATTERNS = [
  /^(hallticketprint|printone|singleprint)[._-](get|view)$/i,
  /^(get|view)[._-]?hallticketprint$/i,
]
const PRINT_ALL_VIEW_PATTERNS = [
  /^(hallticketprintall|printall)[._-](get|view)$/i,
  /^(get|view)[._-]?hallticketprintall$/i,
]
const PRINT_ONE_ACTION_PATTERNS = [/^print$/i, /preview.*print/i, /^hallticketprint[._-]print$/i, /^printone/i]
const PRINT_ALL_ACTION_PATTERNS = [/^print[._-]?all$/i, /^bulk[._-]?print$/i, /^hallticketprintall[._-]print$/i]

export interface HallTicketPermissions {
  canViewIssue: boolean
  canViewPrintOne: boolean
  canViewPrintAll: boolean
  canIssue: boolean
  canPrintOne: boolean
  canPrintAll: boolean
}

// Resolves fine-grained capabilities for the unified Hall Ticket page.
// Works both with today's 3-node /me/menu (merged into hallticketprint.* and
// hallticketprintall.* in menu.ts) and if a future backend merges everything
// onto a single node.
// Importantly, inspects raw permissions so normalizePermissions' `canPrint = canGet`
// fallback never exposes Print buttons to a View-only user.
export function resolveHallTicketPermissions(
  permissions: MenuPermissions,
  rawPermissions: MenuPermissions | null,
): HallTicketPermissions {
  const raw = rawPermissions ?? {}
  const issueKeys = matchRawKeys(raw, ISSUE_ACTION_PATTERNS)
  const printOneViewKeys = matchRawKeys(raw, PRINT_ONE_VIEW_PATTERNS)
  const printAllViewKeys = matchRawKeys(raw, PRINT_ALL_VIEW_PATTERNS)
  const printOneActionKeys = matchRawKeys(raw, PRINT_ONE_ACTION_PATTERNS)
  const printAllActionKeys = matchRawKeys(raw, PRINT_ALL_ACTION_PATTERNS)

  const hasBaseView = permissions.get !== false && Boolean(permissions.get || permissions.view)
  const canIssue = Boolean(permissions.add || permissions.edit || issueKeys.granted)

  const canPrintOne = printOneActionKeys.hasKeys ? printOneActionKeys.granted : canIssue
  const canPrintAll = printAllActionKeys.hasKeys
    ? printAllActionKeys.granted
    : printOneActionKeys.hasKeys
      ? printOneActionKeys.granted
      : canIssue

  const canViewPrintOne = printOneViewKeys.hasKeys
    ? printOneViewKeys.granted || (printOneActionKeys.hasKeys && printOneActionKeys.granted)
    : hasBaseView || canPrintOne
  const canViewPrintAll = printAllViewKeys.hasKeys
    ? printAllViewKeys.granted || (printAllActionKeys.hasKeys && printAllActionKeys.granted)
    : hasBaseView || canPrintAll
  const canViewIssue = hasBaseView || canIssue

  return {
    canViewIssue,
    canViewPrintOne,
    canViewPrintAll,
    canIssue,
    canPrintOne,
    canPrintAll,
  }
}
