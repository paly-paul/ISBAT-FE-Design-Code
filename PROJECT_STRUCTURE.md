# ISBAT ERP — Project Structure Reference

**Stack:** Next.js 15 App Router · React 18 · TypeScript · Tailwind CSS 3 · `@tanstack/react-query` · `zod` · `jose`
**Purpose:** UI-first design prototype. Auth (login/refresh/logout) can hit the real .NET backend (`NEXT_PUBLIC_AUTH_MOCK=false`) via httpOnly cookies; the academic domain modules (masters, etc.) are still hard-coded mock data pending backend endpoints.

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
/academic/faculty-master           → faculty records                    ← real hook layer
/academic/lecturer-master          → lecturer records
/academic/skill-master             → skill/competency tags (batch/curriculum)
/academic/skill                    → skill master (lecturer subject skills) ← real hook layer
/academic/batch-management        → batch setup & editing
/academic/session-movement         → session movement / repeat
/academic/course-units             → course unit builder (2-step modal)
/academic/a-level-master           → programme level (A-Level) master
/academic/programme-group          → programme groups
/academic/programme-master         → programme builder (multi-step modal)
/academic/fee-structure            → fee structure & items
/academic/timetable                → timetable slots
/academic/allocation                → timetable allocation
/academic/campus-master            → campus records                     ← real hook layer
/academic/country-master           → country master                    ← real hook layer
/academic/currency-master          → currency master                   ← real hook layer
/academic/stream-master            → specialization/stream master       ← real hook layer
/academic/designation-master       → designation master                ← real hook layer
/academic/department-master        → department master                 ← real hook layer
/academic/permission-master        → permission group master (wizard)   ← real hook layer
/academic/ledger                   → ledger master                     ← real hook layer
/academic/room-management          → room/venue management
/academic/repetition-tag           → repetition tag master
/academic/odl-applications         → ODL applications (read-only)
/academic/odl-reconciliation       → ODL reconciliation (read-only)
/academic/student-lookup           → student lookup (read-only)
/academic/results                  → results (read-only)
/academic/class-test               → class test (read-only)
/academic/coursework                → coursework (read-only)
/academic/university-exam          → university exam (read-only)
/academic/fee-clearance            → fee clearance (read-only)
/academic/grievance                → grievance (read-only)
/academic/qual-equating            → qualification equating (read-only)
/academic/access-gate               → access gate (read-only)
/academic/odel-student-preview     → ODL student preview (read-only)
```

`← real hook layer` = migrated off inline hardcoded arrays onto the `src/lib/api/academic/*` + `src/hooks/academic/*` pattern described below (list, create, and edit all go through a react-query hook backed by an in-memory mock store). All other academic pages still hardcode their row data directly in `page.tsx`.

---

## src/ Directory Layout

```
src/
├── app/
│   ├── layout.tsx              # root layout — Providers, LineIcons CDN, Google Fonts
│   ├── providers.tsx           # QueryClientProvider (single QueryClient via useState)
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
│       ├── layout.tsx          # shell: sidebar panel/collapse state + session check (see Auth section)
│       ├── page.tsx            # redirect to /academic/acad-dashboard
│       ├── acad-dashboard/page.tsx
│       ├── intake-master/page.tsx
│       ├── faculty-master/page.tsx     ← uses useFaculties/useCreateFaculty/useUpdateFaculty
│       ├── lecturer-master/page.tsx
│       ├── skill-master/page.tsx
│       ├── skill/page.tsx              ← uses useSkills/useCreateSkill/useUpdateSkill
│       ├── batch-management/page.tsx
│       ├── session-movement/page.tsx
│       ├── course-units/page.tsx       ← CourseUnitModal + EditCourseUnitModal + ElectiveSelectModal
│       ├── a-level-master/page.tsx     ← ProgrammeLevelModal
│       ├── programme-group/page.tsx    ← ProgrammeGroupModal + SpecializationModal
│       ├── programme-master/page.tsx   ← ProgrammeModal (multi-step)
│       ├── fee-structure/page.tsx      ← FeeStructureModal + FeeItemModal
│       ├── timetable/page.tsx          ← AddSlotModal + TtImportModal
│       ├── allocation/page.tsx         ← AllocImportModal
│       ├── campus-master/page.tsx      ← uses useCampuses/useCreateCampus/useUpdateCampus
│       ├── country-master/page.tsx     ← uses useCountries/useCreateCountry/useUpdateCountry
│       ├── currency-master/page.tsx    ← uses useCurrencies/useCreateCurrency/useUpdateCurrency
│       ├── stream-master/page.tsx      ← uses useStreams/useCreateStream/useUpdateStream
│       ├── designation-master/page.tsx ← uses useDesignations/useCreateDesignation/useUpdateDesignation
│       ├── department-master/page.tsx  ← uses useDepartments/useCreateDepartment/useUpdateDepartment
│       ├── permission-master/page.tsx  ← uses usePermissionGroups/useCreatePermissionGroup/useUpdatePermissionGroup
│       ├── ledger/page.tsx             ← uses useLedgers/useCreateLedger/useUpdateLedger
│       ├── room-management/page.tsx    ← NewRoomModal + EditRoomModal + RoomMgmtModal
│       ├── repetition-tag/page.tsx     ← NewRepTagModal + EditRepTagModal
│       ├── [read-only pages…]
│       └── …
├── components/
│   ├── Header.tsx              # fixed top bar; sign-out clears session identity (src/lib/session.ts)
│   ├── Sidebar.tsx             # two-level: rail (module icons) + panel (nav items)
│   │                           #   All 10 "real hook layer" master pages live under the
│   │                           #   'config' rail → 'Core Configuration' section.
│   ├── Toast.tsx               # auto-dismiss toast (page controls timeout)
│   ├── ScrollTable.tsx         # <table> wrapper with scroll arrows
│   ├── ActionMenu.tsx          # fixed-position dropdown "Actions" button
│   ├── SearchSelect.tsx        # searchable <select> replacement (supports controlled value/onChange)
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
│       ├── types.ts            # ModalProps interface (shared shape; migrated modals add extra props, see below)
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
│       │   ├── NewFacultyModal.tsx / EditFacultyModal.tsx           # real mutation (createFaculty/updateFaculty)
│       │   ├── NewLecturerModal.tsx        # Add Lecturer
│       │   ├── EditLecturerModal.tsx       # Edit Lecturer
│       │   ├── NewIntakeModal.tsx          # Add Intake
│       │   ├── EditIntakeModal.tsx         # Edit Intake
│       │   ├── NewCampusModal.tsx / EditCampusModal.tsx             # real mutation (createCampus/updateCampus)
│       │   ├── NewCountryModal.tsx / EditCountryModal.tsx           # real mutation (createCountry/updateCountry)
│       │   ├── NewCurrencyModal.tsx / EditCurrencyModal.tsx         # real mutation (createCurrency/updateCurrency)
│       │   ├── NewStreamModal.tsx / EditStreamModal.tsx             # real mutation (createStream/updateStream)
│       │   ├── NewDesignationModal.tsx / EditDesignationModal.tsx   # real mutation (createDesignation/updateDesignation)
│       │   ├── NewDepartmentModal.tsx / EditDepartmentModal.tsx     # real mutation (createDepartment/updateDepartment)
│       │   ├── NewPermissionModal.tsx / EditPermissionModal.tsx     # real mutation; wizard seeds from actual row's permissions
│       │   ├── NewLedgerModal.tsx / EditLedgerModal.tsx             # real mutation (createLedger/updateLedger)
│       │   ├── NewSkillModal.tsx / EditSkillModal.tsx               # real mutation (createSkill/updateSkill)
│       │   ├── NewRoomModal.tsx            # Add Room
│       │   ├── EditRoomModal.tsx           # Edit Room
│       │   ├── RoomMgmtModal.tsx           # Room management detail view
│       │   ├── NewRepTagModal.tsx          # Add Repetition Tag
│       │   ├── EditRepTagModal.tsx         # Edit Repetition Tag
│       │   ├── AddSkillModal.tsx           # Add Skill (role-aware: lecturer vs dean) — unrelated to skill/page.tsx above
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
├── hooks/
│   └── academic/                # react-query "use-case" layer — one file per domain, wraps src/lib/api/academic/*
│       ├── useFaculties.ts      # useFaculties() query + useCreateFaculty()/useUpdateFaculty() mutations
│       ├── useCountries.ts
│       ├── useCurrencies.ts
│       ├── useCampuses.ts
│       ├── useStreams.ts
│       ├── useDesignations.ts
│       ├── useDepartments.ts
│       ├── usePermissionGroups.ts
│       ├── useLedgers.ts
│       └── useSkills.ts
└── lib/
    ├── auth.ts                 # all auth API calls; mock when NEXT_PUBLIC_AUTH_MOCK=true, real .NET calls otherwise
    ├── session.ts               # sessionStorage: login flow state (isbat_login_flow) + session identity (isbat_session_identity)
    ├── errorMessages.ts         # ID/password validation rules
    └── api/
        ├── client.ts            # generic HTTP core: post/get (raw JSON) + apiPost/apiGet (envelope) + refresh-and-retry interceptor
        └── academic/            # per-domain data-access modules — currently ALL mock-only (see Data Architecture below)
            ├── faculty.ts
            ├── country.ts
            ├── currency.ts
            ├── campus.ts
            ├── stream.ts
            ├── designation.ts
            ├── department.ts
            ├── permissionGroup.ts
            ├── ledger.ts
            └── skill.ts
```

---

## Data & API Architecture

Introduced this session as the pattern for migrating pages off hardcoded arrays. Layering, thin to thick:

```
src/lib/api/client.ts            → generic HTTP core (post/get/apiPost/apiGet + refresh-retry interceptor)
src/lib/api/academic/<domain>.ts → data access: <Domain> type + get/create/update functions
src/hooks/academic/use<X>.ts     → react-query: use<X>() query, useCreate<X>()/useUpdate<X>() mutations
src/components/...                → presentational only — modals take mutation objects as props, never call hooks themselves for fetching
src/app/academic/<domain>/page.tsx → thin: reads the hook, tracks which row is being edited, passes mutations down to modals
```

**Current state (important):** all 10 `src/lib/api/academic/*.ts` modules are **mock-only unconditionally** — no `NEXT_PUBLIC_AUTH_MOCK` check, no network calls. This is deliberate: the real academic-master backend endpoints don't exist yet. Each module keeps an in-memory array so create/update mutations visibly work end-to-end in the UI (react-query invalidates the list query on success). When the real backend is ready, swap the mock-only body for `apiGet`/`apiPost` calls (same shape `client.ts` already provides), one domain at a time — do **not** gate on `NEXT_PUBLIC_AUTH_MOCK` again without also normalizing a `null` response to `[]`, since a 2xx response with no/empty body is legitimate (see `apiPost`/`apiGet` in `client.ts`) and will otherwise crash `.filter()`/`.map()` calls on the page.

To migrate another page to this pattern: copy the shape of `faculty.ts` + `useFaculties.ts` + `faculty-master/page.tsx` + `NewFacultyModal.tsx`/`EditFacultyModal.tsx` — that's the reference implementation.

---

## Key Patterns

### Page pattern (non-migrated academic/admission pages)
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

### Page pattern (migrated to hook layer, e.g. faculty-master)
Same open/close/toast scaffolding, plus:
```tsx
const { data: rows = [] } = useFaculties()
const createFaculty = useCreateFaculty()
const updateFaculty = useUpdateFaculty()
const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)

function openEditModal(faculty: Faculty) { setEditingFaculty(faculty); openModal('edit-faculty-modal') }
// ...
<NewFacultyModal isOpen={...} onClose={...} showToast={showToast} createFaculty={createFaculty} />
<EditFacultyModal isOpen={...} onClose={...} showToast={showToast} faculty={editingFaculty} updateFaculty={updateFaculty} />
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
- **Migrated domain modals** (Faculty/Country/Currency/Campus/Stream/Designation/Department/Permission/Ledger/Skill) extend `ModalProps` with their own props inline — e.g. `interface NewFacultyModalProps extends ModalProps { createFaculty: { mutate; isPending } }` — rather than widening the shared `ModalProps`. Edit variants also take the row being edited (e.g. `faculty: Faculty | null`) and seed their controlled form state from it via `useEffect(() => { if (isOpen && faculty) {...} }, [isOpen, faculty])`, placed **before** any early `if (!isOpen) return null` to keep hook order valid.

### Number inputs — use `string` state, not `number`
Controlled number inputs must use `string` state (e.g. `useState('25')`) so backspace works correctly.
`+e.target.value` coerces `""` to `0` and prevents clearing the field.
Parse with `+value || 0` only at computation time.

---

## Auth, Sessions & Cookies

- **Tokens:** the .NET backend issues httpOnly cookies `erp_access` (access token) and `erp_refresh` (refresh token) on login/refresh responses. Client JS never reads these directly.
- **Reactive refresh:** `src/lib/api/client.ts`'s `apiPost`/`apiGet`/`post`/`get` all detect an "unauthorized" response (HTTP 401, or envelope `{success:false, code:'unauthorized'}`) and, for any endpoint other than `/auth/login`, `/auth/refresh`, `/auth/logout`, automatically call the refresh endpoint once (deduped across concurrent requests via a shared in-flight promise) and retry the original call. If refresh itself fails, redirects to `/login`. There is **no proactive polling** — refresh only fires reactively, or once on `academic/layout.tsx` mount as a fallback (see below).
- **Session identity (`src/lib/session.ts`):** `setSessionIdentity({ displayName })` is called the moment login/OTP actually succeeds (staff/student login, OTP verify, session-expired resume). `academic/layout.tsx` reads `getSessionIdentity()` on mount first — if present, renders immediately with **no network call**. It only falls back to `refreshSession()` when identity truly isn't known locally (fresh tab / restored browser session with valid cookies but no local identity). `Header.tsx` clears identity on sign-out.
- **Empty-body responses:** the real backend can respond `200` with no parseable JSON body (cookies-only auth). `apiPost`/`apiGet` treat that as success with `null` data rather than throwing — callers that expect an array must still normalize `null` to `[]` themselves (see Data & API Architecture above).
- **`middleware.ts`** (repo root, edge runtime): coarse presence-check guard — redirects `/academic/*` to `/login` if the `erp_access` cookie is absent. Skipped entirely when `NEXT_PUBLIC_AUTH_MOCK=true` (mock auth never sets the cookie). Only works while cookies are same-origin via the `next.config.mjs` dev rewrite proxy; becomes a no-op if `NEXT_PUBLIC_API_GATEWAY_URL` later points cross-origin directly at the gateway.

### Mock Credentials (`NEXT_PUBLIC_AUTH_MOCK=true`)

| Role | ID | Password | OTP |
|---|---|---|---|
| Staff | `AR-2024-0001` | `Admin@1234` | `123456` |
| Student | `ISB/2024/BSCS/0142` | `Student@1234` | `123456` |

Login flow state (challengeId, OTP channel, reset tokens) lives in `sessionStorage` under key `isbat_login_flow`; session identity under `isbat_session_identity` (both in `src/lib/session.ts`).

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

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL for API calls (empty = relative paths in dev, proxied via `next.config.mjs` rewrites to `API_GATEWAY_URL`) |
| `API_GATEWAY_URL` | Server-only: actual backend URL the Next dev server proxies `/api/*` to (not exposed to the browser) |
| `NEXT_PUBLIC_AUTH_MOCK` | `"true"` → skip real auth API, use hardcoded mock login/OTP/refresh responses. Academic domain data (`src/lib/api/academic/*`) is mock-only regardless of this flag (see Data & API Architecture). |
