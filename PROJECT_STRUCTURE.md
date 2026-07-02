# ISBAT ERP — Project Structure Reference

**Stack:** Next.js 15 App Router · React 18 · TypeScript · Tailwind CSS 3 · `@tanstack/react-query` · `zod` · `jose`
**Purpose:** UI-first design prototype. All data is hard-coded mock data; no real API calls.

---

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run type-check # tsc --noEmit
```

No test framework.

---

## Route Map

```
/                                  → redirects to /login

/login                             → portal selector (Staff vs Student)
/login/staff                       → staff ID + password
/login/student                     → student ID + password
/login/otp                         → OTP verification (shared)
/login/forgot                      → forgot password flow
/login/activate                    → new staff account activation
/login/expired                     → expired session landing

/admission                         → admission dashboard / pipeline
/admission/enquiry-form            → manual enquiry form
/admission/online-enquiry          → online enquiry list
/admission/kiosk-enquiry           → kiosk enquiry list
/admission/ondesk-enquiry          → on-desk enquiry list
/admission/filing                  → document filing
/admission/payment                 → payment tracking

/academic/*                        → protected academic module (layout shell)
/academic/acad-dashboard           → academic dashboard
/academic/intake-master            → intake management
/academic/faculty-master           → faculty records
/academic/lecturer-master          → lecturer records
/academic/skill-master             → skill/competency tags
/academic/batch-management        → batch setup & editing
/academic/session-movement         → session movement / repeat
/academic/course-units             → course unit builder (2-step modal)
/academic/a-level-master           → programme level (A-Level) master
/academic/programme-group          → programme groups
/academic/programme-master         → programme builder (multi-step modal)
/academic/fee-structure            → fee structure & items
/academic/timetable                → timetable slots
/academic/allocation               → timetable allocation
/academic/campus-master            → campus records
/academic/country-master           → country master
/academic/currency-master          → currency master
/academic/room-management          → room/venue management
/academic/repetition-tag           → repetition tag master
/academic/odl-applications         → ODL applications (read-only)
/academic/odl-reconciliation       → ODL reconciliation (read-only)
/academic/student-lookup           → student lookup (read-only)
/academic/results                  → results (read-only)
/academic/class-test               → class test (read-only)
/academic/coursework               → coursework (read-only)
/academic/university-exam          → university exam (read-only)
/academic/fee-clearance            → fee clearance (read-only)
/academic/grievance                → grievance (read-only)
/academic/qual-equating            → qualification equating (read-only)
/academic/access-gate              → access gate (read-only)
/academic/odel-student-preview     → ODL student preview (read-only)
```

---

## src/ Directory Layout

```
src/
├── app/
│   ├── layout.tsx              # root layout — loads LineIcons CDN, Google Fonts
│   ├── globals.css             # ENTIRE design system: CSS tokens, utility classes
│   ├── page.tsx                # root → redirect to /login
│   ├── login/
│   │   ├── page.tsx            # portal selector
│   │   ├── staff/page.tsx
│   │   ├── student/page.tsx
│   │   ├── otp/page.tsx
│   │   ├── forgot/page.tsx
│   │   ├── activate/page.tsx
│   │   └── expired/page.tsx
│   ├── admission/
│   │   ├── page.tsx            # admission pipeline
│   │   ├── enquiry-form/page.tsx
│   │   ├── online-enquiry/page.tsx
│   │   ├── kiosk-enquiry/page.tsx
│   │   ├── ondesk-enquiry/page.tsx
│   │   ├── filing/page.tsx
│   │   └── payment/page.tsx
│   └── academic/
│       ├── layout.tsx          # shell: owns sidebar panel/collapse state
│       ├── page.tsx            # redirect to /academic/acad-dashboard
│       ├── acad-dashboard/page.tsx
│       ├── intake-master/page.tsx
│       ├── faculty-master/page.tsx
│       ├── lecturer-master/page.tsx
│       ├── skill-master/page.tsx
│       ├── batch-management/page.tsx
│       ├── session-movement/page.tsx
│       ├── course-units/page.tsx       ← CourseUnitModal + EditCourseUnitModal + ElectiveSelectModal
│       ├── a-level-master/page.tsx     ← ProgrammeLevelModal
│       ├── programme-group/page.tsx    ← ProgrammeGroupModal + SpecializationModal
│       ├── programme-master/page.tsx   ← ProgrammeModal (multi-step)
│       ├── fee-structure/page.tsx      ← FeeStructureModal + FeeItemModal
│       ├── timetable/page.tsx          ← AddSlotModal + TtImportModal
│       ├── allocation/page.tsx         ← AllocImportModal
│       ├── campus-master/page.tsx      ← NewCampusModal + EditCampusModal
│       ├── country-master/page.tsx     ← NewCountryModal + EditCountryModal
│       ├── currency-master/page.tsx    ← NewCurrencyModal + EditCurrencyModal
│       ├── room-management/page.tsx    ← NewRoomModal + EditRoomModal + RoomMgmtModal
│       ├── repetition-tag/page.tsx     ← NewRepTagModal + EditRepTagModal
│       ├── [read-only pages…]
│       └── …
├── components/
│   ├── Header.tsx              # fixed top bar with profile dropdown
│   ├── Sidebar.tsx             # two-level: rail (module icons) + panel (nav items)
│   ├── Toast.tsx               # auto-dismiss toast (page controls timeout)
│   ├── ScrollTable.tsx         # <table> wrapper with scroll arrows
│   ├── ActionMenu.tsx          # fixed-position dropdown "Actions" button
│   ├── SearchSelect.tsx        # searchable <select> replacement
│   ├── FilterTh.tsx            # sortable/filterable table header cell
│   ├── EmptyState.tsx          # empty table placeholder
│   ├── OtpInput.tsx            # 6-digit OTP input (login flow)
│   ├── StrengthBar.tsx         # password strength indicator
│   ├── Stepper.tsx             # step progress indicator (login flows)
│   ├── SuccessScreen.tsx       # full-screen success state (login flows)
│   ├── PortalCard.tsx          # portal selector card
│   ├── PolicyFooter.tsx        # policy links footer
│   ├── HeroA.tsx               # login hero panel
│   ├── PanelA.tsx              # login side panel
│   ├── LiveStatsRotator.tsx    # animated stats ticker (login hero)
│   ├── MethodPill.tsx          # OTP method pill (Email / SMS)
│   ├── Icon.tsx                # icon wrapper
│   └── modals/
│       ├── types.ts            # ModalProps interface
│       ├── academic/
│       │   ├── SuccessPopup.tsx            # shared success state inside modals
│       │   ├── CourseUnitModal.tsx         # Add Course Unit (2-step: details + outline)
│       │   ├── EditCourseUnitModal.tsx     # Edit Course Unit
│       │   ├── ElectiveSelectModal.tsx     # select elective paper for a batch
│       │   ├── ProgrammeModal.tsx          # Add Programme (multi-step)
│       │   ├── ProgrammeLevelModal.tsx     # Add/Edit Programme Level (A-Level)
│       │   ├── ProgrammeGroupModal.tsx     # Add/Edit Programme Group
│       │   ├── SpecializationModal.tsx     # Add Specialization under a group
│       │   ├── FeeStructureModal.tsx       # Add/Edit Fee Structure
│       │   ├── FeeItemModal.tsx            # Add Fee Item to a structure
│       │   ├── NewBatchModal.tsx           # Add Batch
│       │   ├── EditBatchModal.tsx          # Edit Batch
│       │   ├── NewFacultyModal.tsx         # Add Faculty
│       │   ├── EditFacultyModal.tsx        # Edit Faculty
│       │   ├── NewLecturerModal.tsx        # Add Lecturer
│       │   ├── EditLecturerModal.tsx       # Edit Lecturer
│       │   ├── NewIntakeModal.tsx          # Add Intake
│       │   ├── EditIntakeModal.tsx         # Edit Intake
│       │   ├── NewCampusModal.tsx          # Add Campus
│       │   ├── EditCampusModal.tsx         # Edit Campus
│       │   ├── NewCountryModal.tsx         # Add Country
│       │   ├── EditCountryModal.tsx        # Edit Country
│       │   ├── NewCurrencyModal.tsx        # Add Currency
│       │   ├── EditCurrencyModal.tsx       # Edit Currency
│       │   ├── NewRoomModal.tsx            # Add Room
│       │   ├── EditRoomModal.tsx           # Edit Room
│       │   ├── RoomMgmtModal.tsx           # Room management detail view
│       │   ├── NewRepTagModal.tsx          # Add Repetition Tag
│       │   ├── EditRepTagModal.tsx         # Edit Repetition Tag
│       │   ├── AddSkillModal.tsx           # Add Skill
│       │   ├── AddSlotModal.tsx            # Add Timetable Slot
│       │   ├── TtImportModal.tsx           # Import Timetable
│       │   ├── AllocImportModal.tsx        # Import Allocation
│       │   └── ConfirmMovementModal.tsx    # Confirm session movement
│       └── admission/
│           ├── EnquiryFormModal.tsx        # enquiry form
│           ├── StudentProfileModal.tsx     # student profile view
│           ├── ImportSourceModal.tsx       # import source selector
│           ├── RejectModal.tsx             # reject application
│           └── OnboardModal.tsx            # onboard student
└── lib/
    ├── auth.ts                 # all auth API calls; mock when NEXT_PUBLIC_AUTH_MOCK=true
    ├── session.ts              # login flow state in sessionStorage (key: isbat_login_flow)
    └── errorMessages.ts        # ID/password validation rules
```

---

## Key Patterns

### Page pattern (all academic/admission pages)
```tsx
const [openModals, setOpenModals] = useState<Set<string>>(new Set())
const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
// ...
<Toast toast={toast} />
{openModals.has('some-modal') && <SomeModal isOpen onClose={() => closeModal('some-modal')} showToast={showToast} />}
```

### Modal pattern (`src/components/modals/types.ts`)
```ts
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  nav?: (id: string) => void
}
```
- Return `null` when `!isOpen`
- `.modal-overlay` click closes; `e.stopPropagation()` on `.modal` prevents bubble
- Multi-step modals use `useState(1)` for step tracking
- Success state renders `<SuccessPopup>` instead of form content

### Number inputs — use `string` state, not `number`
Controlled number inputs must use `string` state (e.g. `useState('25')`) so backspace works correctly.
`+e.target.value` coerces `""` to `0` and prevents clearing the field.
Parse with `+value || 0` only at computation time.

---

## Design System (`src/app/globals.css`)

Prefer custom CSS classes over Tailwind utilities.

| Token group | Examples |
|---|---|
| Greys | `--g100` … `--g900` |
| Blues (primary) | `--b50` … `--b900` |
| Semantic colours | `--green`, `--amber`, `--red`, `--cyan`, `--gold`, `--purple` (each has `-bg` / `-bd` variants) |
| Neumorphic shadows | `--neu-out`, `--neu-in`, `--neu-sm` |
| Radii | `--radius` (14px), `--rsm` (10px), `--rxs` (7px) |
| Sidebar dims | `--rail-w` (66px), `--panel-w` (228px) |
| Font sizes | `--fs-2xs`, `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-lg`, `--fs-xl`, `--fs-2xl` |

Key utility classes: `.btn`, `.btn-primary`, `.btn-neu`, `.btn-danger`, `.btn-amber`, `.btn-sm`, `.card`, `.pg-hdr`, `.sb-item`, `.modal`, `.modal-overlay`, `.modal-hdr`, `.modal-footer`, `.modal-scroll`, `.modal-80`, `.modal-flex`, `.mdl-section`, `.mdl-section--blue/amber/green`, `.mdl-section-hdr`, `.badge-*`, `.ctrl`, `.lbl`, `.fg`, `.g3`, `.req`, `.prog-step`, `.prog-steps`, `.file-zone`, `.wt-input`

Tailwind config maps all CSS variables to Tailwind names (`bg-b500`, `text-g400`, `bg-clr-green-bg`, etc.).

---

## Icons & Fonts

- **Icons:** LineIcons 4.0 from CDN — `<i className="lni lni-{name}"></i>`
- **Fonts (CSS vars):** `--font-serif` (Source Serif 4) · `--font-sans` (Inter Tight) · `--font-mono` (JetBrains Mono)

---

## Auth & Mock Credentials

`NEXT_PUBLIC_AUTH_MOCK=true` skips all API calls.

| Role | ID | Password | OTP |
|---|---|---|---|
| Staff | `AR-2024-0001` | `Admin@1234` | `123456` |
| Student | `ISB/2024/BSCS/0142` | `Student@1234` | `123456` |

Login flow state lives in `sessionStorage` under key `isbat_login_flow` (see `src/lib/session.ts`).

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL for API calls (empty = relative paths in dev) |
| `NEXT_PUBLIC_AUTH_MOCK` | `"true"` → skip real API, use hardcoded mock responses |
