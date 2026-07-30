import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Per-action flags on a leaf node (e.g. { add, edit, delete, get }). Shape is
// backend-defined and not yet standardized across domains — treat as a loose
// bag of booleans, not a fixed set of keys.
export interface MenuPermissions {
  [action: string]: boolean
}

// A node with children is a rail/section (icon/url/permissions all null); a
// node with an empty children array is a leaf page. A leaf can still have
// url: null (e.g. Admission > Records > Receipts) for a nav entry that's
// visible but has no page behind it yet.
export interface MenuNode {
  name: string
  icon: string | null
  url: string | null
  permissions: MenuPermissions | null
  children: MenuNode[]
}

function leaf(name: string, icon: string, url: string | null): MenuNode {
  return {
    name,
    icon: `lni lni-${icon}`,
    url,
    permissions: url ? { add: true, edit: true, delete: true, get: true } : {},
    children: [],
  }
}

function section(name: string, children: MenuNode[]): MenuNode {
  return { name, icon: null, url: null, permissions: null, children }
}

function module_(name: string, icon: string, children: MenuNode[]): MenuNode {
  return { name, icon: `lni lni-${icon}`, url: null, permissions: null, children }
}

// Mirrors docs/MENU_ROUTES_REFERENCE.md — full access to everything, matching
// the app's pre-permission behavior, so mock mode still exercises every page.
const mockMenu: MenuNode[] = [
  module_('Admission', 'clipboard', [
    section('Enquiry', [
      leaf('Online Enquiry', 'display', '/admission/online-enquiry'),
      leaf('Self-Service Kiosk', 'tab', '/admission/kiosk-enquiry'),
      leaf('On-Desk Enquiry', 'pencil-alt', '/admission/ondesk-enquiry'),
      leaf('Enquiry List', 'folder', '/admission/enquiry-list'),
      leaf('Enquiry Followup Master', 'calendar', '/admission/enquiry-followup-master'),
      leaf('Enquiry Followup', 'phone', '/admission/enquiry-followup'),
    ]),
    section('Admission Flow', [
      leaf('Dashboard', 'dashboard', '/admission/dashboard'),
      leaf('Application Payment', 'credit-cards', '/admission/payment'),
      leaf('Application Filing', 'pencil-alt', '/admission/filing'),
      leaf('Vetting Desk', 'search-alt', '/admission/vetting'),
      leaf("Registrar's Desk", 'graduation', '/admission/registration'),
    ]),
    section('Records', [
      leaf('All Applicants', 'users', '/admission/applicants'),
      leaf('Receipts', 'files', null),
      leaf('Reports', 'bar-chart', null),
    ]),
  ]),
  module_('Academic', 'graduation', [
    section('Overview', [
      leaf('Dashboard', 'dashboard', '/academic/acad-dashboard'),
    ]),
    section('Academic Core', [
      leaf('Intake Master', 'calendar', '/academic/intake-master'),
      leaf('Skill Management', 'bulb', '/academic/skill-master'),
      leaf('Batch Management', 'users', '/academic/batch-management'),
      leaf('Room Management', 'home', '/academic/room-management'),
      leaf('Session Movement', 'reload', '/academic/session-movement'),
    ]),
    section('Course Unit Master', [
      leaf('Repetition Tag', 'reload', '/academic/repetition-tag'),
      leaf('Course Units', 'book', '/academic/course-units'),
    ]),
    section('Programme Master', [
      leaf('Programme Level', 'layers', '/academic/programme-level'),
      leaf('Programme Group', 'folder', '/academic/programme-group'),
      leaf('Programme Master', 'graduation', '/academic/programme-master'),
      leaf('Fee Structure', 'dollar', '/academic/fee-structure'),
    ]),
    section('Timetable', [
      leaf('Timetable', 'calendar', '/academic/timetable'),
    ]),
    section('ODL Applications', [
      leaf('ODL Applications', 'world', '/academic/odl-applications'),
      leaf('Payment Reconciliation', 'credit-cards', '/academic/odl-reconciliation'),
    ]),
    section('Cross-Module', [
      leaf('Student Lookup', 'user', '/academic/student-lookup'),
    ]),
  ]),
  module_('Finance', 'dollar', [
    section('Finance Core', [
      leaf('Cooperates', 'handshake', '/finance/cooperates'),
      leaf('Discounts', 'tag', '/finance/discounts'),
      leaf('Ledgers', 'book', '/finance/ledgers'),
      leaf('Currency Master', 'dollar', '/finance/currency-master'),
      leaf('Receipt Books', 'ticket', '/finance/receipt-books'),
      leaf('General Settings', 'cog', '/finance/gen-sets'),
    ]),
    section('Banking', [
      leaf('Banks', 'coin', '/finance/banks'),
      leaf('Bank Branches', 'map-marker', '/finance/bank-branches'),
      leaf('Proc Banks', 'wallet', '/finance/proc-banks'),
      leaf('Proc GL Accounts', 'calculator', '/finance/proc-gl-accounts'),
    ]),
  ]),
  module_('Student', 'user', [
    section('Student Records', [
      leaf('Student Master', 'graduation', '/student/student-master'),
    ]),
  ]),
  module_('Employee', 'briefcase', [
    section('Employee Records', [
      leaf('Employee Master', 'user', '/employee/employee-master'),
    ]),
  ]),
  module_('Config', 'cog', [
    section('Organization', [
      leaf('Faculty Master', 'library', '/config/faculty-master'),
      leaf('Department Master', 'briefcase', '/config/department-master'),
      leaf('Designation Master', 'tag', '/config/designation-master'),
      leaf('Campus Master', 'home', '/config/campus-master'),
      leaf('Country Master', 'world', '/config/country-master'),
    ]),
    section('Academic Setup', [
      leaf('Specialization', 'certificate', '/config/specialization'),
      leaf('Skill Master', 'bulb', '/config/skill'),
      leaf('Unit Type Master', 'tag', '/config/unit-type'),
      leaf('Unit Category Master', 'tag', '/config/unit-category'),
      leaf('Weekdays', 'calendar', '/config/weekdays'),
      leaf('Batch Times', 'timer', '/config/batch-times'),
    ]),
    section('Admissions', [
      leaf('Enquiry Status', 'flag', '/config/enquiry-status'),
      leaf('Isbat Enquiry Source', 'compass', '/config/enquiry-source'),
      leaf('Enquiry Source', 'volume', '/config/enquiry-source-master'),
      leaf('Followup Status', 'phone', '/config/followup-status'),
      leaf('Followup Mode', 'comments', '/config/followup-mode'),
      leaf('Interest Level', 'signal', '/config/interest-level'),
    ]),
    section('Access Control', [
      leaf('Permission Master', 'lock', '/config/permission-master'),
    ]),
  ]),
]

// TEMPORARY: the real /me/menu response has no Employee module yet (backend
// permission model isn't wired up for it) — Employee Master would otherwise
// vanish from the sidebar entirely. Force it in until the backend starts
// returning a real "Employee" node; this stops applying the moment it does,
// since the merge is skipped once one is present.
const HARDCODED_EMPLOYEE_MODULE: MenuNode = module_('Employee', 'briefcase', [
  section('Employee Records', [
    leaf('Employee Master', 'user', 'employee-master'),
  ]),
])

export interface MenuResult {
  menu: MenuNode[]
  // true when the real /me/menu call failed and `menu` is placeholder,
  // full-navigation data instead — never treat this as verified permission
  // data. TEMPORARY: covers a live backend issue where /me/menu 401s even
  // with a valid session, so the sidebar doesn't go fully blank while
  // that's investigated separately. Remove once the backend call is
  // reliable — real permission gating must go back to failing closed.
  isFallback: boolean
}

// TEMPORARY: real /me/menu is currently broken server-side (erp_access
// cookie gets rejected as malformed/oversized after a permission-group
// change — see chat/backend ticket), which was blocking unrelated work.
// Skips the real call entirely and always serves the full mock menu until
// the backend fix lands. Flip back to false to re-enable the real call.
const MENU_API_DISABLED = true

export function getMenu(): Promise<MenuResult> {
  if (MOCK_AUTH || MENU_API_DISABLED) return Promise.resolve({ menu: mockMenu, isFallback: false })
  return apiGet<MenuNode[] | null>('/api/v1/users/me/menu')
    .then(data => {
      const menu = data ?? []
      const withEmployee = menu.some(n => n.name === 'Employee') ? menu : [...menu, HARDCODED_EMPLOYEE_MODULE]
      return { menu: withEmployee, isFallback: false }
    })
    .catch(() => ({ menu: mockMenu, isFallback: true }))
}
