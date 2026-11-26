import { apiGet } from '../client'
import { applyMenuRouteMoves, canonicalPath } from '@/lib/menuRoutes'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Role-based menu/permissions has its own toggle, separate from
// NEXT_PUBLIC_AUTH_MOCK — that flag also controls login and every other API
// module, so flipping it to test the real permission-driven sidebar means
// mocking (or un-mocking) everything else too. NEXT_PUBLIC_RBAC_MOCK lets the
// menu source be flipped on its own; when unset it just follows AUTH_MOCK, so
// existing .env files keep working with no change.
// Trimmed so a stray space after the value in .env.local doesn't turn it off.
const RBAC_MOCK_ENV = process.env.NEXT_PUBLIC_RBAC_MOCK?.trim()
const MOCK_MENU = RBAC_MOCK_ENV ? RBAC_MOCK_ENV === 'true' : MOCK_AUTH

// Per-action flags on a leaf node (e.g. { add, edit, delete, get }). Shape is
// backend-defined and not yet standardized across domains — treat as a loose
// bag of booleans, not a fixed set of keys.
export interface MenuPermissions {
  [action: string]: boolean
}

// A node with children is a rail/section (icon/url/permissions all null); a
// node with an empty children array is a leaf page. A leaf can still have
// url: null for a nav entry that's visible but has no page behind it yet.
export interface MenuNode {
  name: string
  icon: string | null
  url: string | null
  permissions: MenuPermissions | null
  children: MenuNode[]
}

// Mock mode is full access: every action key any page checks (CRUD plus the
// workflow actions — print, export, approve, cancel…), so nothing is hidden
// or refused while testing against the mock menu.
const MOCK_FULL_ACCESS: MenuPermissions = {
  get: true, view: true, add: true, create: true, edit: true, update: true, delete: true,
  print: true, export: true, import: true, download: true, send: true,
  approve: true, reject: true, hold: true, verify: true, assign: true, submit: true,
  register: true, execute: true, cancel: true,
  generate: true, publish: true, withdraw: true, moderate: true, push: true, save: true, preview: true, record: true, search: true,
  learningMode: true, refugee: true, sponsor: true,
}

function leaf(name: string, icon: string, url: string | null): MenuNode {
  return {
    name,
    icon: `lni lni-${icon}`,
    url,
    permissions: url ? { ...MOCK_FULL_ACCESS } : {},
    children: [],
  }
}

function section(name: string, children: MenuNode[]): MenuNode {
  return { name, icon: null, url: null, permissions: null, children }
}

function module_(name: string, icon: string, children: MenuNode[]): MenuNode {
  return { name, icon: `lni lni-${icon}`, url: null, permissions: null, children }
}

// Mirrors ERP_Menu_Hierarchy_Verified_v7.md and the shape /me/menu returns
// for it (2026-11-20): module order, section names and page order are the
// menu API's, including its "General" section around each module's
// dashboard. Analytics and Configuration are centralized modules — their
// pages keep their own routes (/finance/reports/*, /config/*,
// /academic/skill-master…). Full access to everything, so mock mode still
// exercises every page. It is also the page catalog RouteGuard checks
// against (see menuCatalog below).
//
// v7 pages the menu API doesn't send yet (2026-11-20): Academic › ODL
// Applications (both pages), Admission › Other (both pages), Admission ›
// Records › Paid Students and Assessment › UE Practical QBank. Real mode
// shows them once /me/menu does.
const mockMenu: MenuNode[] = [
  module_('Student', 'user', [
    section('Student Records', [
      leaf('Student Master', 'graduation', '/student/student-master'),
      leaf('Student Profile', 'user', '/student/profile'),
    ]),
    section('Transfers', [
      leaf('Batch Transfer', 'shuffle', '/student/batch-transfer'),
      leaf('Programme Transfer', 'graduation', '/student/prog-transfer'),
      leaf('Dropout Rejoin', 'calendar', '/student/intake-transfer'),
      leaf('Fee Structure Transfer', 'dollar', '/student/fee-structure-transfer'),
    ]),
    section('Approvals', [
      leaf('Learning Mode Approval', 'checkmark-circle', '/student/learning-mode-approval'),
      leaf('Refugee Status Approval', 'checkmark-circle', '/student/refugee-approval'),
      leaf('Passout Confirmation', 'graduation', '/student/passout-confirmation'),
    ]),
    section('Operations', [
      leaf('Learning Mode', 'display', '/student/learning-mode'),
      leaf('Terminate Student', 'shield', '/student/terminate-student'),
    ]),
    section('Student Services', [
      leaf('Service Tickets', 'ticket', '/student/service-tickets'),
    ]),
    section('Communications', [
      leaf('Send Communication', 'envelope', '/student/communications'),
    ]),
  ]),
  module_('Finance', 'dollar', [
    section('General', [
      leaf('Dashboard', 'dashboard', '/finance/dashboard'),
      leaf('Student Statement', 'files', '/finance/student-statements'),
    ]),
    section('Payment Collection', [
      leaf('Payment Console', 'credit-cards', '/finance/payment-console'),
      leaf('Payment Refund', 'reload', '/finance/payment-refund'),
      leaf('NCHE & Guild Payment', 'graduation', '/finance/nche-guild-payment'),
      leaf('Discount Allocation', 'tag', '/finance/discount-allocation'),
      leaf('Refugee Status', 'shield', '/finance/refugee-status'),
      leaf('Ledger Adjustments', 'lock', '/finance/ledger-adjustments'),
      leaf('Advanced Payments', 'wallet', '/finance/advanced-payments'),
    ]),
  ]),
  module_('Academic', 'graduation', [
    section('General', [
      leaf('Dashboard', 'dashboard', '/academic/acad-dashboard'),
    ]),
    section('Academic Core', [
      leaf('Intake Master', 'calendar', '/academic/intake-master'),
      leaf('Bulk Intake Edit', 'layers', '/academic/bulk-intake-edit'),
      leaf('Batch Management', 'users', '/academic/batch-management'),
      leaf('Session Movement', 'reload', '/academic/session-movement'),
    ]),
    section('Course Unit Master', [
      leaf('Repetition Tag', 'reload', '/academic/repetition-tag'),
      leaf('Course Units', 'book', '/academic/course-units'),
      leaf('Course Allocation', 'agenda', '/academic/course-allocation'),
    ]),
    section('Programme Master', [
      leaf('Programme Master', 'graduation', '/academic/programme-master'),
      leaf('Fee Structure', 'dollar', '/academic/fee-structure'),
      leaf('Programme Approval', 'check-box', '/academic/programme-approval'),
    ]),
    section('Timetable', [
      leaf('Schedule Timetable', 'calendar', '/academic/timetable'),
      leaf('Lecturer View', 'user', '/academic/timetable-lecturer'),
      leaf('Batch View', 'users', '/academic/timetable-batch'),
      leaf('Time Slot Audit', 'alarm-clock', '/academic/timetable-slot-audit'),
    ]),
    section('ODL Applications', [
      leaf('ODL Applications', 'world', '/academic/odl-applications'),
      leaf('Payment Reconciliation', 'credit-cards', '/academic/odl-reconciliation'),
    ]),
    section('Events and Announcements', [
      leaf('Event Management', 'calendar', '/student/event-management'),
      leaf('Announcement Management', 'bullhorn', '/student/announcement-management'),
    ]),
  ]),
  module_('Admission', 'clipboard', [
    section('General', [
      leaf('Dashboard', 'dashboard', '/admission/dashboard'),
    ]),
    section('Enquiry', [
      leaf('On-Desk Enquiry', 'pencil-alt', '/admission/ondesk-enquiry'),
      leaf('Enquiry List', 'folder', '/admission/enquiry-list'),
      leaf('Enquiry Followup Master', 'calendar', '/admission/enquiry-followup-master'),
      leaf('Enquiry Status', 'flag', '/config/enquiry-status'),
      leaf('Isbat Enquiry Source', 'compass', '/config/enquiry-source'),
      leaf('Enquiry Followup', 'phone', '/admission/enquiry-followup'),
    ]),
    section('Other', [
      leaf('Online Enquiry', 'display', '/admission/online-enquiry'),
      leaf('Self-Service Kiosk', 'tab', '/admission/kiosk-enquiry'),
    ]),
    section('Admission Flow', [
      leaf('Application Payment', 'credit-cards', '/admission/payment'),
      leaf('Application Filing', 'pencil-alt', '/admission/filing'),
      leaf('Vetting Desk', 'search-alt', '/admission/vetting'),
      leaf("Registrar's Desk", 'graduation', '/admission/registration'),
    ]),
    section('Records', [
      leaf('All Applicants', 'users', '/admission/applicants'),
      leaf('Paid Students', 'wallet', '/admission/paid-students'),
    ]),
  ]),
  module_('Employee', 'briefcase', [
    section('Employee Records', [
      leaf('Employee Master', 'user', '/employee/employee-master'),
      leaf('Employee Approvals', 'checkmark-circle', '/employee/employee-approve'),
    ]),
    section('Access Control', [
      leaf('Permission Master', 'lock', '/config/permission-master'),
    ]),
  ]),
  module_('Attendance', 'alarm-clock', [
    section('Class Attendance', [
      leaf('Record Attendance', 'checkmark-circle', '/attendance/record'),
      leaf('Pending Outlines', 'list', '/attendance/pending-outlines'),
    ]),
    section('Management', [
      leaf('Attendance Sessions', 'calendar', '/attendance/sessions'),
    ]),
  ]),
  module_('Assessment', 'pencil-alt', [
    section('General', [
      leaf('Assessment Dashboard', 'dashboard', '/assessment/dashboard'),
    ]),
    section('Assessment Structure', [
      leaf('Question Bank Upload', 'upload', '/assessment/cw-qbank'),
      leaf('Bulk Exam Scheduler', 'calendar', '/assessment/bulk-exam-scheduler'),
      leaf('Assessment Scheduler', 'graduation', '/assessment/ia-creation'),
    ]),
    section('IA Internal Assessment', [
      leaf('IA Evaluation', 'checkmark-circle', '/assessment/ia-evaluation'),
      leaf('CW Rectification', 'reload', '/assessment/cw-rectify'),
      leaf('Project Proposals', 'folder', '/assessment/project-proposals'),
      leaf('Project Reviews', 'folder', '/assessment/project-reviews'),
      leaf('Exam Cancel', 'timer', '/assessment/exam-cancel'),
    ]),
    section('University Exam (UE)', [
      leaf('Question Paper Vetting', 'upload', '/assessment/qp-vetting'),
      leaf('UE Practical QBank', 'upload', '/assessment/question-bank-practical'),
      leaf('Hall Ticket Issuance', 'ticket', '/assessment/hall-ticket'),
      leaf('UE Material Print', 'printer', '/assessment/university-exam-material-print'),
      leaf('UE QP/Booklet Print', 'printer', '/assessment/university-exam-qp-booklet-print'),
      leaf('UE Practical QP Print', 'printer', '/assessment/university-exam-practical-qp-print'),
      leaf('UE Project Booklet Print', 'printer', '/assessment/university-exam-project-booklet-print'),
      leaf('UE Attendance', 'users', '/assessment/ue-attendance'),
      leaf('UE Mark Import', 'upload', '/assessment/ue-mark-import'),
      leaf('Mark Entry — UE', 'pencil-alt', '/assessment/mark-ue'),
      leaf('Mark Verify — UE', 'shield', '/assessment/mark-ue-verify'),
      leaf('Exam Mark Import', 'upload', '/assessment/exam-mark-import'),
    ]),
    section('Results & Graduation', [
      leaf('Result & Moderation', 'bar-chart', '/assessment/moderation'),
      leaf('Generate Result', 'cogs', '/assessment/generate-result'),
      leaf('Transcript Print', 'printer', '/assessment/transcript-print'),
      leaf('Graduate Transcript', 'certificate', '/assessment/graduate-transcript'),
      leaf('HEC Graduate Transcript', 'certificate', '/assessment/hec-graduate-transcript'),
      leaf('Transcript Collection', 'check-box', '/assessment/graduate-transcript/collection'),
      leaf('Gown Collection', 'check-box', '/assessment/gown-collection'),
    ]),
    section('Resit', [
      leaf('Resit Master', 'cogs', '/assessment/resit-configs'),
      leaf('Resit Question Print', 'printer', '/assessment/resit-question-print'),
      leaf('Resit Applications', 'folder', '/assessment/resit-applications'),
      leaf('Resit Apply', 'pencil-alt', '/assessment/resit-apply'),
      leaf('Resit Scheduling', 'calendar', '/assessment/resit-scheduling'),
      leaf('Resit IA Evaluation', 'checkmark-circle', '/assessment/resit-evaluation'),
      leaf('Resit IA Result', 'bar-chart', '/assessment/resit-ia-results'),
      leaf('Resit UE Mark Import', 'upload', '/assessment/resit-ue-mark-import'),
      leaf('Resit Mark Update', 'reload', '/assessment/resit-mark-update'),
    ]),
    section('Exam Grievances', [
      leaf('Exam Grievances', 'files', '/assessment/exam-grievances'),
    ]),
  ]),
  module_('Analytics', 'bar-chart', [
    section('Student', [
      leaf('Students in Programme Report', 'bar-chart', '/student/reports/students-in-programme'),
    ]),
    section('Finance', [
      leaf('Payment History', 'bar-chart', '/finance/payment-history'),
      leaf('Discount Report', 'tag', '/finance/reports/discount'),
      leaf('Transaction Report', 'list', '/finance/reports/transaction'),
      leaf('Outstanding Report', 'alarm-clock', '/finance/reports/outstanding'),
    ]),
    section('Admission', [
      leaf('Enquiry Report', 'bar-chart', '/admission/reports/enquiry'),
      leaf('Application Status Report', 'bar-chart', '/admission/reports/application-status'),
    ]),
    section('Attendance', [
      leaf('Attendance by Date', 'calendar', '/attendance/reports/by-date'),
      leaf('Student Attendance %', 'users', '/attendance/reports/student-pct'),
      leaf('Faculty Attendance %', 'library', '/attendance/reports/faculty-pct'),
    ]),
    section('Assessment', [
      leaf('Exam Schedule Report', 'bar-chart', '/assessment/reports/exam-schedule'),
      leaf('IA Evaluation Report', 'bar-chart', '/assessment/reports/ia-evaluation'),
    ]),
    // Sent by the menu API but not listed in v7 (2026-11-20).
    section('Employee', [
      leaf('Activity Log', 'list', '/activity-log/logs'),
    ]),
  ]),
  module_('Configuration', 'cog', [
    section('Student', [
      leaf('Specialization Management', 'graduation', '/student/specialization'),
      leaf('Termination Reason Master', 'shield', '/student/termination-reasons'),
      leaf('Feedback Master', 'comments', '/student/feedback-master'),
      leaf('Student Category Master', 'users', '/config/student-category-master'),
      leaf('Service Category Master', 'list', '/config/service-category-master'),
    ]),
    section('Finance', [
      leaf('Exchange Rates', 'world', '/finance/exchange-rates'),
      leaf('Cooperates', 'handshake', '/finance/cooperates'),
      leaf('Discounts', 'tag', '/finance/discounts'),
      leaf('Ledgers', 'book', '/finance/ledgers'),
      leaf('Other Ledgers', 'book', '/finance/ledger-others'),
      leaf('Currency Master', 'dollar', '/finance/currency-master'),
      leaf('Receipt Books', 'ticket', '/finance/receipt-books'),
      leaf('General Settings', 'cog', '/finance/gen-sets'),
      leaf('Banks', 'coin', '/finance/banks'),
      leaf('Bank Branches', 'map-marker', '/finance/bank-branches'),
      leaf('Proc Banks', 'wallet', '/finance/proc-banks'),
      leaf('Proc GL Accounts', 'calculator', '/finance/proc-gl-accounts'),
    ]),
    section('Academic', [
      leaf('Faculty Master', 'library', '/config/faculty-master'),
      leaf('Campus Master', 'home', '/config/campus-master'),
      leaf('Skill Management', 'bulb', '/academic/skill-master'),
      leaf('Room Management', 'home', '/academic/room-management'),
      leaf('Programme Level', 'layers', '/academic/programme-level'),
      leaf('Programme Group', 'folder', '/academic/programme-group'),
      leaf('Specialization', 'certificate', '/config/specialization'),
      leaf('Skill Master', 'bulb', '/config/skill'),
      leaf('Unit Type Master', 'tag', '/config/unit-type'),
      leaf('Unit Category Master', 'tag', '/config/unit-category'),
      leaf('Weekdays', 'calendar', '/config/weekdays'),
      leaf('Batch Times', 'timer', '/config/batch-times'),
    ]),
    section('Admission', [
      leaf('Enquiry Source', 'volume', '/config/enquiry-source-master'),
      leaf('Followup Status', 'phone', '/config/followup-status'),
      leaf('Followup Mode', 'comments', '/config/followup-mode'),
      leaf('Interest Level', 'signal', '/config/interest-level'),
    ]),
    section('Assessment', [
      leaf('Fee Clearance Master', 'list', '/assessment/assessment-master'),
      leaf('Exam Rules Master', 'files', '/assessment/exam-rules'),
      leaf('Question FAQs', 'comments', '/assessment/question-faqs'),
    ]),
    section('General', [
      leaf('Department Master', 'briefcase', '/config/department-master'),
      leaf('Designation Master', 'tag', '/config/designation-master'),
      leaf('Course Level Master', 'graduation', '/config/course-level-master'),
      leaf('Country Master', 'world', '/config/country-master'),
    ]),
  ]),
]

// Real mode shows exactly what /me/menu returns: no page, section or module
// is added client-side. Whole-module injection went 2026-09-07, the
// section/leaf patches went 2026-10-28, and the last two injections
// (ensureOdelApplication, ensureExamScheduleReport) went 2026-11-20 — the
// menu API now sends Exam Schedule Report under Analytics, and ODeL
// Application isn't in the v7 hierarchy. The steps below only remove or
// rename entries.

// Student: drops entries the backend may still register for pages that were
// removed, moved or hidden. Never adds anything.
function cleanStudentSections(menu: MenuNode[]): MenuNode[] {
  const studentIdx = menu.findIndex(n => n.name === 'Student')
  if (studentIdx === -1) return menu

  // Batch Summary moved to Academic (2026-09-02); Student Statement isn't a
  // Student page; Intake Transfer was renamed Dropout Rejoin (2026-09-03);
  // Category Masters was split and moved to Config, and Discount Management
  // moved to Finance (2026-09-02).
  const removedLeaves = new Set([
    'Batch Summary', 'Student Statement', 'Intake Transfer',
    'Category Masters', 'Discount Management', 'Student Category Master', 'Service Category Master',
  ])

  const studentModule = menu[studentIdx]
  const children = studentModule.children
    // Services hidden from the sidebar per request, 2026-09-02.
    .filter(sec => sec.name !== 'Services')
    .flatMap(sec => {
      const kept = sec.children.filter(l => !removedLeaves.has(l.name))
      // Sidebar.tsx renders a childless section as a disabled "Soon" item,
      // so drop a section this emptied.
      return sec.children.length > 0 && kept.length === 0 ? [] : [{ ...sec, children: kept }]
    })

  const merged = [...menu]
  merged[studentIdx] = { ...studentModule, children }
  return merged
}

export interface MenuResult {
  menu: MenuNode[]
}

// Batch Summary was merged into Batch Management (2026-10-21) — the head
// count is now a column there, and /academic/batch-summary
// just redirects to it. Drops the leaf if the backend menu still registers
// it, so the sidebar shows a single Batch Management entry.
function removeBatchSummary(menu: MenuNode[]): MenuNode[] {
  const acadIdx = menu.findIndex(n => n.name === 'Academic')
  if (acadIdx === -1) return menu

  const acadModule = menu[acadIdx]
  const coreIdx = acadModule.children.findIndex(c => c.name === 'Academic Core')
  if (coreIdx === -1) return menu

  const coreSection = acadModule.children[coreIdx]
  if (!coreSection.children.some(l => l.name === 'Batch Summary')) return menu

  const mergedSection = { ...coreSection, children: coreSection.children.filter(l => l.name !== 'Batch Summary') }

  const mergedAcad = { ...acadModule }
  mergedAcad.children = [...acadModule.children]
  mergedAcad.children[coreIdx] = mergedSection

  const mergedMenu = [...menu]
  mergedMenu[acadIdx] = mergedAcad
  return mergedMenu
}

function stripLectureMaster(menu: MenuNode[]): MenuNode[] {
  return menu.map(mod => {
    const isLectureMatch = (name: string) => {
      const n = name.trim().toLowerCase()
      return n === 'lecture master' || n === 'lecturer master'
    }
    if (!mod.children.some(c => isLectureMatch(c.name))) return mod
    return {
      ...mod,
      children: mod.children.filter(c => !isLectureMatch(c.name)),
    }
  })
}

// Merges Hall Ticket Issuance (/assessment/hall-ticket), Hall Ticket Print
// (/assessment/hall-print), and Hall Ticket Print All
// (/assessment/hall-ticket-print-all) into a single /assessment/hall-ticket
// sidebar leaf while preserving each node's view/action permissions as scoped
// flags (`hallticketprint.*`, `hallticketprintall.*`). Runs before
// stripUnintegratedPages hides the two print leaves so:
//  - An Issuance-only user does NOT see Print tabs or buttons.
//  - A Print-only / Print-All-only user still gets the sidebar link and can open
//    the merged page directly on their permitted tab.
function mergeHallTicketNodes(menu: MenuNode[]): MenuNode[] {
  const acadUrl = (modBase: string, url: string | null) =>
    url ? (url.startsWith('/') ? url : `${modBase}/${url}`) : null

  const ISSUE_URL = '/assessment/hall-ticket'
  const PRINT_ONE_URL = '/assessment/hall-print'
  const PRINT_ALL_URL = '/assessment/hall-ticket-print-all'

  const assessmentIdx = menu.findIndex(m => m.name === 'Assessment')
  if (assessmentIdx === -1) return menu

  const mod = menu[assessmentIdx]
  const modBase = '/assessment'

  let issueNode: MenuNode | null = null
  let printOneNode: MenuNode | null = null
  let printAllNode: MenuNode | null = null

  for (const sec of mod.children) {
    for (const leafNode of sec.children) {
      const full = acadUrl(modBase, leafNode.url)
      if (full === ISSUE_URL) issueNode = leafNode
      else if (full === PRINT_ONE_URL) printOneNode = leafNode
      else if (full === PRINT_ALL_URL) printAllNode = leafNode
    }
  }

  if (!issueNode && !printOneNode && !printAllNode) return menu

  const issuePerms = issueNode?.permissions ?? null
  const backendAlreadyMerged =
    !printOneNode &&
    !printAllNode &&
    !!issuePerms &&
    Object.keys(issuePerms).some(k => /^(hallticketprint|hallticketprintall|print)/i.test(k))
  if (backendAlreadyMerged) return menu

  const hasPrintView = (n: MenuNode | null) => {
    if (!n) return false
    if (n.permissions === null) return true
    return n.permissions.get === true || n.permissions.view === true || (n.permissions.get !== false && n.permissions.print === true)
  }
  const hasPrintAction = (n: MenuNode | null) => {
    if (!n) return false
    if (n.permissions === null) return true
    return n.permissions.print === true
  }

  const basePerms: MenuPermissions = issueNode
    ? { ...(issueNode.permissions ?? {}) }
    : { get: false, view: false, issue: false, add: false, edit: false }

  const mergedPermissions: MenuPermissions = {
    ...basePerms,
    'hallticketprint.get': hasPrintView(printOneNode),
    'hallticketprint.print': hasPrintAction(printOneNode),
    'hallticketprintall.get': hasPrintView(printAllNode),
    'hallticketprintall.print': hasPrintAction(printAllNode),
  }

  let placed = false
  const sections = mod.children.map(sec => ({
    ...sec,
    children: sec.children.map(leafNode => {
      const full = acadUrl(modBase, leafNode.url)
      if (issueNode && full === ISSUE_URL) {
        placed = true
        return { ...leafNode, permissions: mergedPermissions }
      }
      if (!issueNode && !placed && (full === PRINT_ONE_URL || full === PRINT_ALL_URL)) {
        placed = true
        return {
          name: 'Hall Ticket Issuance',
          icon: leafNode.icon ?? 'lni lni-ticket',
          url: ISSUE_URL,
          permissions: mergedPermissions,
          children: [],
        }
      }
      return leafNode
    }),
  }))

  const mergedMenu = [...menu]
  mergedMenu[assessmentIdx] = { ...mod, children: sections }
  return mergedMenu
}

function stripUnintegratedPages(menu: MenuNode[]): MenuNode[] {
  const hiddenUrls = [
    '/assessment/resit-calendar',
    '/assessment/resit-seating',
    '/assessment/reeval',
    '/assessment/recheck',
    // Hidden from the sidebar per request, 2026-10-15 — pages still exist.
    '/assessment/weight-config',
    '/assessment/schedule',
    // Hidden from the sidebar per request, 2026-10-29 — page still exists.
    '/academic/student-lookup',
    // Merged into /assessment/hall-ticket tabs (2026-11-26) — /hall-print
    // and /hall-ticket-print-all remain as redirects for old links/bookmarks.
    '/assessment/hall-print',
    '/assessment/hall-ticket-print-all',
    // Page deleted 2026-11-11 (static mock figures, no API). The backend's
    // /me/menu still sends it, so strip it until the menu API drops it —
    // otherwise the sidebar would link to a 404.
    '/finance/financial-reports',
  ]
  // The real /me/menu may send bare slugs ("weight-config"), so match on
  // the last path segment too — but only within the hidden URL's own module,
  // so a same-named slug elsewhere isn't caught.
  const isHidden = (modBase: string, url: string | null) =>
    !!url && hiddenUrls.some(u => url === u || (u.startsWith(modBase + '/') && url === u.slice(modBase.length + 1)))

  let changed = false
  const merged = menu.map(mod => {
    const modBase = '/' + mod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let modChanged = false
    const sections = mod.children.flatMap(s => {
      const kept = s.children.filter(l => !isHidden(modBase, l.url))
      if (kept.length === s.children.length) return [s]
      modChanged = true
      // Sidebar.tsx renders a childless section as a disabled "Soon" item, so
      // drop a section this emptied.
      return kept.length ? [{ ...s, children: kept }] : []
    })
    if (!modChanged) return mod
    changed = true
    return { ...mod, children: sections }
  })

  return changed ? merged : menu
}

export interface AppPage {
  name: string
  url: string
  module: string
  section: string | null
}

// Every navigable page in a menu tree, flattened — for "did you mean"
// suggestions and page search on the 404 page. Pass the user's own
// (RBAC-filtered) menu from getMenu()/useMenu(), so only pages they can open
// are offered. The real /me/menu sends bare slugs ("permission-master");
// those resolve against the module's route segment ("Activity Log" →
// /activity-log/…), same as the sidebar's resolveHref.
export function flattenMenuPages(menu: MenuNode[]): AppPage[] {
  const pages: AppPage[] = []
  for (const m of menu) {
    const base = '/' + m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const walk = (nodes: MenuNode[], section: string | null) => {
      for (const n of nodes) {
        if (n.url) pages.push({ name: n.name, url: n.url.startsWith('/') ? n.url : `${base}/${n.url}`, module: m.name, section })
        if (n.children.length) walk(n.children, n.url ? section : n.name)
      }
    }
    walk(m.children, null)
  }
  return pages
}

// Every page the app knows as a menu item, i.e. the full menu before RBAC
// filtering (the mock-mode tree). Built once, on first use.
let catalogCache: { modules: Set<string>; pages: Map<string, AppPage> } | null = null
function menuCatalog() {
  if (!catalogCache) {
    const pages = flattenMenuPages(applyMenuRouteMoves(stripUnintegratedPages(stripLectureMaster(renameIaCreation(mockMenu)))))
    catalogCache = {
      modules: new Set(pages.map(p => p.url.split('/')[1])),
      pages: new Map(pages.map(p => [p.url, p])),
    }
  }
  return catalogCache
}

// The catalog entry for `pathname` (name, module, section), whether or not
// the user can open it — for naming the page on the access-denied screen.
export function findCatalogPage(pathname: string): AppPage | undefined {
  return menuCatalog().pages.get(canonicalPath(pathname))
}

// Multi-tab pages (e.g. Resit Scheduling with View Resit Class Test / Coursework
// Schedule) or Student Master (`view`) can grant a specific view permission while
// the page-level `get` flag is false. Allow the route if `get` isn't false OR an
// explicit view/get key in the bag is true (avoiding substrings like `review`/`preview`).
function hasExplicitViewPermission(permissions: MenuPermissions): boolean {
  return Object.entries(permissions).some(([key, allowed]) => {
    if (allowed !== true) return false
    const k = key.toLowerCase()
    if (k === 'get' || k === 'view') return true
    if (/(^|[._-])(get|view)([._-]|$)/.test(k)) return true
    if (/^(get|view)/.test(k)) return true
    return /(ct|cw)(get|view)$/.test(k)
  })
}

// Whether the user's own (RBAC-filtered) menu lets them open `pathname`.
// Denied: anything under a module missing from their menu, and any known
// menu page that their menu leaves out or marks `get: false` (unless another
// explicit view/get permission on that page is granted). Routes that aren't
// menu items (profile, detail pages like /student/profile, dashboards not in
// the catalog) are allowed — the backend still authorizes each call.
export function isRouteAllowed(menu: MenuNode[], pathname: string): boolean {
  // An old folder address of a moved page is checked as its new address.
  const path = canonicalPath(pathname)
  const catalog = menuCatalog()
  const moduleSeg = path.split('/')[1]
  if (!catalog.modules.has(moduleSeg)) return true

  const pages = flattenMenuPages(menu)
  if (!pages.some(p => p.url.split('/')[1] === moduleSeg)) return false
  if (!catalog.pages.has(path)) return true

  const permissions = findLeafPermissions(menu, path)
  if (permissions === undefined) return false
  if (permissions === null) return true
  return permissions.get !== false || hasExplicitViewPermission(permissions)
}

// undefined: the page isn't in the menu; null: it is, with no permission data.
function findLeafPermissions(menu: MenuNode[], path: string): MenuPermissions | null | undefined {
  for (const m of menu) {
    const base = '/' + m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const walk = (nodes: MenuNode[]): MenuPermissions | null | undefined => {
      for (const n of nodes) {
        if (n.url && (n.url.startsWith('/') ? n.url : `${base}/${n.url}`) === path) return n.permissions
        const found = n.children.length ? walk(n.children) : undefined
        if (found !== undefined) return found
      }
      return undefined
    }
    const found = walk(m.children)
    if (found !== undefined) return found
  }
  return undefined
}

function cleanMenuLabel(label: string): string {
  return label
    .replace(/\s*(?:â€”|â€“|�|—|–)\s*/g, ' ')
    .replace(/\s+\?\s+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Assessment label cleanup. The UE print renames ("UE Theory QP Print" /
// "UE Material Print") and the Timetable → "Schedule Timetable" rename were
// dropped 2026-11-20: the menu API now sends the v7 names itself.
function renameIaCreation(menu: MenuNode[]): MenuNode[] {
  return menu.map(mod => {
    if (mod.name !== 'Assessment') return mod
    return {
      ...mod,
      children: mod.children.map(sec => ({
        ...sec,
        name: cleanMenuLabel(sec.name),
        children: sec.children.map(leafNode => {
          const slug = leafNode.url?.split('/').filter(Boolean).pop() ?? ''
          if (leafNode.name === 'IA Creation' || slug === 'ia-creation') {
            return { ...leafNode, name: 'Assessment Scheduler' }
          }
          if (slug === 'mark-ue') {
            return { ...leafNode, name: 'Mark Entry UE' }
          }
          if (slug === 'mark-ue-verify') {
            return { ...leafNode, name: 'Mark Verify UE' }
          }
          if (slug === 'mark-cw') {
            return { ...leafNode, name: 'Mark Entry CW' }
          }
          if (slug === 'mark-cbt') {
            return { ...leafNode, name: 'Mark Entry CBT' }
          }
          const cleaned = cleanMenuLabel(leafNode.name)
          return cleaned !== leafNode.name ? { ...leafNode, name: cleaned } : leafNode
        }),
      })),
    }
  })
}

// A failed /me/menu call rejects (no fallback menu): the sidebar shows its
// "Couldn't load menu" state, RouteGuard blocks the page and
// usePagePermissions grants nothing, until the user retries.
// Pages listed under another module than their folder get their menu
// module's address (applyMenuRouteMoves, src/lib/menuRoutes.ts).
export function getMenu(): Promise<MenuResult> {
  if (MOCK_MENU) return Promise.resolve({ menu: applyMenuRouteMoves(stripUnintegratedPages(stripLectureMaster(renameIaCreation(mockMenu)))) })
  return apiGet<MenuNode[] | null>('/api/v1/users/me/menu')
    .then(data => {
      // Taken as-is apart from the remove/rename steps — see the note above
      // cleanStudentSections.
      const menu = removeBatchSummary(cleanStudentSections(data ?? []))
      return { menu: applyMenuRouteMoves(stripUnintegratedPages(stripLectureMaster(mergeHallTicketNodes(renameIaCreation(menu))))) }
    })
}
