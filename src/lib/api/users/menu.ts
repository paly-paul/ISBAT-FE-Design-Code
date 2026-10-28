import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Role-based menu/permissions has its own toggle, separate from
// NEXT_PUBLIC_AUTH_MOCK — that flag also controls login and every other API
// module, so flipping it to test the real permission-driven sidebar means
// mocking (or un-mocking) everything else too. NEXT_PUBLIC_RBAC_MOCK lets the
// menu source be flipped on its own; when unset it just follows AUTH_MOCK, so
// existing .env files keep working with no change.
const MOCK_MENU = process.env.NEXT_PUBLIC_RBAC_MOCK !== undefined
  ? process.env.NEXT_PUBLIC_RBAC_MOCK === 'true'
  : MOCK_AUTH

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

// Finance's Payment Collection / Reports & Statements, for mock mode only —
// real mode takes these sections straight from /me/menu.
//
// 'Payment Console Adjustments' removed (2026-09-08) — its "Apply Advance"
// fields/functionality moved into Payment Console's own Semester Payment
// tab, behind a Regular Payment/Apply Advance toggle; the standalone page
// now just redirects there, so it no longer needs its own nav entry.
const FINANCE_PAYMENT_SECTIONS: MenuNode[] = [
  section('Payment Collection', [
    leaf('Dashboard', 'dashboard', 'dashboard'),
    leaf('Payment Console', 'credit-cards', 'payment-console'),
    leaf('Payment Refund', 'reload', 'payment-refund'),
    leaf('NCHE & Guild Payment', 'graduation', 'nche-guild-payment'),
    leaf('Discount Allocation', 'tag', 'discount-allocation'),
    // Same refugee-status workflow as Student Master's row-menu modal, as a
    // standalone page for Finance (it changes the student's fees).
    leaf('Refugee Status', 'shield', 'refugee-status'),
    leaf('Payment History', 'bar-chart', 'payment-history'),
    leaf('Ledger Adjustments', 'lock', 'ledger-adjustments'),
    leaf('Exchange Rates', 'world', 'exchange-rates'),
    leaf('Advanced Payments', 'wallet', 'advanced-payments'),
  ]),
  section('Reports & Statements', [
    leaf('Financial Reports', 'bar-chart', 'financial-reports'),
    // discount-report-page.md, 2026-10-11 — no backend page registration
    // yet, so real mode shows it only once /me/menu returns it.
    leaf('Discount Report', 'tag', 'reports/discount'),
    // transaction-report-page.md / outstanding-report-page.md, 2026-10-13 —
    // same: real mode shows them only once /me/menu returns them.
    leaf('Transaction Report', 'list', 'reports/transaction'),
    leaf('Outstanding Report', 'alarm-clock', 'reports/outstanding'),
    leaf('Student Statement', 'files', 'student-statements'),
  ]),
]

// Student module sections for mockMenu; cleanStudentSections also reads the
// Operations icons from here for the real menu. Ported
// from isbat_student_module.html; Dashboard and Student Directory were
// skipped (Student Master already covers the directory role).
const STUDENT_OPERATIONS_SECTIONS: MenuNode[] = [
  section('Operations', [
    leaf('Student Profile', 'user', '/student/profile'),
    leaf('Batch Transfer', 'shuffle', '/student/batch-transfer'),
    leaf('Programme Transfer', 'graduation', '/student/prog-transfer'),
    leaf('Learning Mode', 'display', '/student/learning-mode'),
    // Approval queue for Learning Mode's change requests, 2026-09-30.
    leaf('Learning Mode Approval', 'checkmark-circle', '/student/learning-mode-approval'),
    // Approval queue for refugee-status requests (assign now only raises a
    // request — post-approve-refugee-status.md, 2026-10-05).
    leaf('Refugee Status Approval', 'checkmark-circle', '/student/refugee-approval'),
    // Re-enabled and renamed from "Intake Transfer" to "Dropout Rejoin",
    // 2026-09-03 — same route (/student/intake-transfer), matching the page's
    // own "Dropout Rejoin" mode tab (its "Deferment / Period Shift" tab was
    // commented out on the page itself the same day, leaving Dropout Rejoin
    // as the page's only mode).
    leaf('Dropout Rejoin', 'calendar', '/student/intake-transfer'),
    leaf('Fee Structure Transfer', 'dollar', '/student/fee-structure-transfer'),
    // POST /students/{studentGuid}/terminate (student-termination/
    // post-terminate-student.md) — added 2026-09-15.
    leaf('Terminate Student', 'shield', '/student/terminate-student'),
    // GET .../passout-confirmation/candidates + POST .../{studentGuid}/confirm
    // (passout-confirmation/*.md) — manual Passout confirmation for PCSE/PCIM
    // students, which have no marks data anywhere to drive an automated
    // decision. Added 2026-09-18.
    leaf('Passout Confirmation', 'graduation', '/student/passout-confirmation'),
  ]),
  // Learning Mode Report split out of the Learning Mode page into its own
  // page, 2026-09-29 (GET /students/learning-mode/report). Hidden from the
  // sidebar per request, 2026-10-01 — the page still exists at
  // /student/learning-mode-report, just not linked to. Commented out whole
  // for the same "childless section renders as Soon" reason as Services below.
  // section('Reports', [
  //   leaf('Learning Mode Report', 'bar-chart', '/student/learning-mode-report'),
  // ]),
  // Services section hidden from the sidebar per request, 2026-09-02 — its
  // one leaf (Student Services) still exists at /student/services, just not
  // linked to. Commented out whole (not just the leaf) since Sidebar.tsx
  // renders a childless section as a disabled "Soon" item instead of
  // skipping it (see sbItem/sbSection in Sidebar.tsx).
  // section('Services', [
  //   leaf('Student Services', 'ticket', '/student/services'),
  // ]),
  section('Communications', [
    leaf('Send Communication', 'envelope', '/student/communications'),
  ]),
  section('Events and Announcements', [
    leaf('Event Management', 'calendar', '/student/event-management'),
    leaf('Announcement Management', 'bullhorn', '/student/announcement-management'),
  ]),
  section('Settings', [
    leaf('Specialization Management', 'graduation', '/student/specialization'),
    // M_TERMINATION_REASON master (termination-reasons/*.md) — the reason
    // picker behind POST /students/{studentGuid}/terminate. Added 2026-09-15
    // alongside the Refund-Eligibility Search work.
    leaf('Termination Reason Master', 'shield', '/student/termination-reasons'),
    // Course feedback forms + questions per intake (feedback-master/*.md,
    // 2026-10-06).
    leaf('Feedback Master', 'comments', '/student/feedback-master'),
  ]),
]

const CONFIG_SECTIONS: MenuNode[] = [
  section('Students', [
    // Moved out of the Student module's Settings section — these are config
    // masters (sponsor/student categories and ticketing categories), not
    // day-to-day student operations, so they belong alongside the rest of
    // Config's setup masters instead.
    leaf('Student Category Master', 'users', '/config/student-category-master'),
    leaf('Service Category Master', 'list', '/config/service-category-master'),
  ]),
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
]

const ASSESSMENT_SECTIONS: MenuNode[] = [
  section('Overview', [
    leaf('Assessment Dashboard', 'dashboard', '/assessment/dashboard'),
  ]),
  section('Assessment Structure', [
    leaf('Fee Clearance Master', 'list', '/assessment/assessment-master'),
    leaf('Exam Rules Master', 'files', '/assessment/exam-rules'),
    leaf('Question FAQs', 'comments', '/assessment/question-faqs'),
    // leaf('Weight Configuration', 'cog', '/assessment/weight-config'),
    // leaf('Assessment Schedule', 'calendar', '/assessment/schedule'),
    leaf('Bulk Exam Scheduler', 'calendar', '/assessment/bulk-exam-scheduler'),
    leaf('Assessment Scheduler', 'graduation', '/assessment/ia-creation'),
    leaf('IA Evaluation', 'checkmark-circle', '/assessment/ia-evaluation'),
  ]),
  section('Coursework (CW)', [
    // leaf('CW Overview', 'folder', '/assessment/cw-overview'),
    leaf('Question Bank Upload', 'upload', '/assessment/cw-qbank'),
    // leaf('CW Submissions', 'files', '/assessment/cw-submissions'),
    leaf('CW Rectification', 'reload', '/assessment/cw-rectify'),
    leaf('Project Proposals', 'folder', '/assessment/project-proposals'),
    leaf('Project Reviews', 'folder', '/assessment/project-reviews'),
  ]),
  section('Class Test (CBT)', [
    // leaf('CBT Overview', 'folder', '/assessment/cbt-overview'),
    // leaf('CBT Question Upload', 'upload', '/assessment/cbt-qupload'),
    // leaf('CBT Monitor', 'display', '/assessment/cbt-monitor'),
    leaf('Exam Cancel', 'timer', '/assessment/exam-cancel'),
  ]),
  section('University Exam (UE)', [
    // leaf('UE Schedule', 'calendar', '/assessment/ue-schedule'),
    leaf('Question Paper Vetting', 'upload', '/assessment/qp-vetting'),
    leaf('UE Practical QBank', 'upload', '/assessment/question-bank-practical'),
    leaf('Hall Ticket Issuance', 'ticket', '/assessment/hall-ticket'),
    leaf('Hall Ticket Print', 'printer', '/assessment/hall-print'),
    // Whole-intake combined PDF (hall-ticket-print-all-page.md, 2026-10-06).
    leaf('Hall Ticket Print All', 'printer', '/assessment/hall-ticket-print-all'),
    leaf('UE Material Print', 'printer', '/assessment/university-exam-material-print'),
    leaf('UE QP/Booklet Print', 'printer', '/assessment/university-exam-qp-booklet-print'),
    leaf('UE Practical QP Print', 'printer', '/assessment/university-exam-practical-qp-print'),
    leaf('UE Project Booklet Print', 'printer', '/assessment/university-exam-project-booklet-print'),
    leaf('Resit Question Print', 'printer', '/assessment/resit-question-print'),
    leaf('UE Attendance', 'users', '/assessment/ue-attendance'),
    leaf('UE Mark Import', 'upload', '/assessment/ue-mark-import'),
  ]),
  section('Mark Entry & Results', [
    // leaf('Mark Entry — CW', 'pencil-alt', '/assessment/mark-cw'),
    // leaf('Mark Entry — CBT', 'pencil-alt', '/assessment/mark-cbt'),
    leaf('Mark Entry — UE', 'pencil-alt', '/assessment/mark-ue'),
    leaf('Mark Verify — UE', 'shield', '/assessment/mark-ue-verify'),
    leaf('Result & Moderation', 'bar-chart', '/assessment/moderation'),
    leaf('Exam Mark Import', 'upload', '/assessment/exam-mark-import'),
    leaf('Generate Result', 'cogs', '/assessment/generate-result'),
    leaf('Transcript Print', 'printer', '/assessment/transcript-print'),
    leaf('Graduate Transcript', 'certificate', '/assessment/graduate-transcript'),
    leaf('HEC Graduate Transcript', 'certificate', '/assessment/hec-graduate-transcript'),
    leaf('Transcript Collection', 'check-box', '/assessment/graduate-transcript/collection'),
    leaf('Gown Collection', 'check-box', '/assessment/gown-collection'),
  ]),
  section('Resit & Disputes', [
    leaf('Resit Master', 'cogs', '/assessment/resit-configs'),
    // leaf('Resit Calendar', 'calendar', '/assessment/resit-calendar'),
    leaf('Resit Applications', 'folder', '/assessment/resit-applications'),
    leaf('Resit Apply', 'pencil-alt', '/assessment/resit-apply'),
    leaf('Resit Scheduling', 'calendar', '/assessment/resit-scheduling'),
    leaf('Resit IA Evaluation', 'checkmark-circle', '/assessment/resit-evaluation'),
    leaf('Resit IA Result', 'bar-chart', '/assessment/resit-ia-results'),
    leaf('Resit UE Mark Import', 'upload', '/assessment/resit-ue-mark-import'),
    leaf('Resit Mark Update', 'reload', '/assessment/resit-mark-update'),
    // leaf('Resit Seating Allocator', 'users', '/assessment/resit-seating'),
    // leaf('CW Reevaluation', 'reload', '/assessment/reeval'),
    // leaf('CW Recheck Hub', 'search-alt', '/assessment/recheck'),
    leaf('Exam Grievances', 'files', '/assessment/exam-grievances'),
  ]),
  // Student Services hidden from the sidebar per request, 2026-10-15 — page
  // still exists on disk. Commented out whole (its only leaf) for the same
  // reason as Reports below.
  // section('Student Services', [
  //   leaf('Service Tickets', 'ticket', '/assessment/service-tickets'),
  // ]),
  // Reports section hidden from the sidebar per request, 2026-10-05 — both
  // pages still exist on disk. Commented out whole since Sidebar.tsx renders
  // a childless section as a disabled "Soon" item.
  // section('Reports', [
  //   leaf('Pending QP Upload', 'folder', '/assessment/rpt-pending-qp'),
  //   leaf('Faculty Summary', 'users', '/assessment/rpt-faculty'),
  // ]),
]

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
      // enquiry-report-page.md, 2026-10-14.
      leaf('Enquiry Report', 'bar-chart', '/admission/reports/enquiry'),
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
      // application-status-report-page.md, 2026-10-14.
      leaf('Application Status Report', 'bar-chart', '/admission/reports/application-status'),
      // get-paid-students.md, 2026-10-19.
      leaf('Paid Students', 'wallet', '/admission/paid-students'),
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
      leaf('Bulk Intake Edit', 'layers', '/academic/bulk-intake-edit'),
      leaf('Skill Management', 'bulb', '/academic/skill-master'),
      leaf('Batch Management', 'users', '/academic/batch-management'),
      leaf('Room Management', 'home', '/academic/room-management'),
      leaf('Session Movement', 'reload', '/academic/session-movement'),
    ]),
    section('Course Unit Master', [
      leaf('Repetition Tag', 'reload', '/academic/repetition-tag'),
      leaf('Course Units', 'book', '/academic/course-units'),
      leaf('Course Allocation', 'agenda', '/academic/course-allocation'),
    ]),
    section('Programme Master', [
      leaf('Programme Level', 'layers', '/academic/programme-level'),
      leaf('Programme Group', 'folder', '/academic/programme-group'),
      leaf('Programme Master', 'graduation', '/academic/programme-master'),
      leaf('Programme Approval', 'check-box', '/academic/programme-approval'),
      leaf('Fee Structure', 'dollar', '/academic/fee-structure'),
    ]),
    section('Timetable', TIMETABLE_LEAVES()),
    section('ODL Applications', [
      leaf('ODL Applications', 'world', '/academic/odl-applications'),
      leaf('Payment Reconciliation', 'credit-cards', '/academic/odl-reconciliation'),
    ]),
    section('Cross-Module', [
      leaf('Student Lookup', 'user', '/academic/student-lookup'),
    ]),
  ]),
  module_('Finance', 'dollar', [
    ...FINANCE_PAYMENT_SECTIONS,
    section('Finance Core', [
      leaf('Cooperates', 'handshake', '/finance/cooperates'),
      leaf('Discounts', 'tag', '/finance/discounts'),
      leaf('Ledgers', 'book', '/finance/ledgers'),
      leaf('Other Ledgers', 'book', '/finance/ledger-others'),
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
    ...STUDENT_OPERATIONS_SECTIONS,
  ]),
  module_('Employee', 'briefcase', [
    section('Employee Records', [
      leaf('Employee Master', 'user', '/employee/employee-master'),
      leaf('Employee Approvals', 'checkmark-circle', '/employee/employee-approve'),
    ]),
  ]),

  module_('Assessment', 'pencil-alt', ASSESSMENT_SECTIONS),
  module_('Config', 'cog', CONFIG_SECTIONS),
  module_('Activity Log', 'list', [
    section('Audit Trail', [
      leaf('Activity Log', 'list', '/activity-log/logs'),
    ]),
  ]),
]

// Real mode shows exactly what /me/menu returns: no page, section or module
// is added client-side. Whole-module injection went 2026-09-07, and the
// section/leaf patches (mergeFinanceSections, mergeStudentSections,
// mergeConfigSections and the ensure* functions) went 2026-10-28 — they
// added frontend-only pages with full access to every role holding the
// parent module/section, so a role granted two pages saw dozens. A page the
// backend hasn't registered yet now stays hidden (and RouteGuard blocks it)
// until /me/menu returns it. The steps below only remove or rename entries.

// Student: drops entries the backend may still register for pages that were
// removed, moved or hidden, and stamps the frontend's Operations icons by
// name (the backend's are blank/inconsistent). Never adds anything.
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
  const operationsDef = STUDENT_OPERATIONS_SECTIONS.find(s => s.name === 'Operations')!
  const iconByName = new Map(operationsDef.children.map(l => [l.name, l.icon]))

  const studentModule = menu[studentIdx]
  const children = studentModule.children
    // Services hidden from the sidebar per request, 2026-09-02.
    .filter(sec => sec.name !== 'Services')
    .flatMap(sec => {
      const kept = sec.children
        .filter(l => !removedLeaves.has(l.name))
        .map(l => (sec.name === 'Operations' && iconByName.has(l.name) ? { ...l, icon: iconByName.get(l.name)! } : l))
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
// count view is now the "Head Count" tab there, and /academic/batch-summary
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

// The four Timetable screens (timetable-page.md / isbat_tt_v2.html), for
// mockMenu. /academic/timetable is the Schedule screen; the three views are
// siblings.
function TIMETABLE_LEAVES(): MenuNode[] {
  return [
    leaf('Schedule Timetable', 'calendar', '/academic/timetable'),
    leaf('Lecturer View', 'user', '/academic/timetable-lecturer'),
    leaf('Batch View', 'users', '/academic/timetable-batch'),
    leaf('Time Slot Audit', 'alarm-clock', '/academic/timetable-slot-audit'),
  ]
}

// The backend names the Schedule screen "Timetable"; the design calls it
// "Schedule Timetable". Rename only — the view screens appear once /me/menu
// returns them.
function renameTimetable(menu: MenuNode[]): MenuNode[] {
  const isTtUrl = (url: string | null) => url === 'timetable' || url === '/academic/timetable'
  return menu.map(mod => {
    if (mod.name !== 'Academic') return mod
    return {
      ...mod,
      children: mod.children.map(sec => ({
        ...sec,
        children: sec.children.map(l => (isTtUrl(l.url) && l.name === 'Timetable' ? { ...l, name: 'Schedule Timetable' } : l)),
      })),
    }
  })
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

function stripUnintegratedPages(menu: MenuNode[]): MenuNode[] {
  const hiddenUrls = [
    '/assessment/resit-calendar',
    '/assessment/resit-seating',
    '/assessment/reeval',
    '/assessment/recheck',
    // Hidden from the sidebar per request, 2026-10-15 — pages still exist.
    '/assessment/weight-config',
    '/assessment/schedule',
    '/assessment/service-tickets',
  ]
  // The real /me/menu may send bare slugs ("weight-config"), so match on
  // the last path segment too.
  const hiddenSlugs = hiddenUrls.map(u => u.slice(u.lastIndexOf('/') + 1))
  const isHidden = (url: string | null) => !!url && (hiddenUrls.includes(url) || hiddenSlugs.includes(url))

  const assessIdx = menu.findIndex(n => n.name === 'Assessment')
  if (assessIdx === -1) return menu

  const assessModule = menu[assessIdx]
  let changed = false
  const sections = assessModule.children.flatMap(s => {
    const kept = s.children.filter(l => !isHidden(l.url))
    if (kept.length === s.children.length) return [s]
    changed = true
    // Sidebar.tsx renders a childless section as a disabled "Soon" item, so
    // drop a section this emptied.
    return kept.length ? [{ ...s, children: kept }] : []
  })

  if (!changed) return menu

  const mergedAssess = { ...assessModule, children: sections }
  const mergedMenu = [...menu]
  mergedMenu[assessIdx] = mergedAssess
  return mergedMenu
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
    const pages = flattenMenuPages(stripUnintegratedPages(stripLectureMaster(renameIaCreation(mockMenu))))
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
  return menuCatalog().pages.get(pathname.replace(/\/+$/, '') || '/')
}

// Whether the user's own (RBAC-filtered) menu lets them open `pathname`.
// Denied: anything under a module missing from their menu, and any known
// menu page that their menu leaves out or marks `get: false`. Routes that
// aren't menu items (profile, detail pages like /student/profile, dashboards
// not in the catalog) are allowed — the backend still authorizes each call.
export function isRouteAllowed(menu: MenuNode[], pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  const catalog = menuCatalog()
  const moduleSeg = path.split('/')[1]
  if (!catalog.modules.has(moduleSeg)) return true

  const pages = flattenMenuPages(menu)
  if (!pages.some(p => p.url.split('/')[1] === moduleSeg)) return false
  if (!catalog.pages.has(path)) return true

  const permissions = findLeafPermissions(menu, path)
  return permissions !== undefined && permissions?.get !== false
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

function renameIaCreation(menu: MenuNode[]): MenuNode[] {
  return menu.map(mod => {
    if (mod.name !== 'Assessment') return mod
    return {
      ...mod,
      children: mod.children.map(sec => ({
        ...sec,
        children: sec.children.map(leafNode => {
          if (
            leafNode.name === 'IA Creation' ||
            leafNode.url === '/assessment/ia-creation' ||
            leafNode.url === 'ia-creation'
          ) {
            return { ...leafNode, name: 'Assessment Scheduler' }
          }
          return leafNode
        }),
      })),
    }
  })
}

// A failed /me/menu call rejects (no fallback menu): the sidebar shows its
// "Couldn't load menu" state, RouteGuard blocks the page and
// usePagePermissions grants nothing, until the user retries.
export function getMenu(): Promise<MenuResult> {
  if (MOCK_MENU) return Promise.resolve({ menu: stripUnintegratedPages(stripLectureMaster(renameIaCreation(mockMenu))) })
  return apiGet<MenuNode[] | null>('/api/v1/users/me/menu')
    .then(data => {
      // Taken as-is apart from the remove/rename steps — see the note above
      // cleanStudentSections.
      const menu = removeBatchSummary(cleanStudentSections(data ?? []))
      const finalMenu = stripUnintegratedPages(stripLectureMaster(renameIaCreation(renameTimetable(menu))))
      return { menu: finalMenu }
    })
}
