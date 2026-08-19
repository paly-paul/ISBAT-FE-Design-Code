// The notifications API isn't built yet — there's no lib/api file pattern to
// follow here (no MOCK_AUTH branch, no real endpoint at all). This is
// intentionally 100% mock data until a real GET /api/v1/.../notifications
// (and mark-read) endpoint exists to swap in. The shape below matches the
// sample response payload exactly as given, field for field.
export interface NotificationItem {
  notificationGuid: string
  typeCode: string
  title: string
  body: string
  entityType: string
  entityGuid: string
  // Bare route slug, same convention as the menu API's own `url` field (see
  // Sidebar.tsx's resolveHref) — resolved against its entityType's module
  // below, not used as a path on its own.
  pageUrl: string
  isRead: boolean
  createdDate: string
}

// Maps a notification's entityType to the module segment its pageUrl slug
// lives under, so e.g. entityType "Enquiry" + pageUrl "enquiry-followup"
// resolves to /admission/enquiry-followup. Falls back to 'academic' for any
// entityType not listed here.
const MODULE_FOR_ENTITY: Record<string, string> = {
  Enquiry: 'admission',
  Applicant: 'admission',
  Application: 'admission',
  Payment: 'finance',
  AdvancedPayment: 'finance',
  Employee: 'employee',
  Intake: 'academic',
  Room: 'academic',
  Batch: 'academic',
  CourseUnit: 'academic',
  ProgramApproval: 'academic',
  FeeStructure: 'academic',
  Timetable: 'academic',
}

export function notificationHref(n: NotificationItem): string {
  const module = MODULE_FOR_ENTITY[n.entityType] ?? 'academic'
  return `/${module}/${n.pageUrl}`
}

// typeCode isn't a confirmed closed set (the sample only shows
// ENQUIRY_CREATED) — this maps the ones the mock data below uses, with a
// sane default for anything else so an unrecognized future typeCode doesn't
// break rendering, just falls back to a plain bell/info dot. Shared between
// the notifications page and the header bell's hover preview so both read
// the same icon/color for a given notification.
const TYPE_VISUAL: Record<string, { icon: string; tone: string }> = {
  ENQUIRY_CREATED: { icon: 'lni-user', tone: 'tone-blue' },
  PAYMENT_RECEIVED: { icon: 'lni-dollar', tone: 'tone-green' },
  ROOM_CONFLICT: { icon: 'lni-warning', tone: 'tone-red' },
  PROGRAM_APPROVED: { icon: 'lni-checkmark-circle', tone: 'tone-green' },
  BATCH_ALLOCATION_GAP: { icon: 'lni-warning', tone: 'tone-amber' },
  FEE_STRUCTURE_UPDATED: { icon: 'lni-coin', tone: 'tone-purple' },
  INTAKE_UPDATED: { icon: 'lni-calendar', tone: 'tone-blue' },
  COURSE_UNIT_UPDATED: { icon: 'lni-book', tone: 'tone-blue' },
  ODL_PAYMENT_PENDING: { icon: 'lni-timer', tone: 'tone-amber' },
  EMPLOYEE_ONBOARDED: { icon: 'lni-briefcase', tone: 'tone-purple' },
  TIMETABLE_DRAFT: { icon: 'lni-calendar', tone: 'tone-amber' },
}
const DEFAULT_VISUAL = { icon: 'lni-alarm', tone: 'tone-blue' }

export function notificationVisual(typeCode: string): { icon: string; tone: string } {
  return TYPE_VISUAL[typeCode] ?? DEFAULT_VISUAL
}

// Minutes-ago offsets are resolved against real wall-clock time at import,
// not hardcoded ISO strings, so timeAgo() (src/lib/date.ts) always reads
// sensibly ("5m ago", "2h ago", ...) no matter when this actually runs.
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

const mockNotifications: NotificationItem[] = [
  {
    notificationGuid: 'abb31130-93cc-41bf-9bef-3a365a1c1610',
    typeCode: 'ENQUIRY_CREATED',
    title: 'New enquiry: Peter Parker',
    body: 'Source: Direct',
    entityType: 'Enquiry',
    entityGuid: '45b5816b-6c31-4bcb-9a1b-a4960252ef35',
    pageUrl: 'enquiry-followup',
    isRead: false,
    createdDate: minutesAgo(8),
  },
  {
    notificationGuid: 'f3c7a2e1-4b8d-4a6f-9e2c-1d5b7a9c3e60',
    typeCode: 'PAYMENT_RECEIVED',
    title: 'Payment received: UGX 1,200,000',
    body: 'Application fee — ISB/2026/BSCS/0231',
    entityType: 'Payment',
    entityGuid: '7c2e4f18-9a3b-4d5e-8f1a-2b6c8d0e4f72',
    pageUrl: 'payment-history',
    isRead: false,
    createdDate: minutesAgo(47),
  },
  {
    notificationGuid: '9d4e6b12-3a5c-47f8-b2d1-6e8f0a2c4b91',
    typeCode: 'ROOM_CONFLICT',
    title: 'Room clash detected: LR-204',
    body: 'Two timetable entries overlap on Monday, Slot 3',
    entityType: 'Room',
    entityGuid: 'e1a3c5b7-9d2f-4e6a-8c0b-1f3d5e7a9c2b',
    pageUrl: 'timetable',
    isRead: false,
    createdDate: minutesAgo(3 * 60 + 15),
  },
  {
    notificationGuid: '2b6d8f0a-1c3e-45b7-9a1d-3e5f7a9c1b0d',
    typeCode: 'PROGRAM_APPROVED',
    title: 'Programme approved: BSc. Software Engineering',
    body: 'Approved by Academic Registrar',
    entityType: 'ProgramApproval',
    entityGuid: '4c6e8a0b-2d4f-46a8-8b0c-2d4e6a8c0b1e',
    pageUrl: 'programme-approval',
    isRead: true,
    createdDate: minutesAgo(6 * 60 + 40),
  },
  {
    notificationGuid: 'a1c3e5f7-9b2d-4a6c-8e0a-1c3e5a7c9b1d',
    typeCode: 'ENQUIRY_CREATED',
    title: 'New enquiry: Mary Jane Watson',
    body: 'Source: Facebook Campaign',
    entityType: 'Enquiry',
    entityGuid: '6e8a0c2e-4a6c-48a0-8c2e-4a6c8e0a2c4e',
    pageUrl: 'enquiry-followup',
    isRead: true,
    createdDate: minutesAgo(9 * 60),
  },
  {
    notificationGuid: 'c3e5a7c9-1b3d-4e6a-8c0e-2a4c6e8a0c2e',
    typeCode: 'BATCH_ALLOCATION_GAP',
    title: 'Allocation gap — BBA Sem 3',
    body: '3 course units still unallocated · HOD action needed',
    entityType: 'Batch',
    entityGuid: '8a0c2e4a-6c8e-4a0c-8e2a-4c6e8a0c2e4a',
    pageUrl: 'batch-management',
    isRead: false,
    createdDate: minutesAgo(24 * 60 + 30),
  },
  {
    notificationGuid: 'e5a7c9e1-3d5f-4a7c-9e1a-3c5e7a9c1e3d',
    typeCode: 'FEE_STRUCTURE_UPDATED',
    title: 'Fee structure updated — BSc. IT 2026',
    body: 'Semester 1 tuition ledger revised',
    entityType: 'FeeStructure',
    entityGuid: 'a7c9e1a3-5f7a-4c9e-a1c3-5e7a9c1e3d5f',
    pageUrl: 'fee-structure',
    isRead: true,
    createdDate: minutesAgo(30 * 60),
  },
  {
    notificationGuid: '0c2e4a6c-8e0a-42c4-a6c8-e0a2c4a6c8e0',
    typeCode: 'INTAKE_UPDATED',
    title: 'Intake calendar updated — Fall 2026',
    body: 'Admission end date moved to 30 Sep 2026',
    entityType: 'Intake',
    entityGuid: 'c9e1a3c5-7a9c-4e1a-83c5-7a9c1e3d5f7a',
    pageUrl: 'intake-master',
    isRead: true,
    createdDate: minutesAgo(2 * 24 * 60 + 45),
  },
  {
    notificationGuid: '2e4a6c8e-0a2c-44a6-c8e0-a2c4a6c8e0a2',
    typeCode: 'ENQUIRY_CREATED',
    title: 'New enquiry: Harry Osborn',
    body: 'Source: Walk-in',
    entityType: 'Enquiry',
    entityGuid: 'e1a3c5e7-9a1c-4e3a-85c7-9a1c3e5a7c9e',
    pageUrl: 'enquiry-followup',
    isRead: true,
    createdDate: minutesAgo(3 * 24 * 60 + 10),
  },
  {
    notificationGuid: '4a6c8e0a-2c4a-46c8-e0a2-c4a6c8e0a2c4',
    typeCode: 'PAYMENT_RECEIVED',
    title: 'Payment received: UGX 3,450,000',
    body: 'Semester 1 tuition — ISB/2026/BBA/0089',
    entityType: 'Payment',
    entityGuid: 'a3c5e7a9-1c3e-45a7-89c1-3e5a7c9e1a3c',
    pageUrl: 'payment-history',
    isRead: true,
    createdDate: minutesAgo(4 * 24 * 60 + 5),
  },
  {
    notificationGuid: '6c8e0a2c-4a6c-48e0-a2c4-a6c8e0a2c4a6',
    typeCode: 'COURSE_UNIT_UPDATED',
    title: 'Course units confirmed — BBA Programme',
    body: '18 units confirmed for Spring 2026',
    entityType: 'CourseUnit',
    entityGuid: 'c5e7a9c1-3e5a-47c9-a1e3-5a7c9e1a3c5e',
    pageUrl: 'course-units',
    isRead: true,
    createdDate: minutesAgo(4 * 24 * 60 + 40),
  },
  {
    notificationGuid: '8e0a2c4a-6c8e-40a2-c4a6-c8e0a2c4a6c8',
    typeCode: 'ODL_PAYMENT_PENDING',
    title: 'ODL payments pending reconciliation',
    body: '4 applications awaiting accounts review',
    entityType: 'Payment',
    entityGuid: 'e7a9c1e3-5a7c-49e1-a3c5-7a9c1e3a5c7a',
    pageUrl: 'odl-reconciliation',
    isRead: false,
    createdDate: minutesAgo(5 * 24 * 60 + 20),
  },
  {
    notificationGuid: '0a2c4a6c-8e0a-42c4-a6c8-e0a2c4a6c8e0',
    typeCode: 'EMPLOYEE_ONBOARDED',
    title: 'New employee onboarded: Grace Namuli',
    body: 'Lecturer — Faculty of Computing & Technology',
    entityType: 'Employee',
    entityGuid: 'a9c1e3a5-7c9e-41a3-c5e7-a9c1e3a5c7a9',
    pageUrl: 'employee-master',
    isRead: true,
    createdDate: minutesAgo(6 * 24 * 60),
  },
  {
    notificationGuid: '2c4a6c8e-0a2c-44a6-c8e0-a2c4a6c8e0a2',
    typeCode: 'TIMETABLE_DRAFT',
    title: 'Timetable draft ready — IT Sem 1',
    body: 'Awaiting final HOD approval',
    entityType: 'Timetable',
    entityGuid: 'c1e3a5c7-9e1a-43c5-e7a9-c1e3a5c7a9e1',
    pageUrl: 'timetable',
    isRead: true,
    createdDate: minutesAgo(7 * 24 * 60 + 15),
  },
]

// Sorted newest-first — the sample doesn't confirm server-side ordering, but
// a notification feed reading oldest-first would be unusable, so this is
// sorted defensively on the mock side rather than assumed of a future API.
export function getNotifications(): Promise<NotificationItem[]> {
  return Promise.resolve(
    [...mockNotifications].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
  )
}

export function markNotificationRead(guid: string): Promise<boolean> {
  const n = mockNotifications.find(x => x.notificationGuid === guid)
  if (n) n.isRead = true
  return Promise.resolve(true)
}

export function markAllNotificationsRead(): Promise<boolean> {
  mockNotifications.forEach(n => { n.isRead = true })
  return Promise.resolve(true)
}

// There's no live push feed yet (no WebSocket/SignalR, no real endpoint at
// all — see the top-of-file note), so the "new notification just arrived"
// slide-in toast (NotificationToastHost) has nothing to react to on its own.
// This simulates one arriving every so often, purely so that UI is
// demonstrable. Swap it out (and NotificationToastHost's interval that
// calls it) for a real push subscription once the backend has one — nothing
// else about the toast reads from here specifically.
const SIMULATED_TEMPLATES: Omit<NotificationItem, 'notificationGuid' | 'createdDate' | 'isRead'>[] = [
  { typeCode: 'ENQUIRY_CREATED', title: 'New enquiry: Gwen Stacy', body: 'Source: Instagram Campaign', entityType: 'Enquiry', entityGuid: '45b5816b-6c31-4bcb-9a1b-a4960252ef35', pageUrl: 'enquiry-followup' },
  { typeCode: 'PAYMENT_RECEIVED', title: 'Payment received: UGX 850,000', body: 'Application fee — ISB/2026/BBA/0312', entityType: 'Payment', entityGuid: '7c2e4f18-9a3b-4d5e-8f1a-2b6c8d0e4f72', pageUrl: 'payment-history' },
  { typeCode: 'ROOM_CONFLICT', title: 'Room clash detected: LR-118', body: 'Two timetable entries overlap on Wednesday, Slot 2', entityType: 'Room', entityGuid: 'e1a3c5b7-9d2f-4e6a-8c0b-1f3d5e7a9c2b', pageUrl: 'timetable' },
  { typeCode: 'BATCH_ALLOCATION_GAP', title: 'Allocation gap — BSc. IT Sem 2', body: '2 course units still unallocated · HOD action needed', entityType: 'Batch', entityGuid: '8a0c2e4a-6c8e-4a0c-8e2a-4c6e8a0c2e4a', pageUrl: 'batch-management' },
]
let simulatedIndex = 0

export function pushSimulatedNotification(): NotificationItem {
  const template = SIMULATED_TEMPLATES[simulatedIndex % SIMULATED_TEMPLATES.length]
  simulatedIndex++
  const notification: NotificationItem = {
    ...template,
    notificationGuid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    isRead: false,
    createdDate: new Date().toISOString(),
  }
  mockNotifications.unshift(notification)
  return notification
}
