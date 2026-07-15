# ISBAT ERP — Project Structure Reference

**Stack:** Next.js 16 App Router · React 18 · TypeScript · Tailwind CSS 3 · `@tanstack/react-query` · `zod` · `jose`
**Purpose:** UI-first design prototype that's incrementally being wired to the real .NET backend. Auth (login/refresh/logout) and a growing set of Academic/Config/Employee "master" endpoints hit the real backend via httpOnly cookies when `NEXT_PUBLIC_AUTH_MOCK=false`; everything else is still hard-coded mock data.

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
/login/set-password                → set password (post-activation)
/login/expired                     → expired session landing

/admission                         → redirects to /admission/dashboard
/admission/dashboard               → admission pipeline overview
/admission/online-enquiry          → online enquiry list
/admission/kiosk-enquiry           → self-service kiosk enquiry
/admission/ondesk-enquiry          → on-desk enquiry
/admission/enquiry-list            → enquiry list
/admission/enquiry-followup-master → enquiry followup master
/admission/enquiry-followup        → enquiry followup
/admission/payment                 → application payment
/admission/filing                  → application filing
/admission/vetting                 → vetting desk
/admission/registration            → registrar's desk
/admission/applicants               → all applicants
/admission/applicant-profile       → applicant profile (reached via query-string link, not a sidebar item — see applicantProfileLink.ts)
/admission/enquiry-form            → enquiry form (reached from within other admission pages, not a sidebar item)
/admission/receipts                → sidebar links here but no page exists yet — will 404
/admission/reports                 → sidebar links here but no page exists yet — will 404

/academic/*                        → protected module (guarded by middleware.ts — see Auth section)
/academic/acad-dashboard           → academic dashboard
/academic/intake-master            → intake management
/academic/skill-master             → skill/competency tags (batch/curriculum) — NOT the same as /config/skill
/academic/batch-management         → batch setup & editing
/academic/room-management          → room/venue management
/academic/session-movement         → session movement / repeat
/academic/repetition-tag           → repetition tag master
/academic/course-units             → course unit builder (2-step modal)
/academic/programme-level          → programme level master
/academic/programme-group          → programme groups
/academic/programme-master         → programme builder (multi-step modal)
/academic/fee-structure            → fee structure & items
/academic/timetable                → timetable slots
/academic/odl-applications         → ODL applications
/academic/odl-reconciliation       → ODL payment reconciliation
/academic/student-lookup           → cross-module student lookup

  Pages that exist under /academic but have NO sidebar nav entry (reachable only by direct URL):
/academic/allocation, /academic/results, /academic/class-test, /academic/coursework,
/academic/university-exam, /academic/fee-clearance, /academic/grievance,
/academic/qual-equating, /academic/access-gate, /academic/odel-student-preview

/student/*                         → protected module (NOT guarded by middleware.ts)
/student/student-master            → student records

/employee/*                        → protected module (NOT guarded by middleware.ts)
/employee/employee-master          → employee records                    ← real hook layer

/config/*                          → protected module (NOT guarded by middleware.ts); redirects to /config/department-master
/config/faculty-master             → faculty records                     ← real hook layer
/config/department-master          → department master                  ← real hook layer
/config/designation-master         → designation master                 ← real hook layer
/config/stream-master              → specialization/stream master        ← still mock-only
/config/skill                      → skill master (lecturer subject skills) ← still mock-only; unrelated to /academic/skill-master
/config/ledger                     → ledger master                      ← still mock-only
/config/campus-master              → campus records                     ← real hook layer
/config/currency-master            → currency master                    ← still mock-only
/config/country-master             → country master                     ← real hook layer
/config/permission-master          → permission group master (wizard)   ← real hook layer
```

`← real hook layer` = wired to the actual .NET backend via `apiGet`/`apiPost`/`apiPut`/`apiDelete` (gated by `NEXT_PUBLIC_AUTH_MOCK`). `← still mock-only` = the `src/lib/api/**` module has no `MOCK_AUTH` check at all — it's an in-memory array regardless of the env flag. See **Data & API Architecture** below for the full list and how to migrate one.

**Faculty/Campus/Country/Designation/Department/Permission live under `/config/*`, not `/academic/*`** — they were moved there this project; only Intake and Skill-Master (a distinct thing from Config's Skill Master) stayed under `/academic`.

---

## src/ Directory Layout

```
src/
├── app/
│   ├── layout.tsx              # root layout — Providers, LineIcons CDN, Google Fonts
│   ├── providers.tsx           # QueryClientProvider (single QueryClient via useState — persists across Fast Refresh)
│   ├── globals.css             # ENTIRE design system: CSS tokens, utility classes
│   ├── page.tsx                # root → redirect to /login
│   ├── login/
│   │   ├── page.tsx / staff/ / student/ / otp/ / forgot/ / activate/ / set-password/ / expired/
│   ├── admission/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state; initial panelOpen is false only on /admission/applicant-profile
│   │   ├── page.tsx            # redirect → /admission/dashboard
│   │   └── dashboard/, online-enquiry/, kiosk-enquiry/, ondesk-enquiry/, enquiry-list/,
│   │       enquiry-followup-master/, enquiry-followup/, payment/, filing/, vetting/,
│   │       registration/, applicants/, applicant-profile/, enquiry-form/
│   ├── academic/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state + real session check (see Auth section) — the ONLY layout with an auth gate
│   │   ├── page.tsx            # redirect → /academic/acad-dashboard
│   │   ├── acad-dashboard/, intake-master/ (← useIntakes), skill-master/, batch-management/,
│   │   │   room-management/, session-movement/, repetition-tag/, course-units/, programme-level/,
│   │   │   programme-group/, programme-master/, fee-structure/, timetable/, odl-applications/,
│   │   │   odl-reconciliation/, student-lookup/
│   │   └── [10 sidebar-orphaned pages: allocation/, results/, class-test/, coursework/,
│   │       university-exam/, fee-clearance/, grievance/, qual-equating/, access-gate/,
│   │       odel-student-preview/]
│   ├── student/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state, no auth gate
│   │   └── student-master/page.tsx
│   ├── employee/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state, no auth gate
│   │   └── employee-master/page.tsx    ← uses useEmployees()
│   └── config/
│       ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state, no auth gate; no displayName passed to Header (always shows "Administrator")
│       ├── page.tsx             # redirect → /config/department-master
│       ├── faculty-master/page.tsx     ← uses useFaculties/useCreateFaculty/useUpdateFaculty/useDeleteFaculty
│       ├── campus-master/page.tsx      ← uses useCampuses/useCreateCampus/useUpdateCampus/useDeleteCampus
│       ├── country-master/page.tsx     ← uses useCountries/useCreateCountry/useUpdateCountry
│       ├── department-master/page.tsx  ← uses useDepartments/useCreateDepartment/useUpdateDepartment
│       ├── designation-master/page.tsx ← uses useDesignations/useCreateDesignation/useUpdateDesignation
│       ├── permission-master/page.tsx  ← uses usePermissionGroups + usePermissionWizard (shared wizard logic hook)
│       ├── stream-master/page.tsx      ← useStreams (still mock)
│       ├── skill/page.tsx              ← useSkills (still mock)
│       ├── ledger/page.tsx             ← useLedgers (still mock)
│       └── currency-master/page.tsx    ← useCurrencies (still mock)
├── components/
│   ├── Header.tsx               # fixed top bar; displayName prop defaults to "Administrator" if not passed — only academic/layout.tsx passes the real one
│   ├── Sidebar.tsx               # two-level: rail (module icons) + panel (nav items). See Sidebar & Navigation below.
│   ├── Toast.tsx / ScrollTable.tsx / ActionMenu.tsx / SearchSelect.tsx / FilterTh.tsx
│   ├── EmptyState.tsx / TableLoadingState.tsx    # loading/empty states for react-query-backed tables
│   ├── OtpInput.tsx / StrengthBar.tsx / Stepper.tsx / SuccessScreen.tsx / PortalCard.tsx
│   ├── PolicyFooter.tsx / HeroA.tsx / HeroImageSlider.tsx / PanelA.tsx / LiveStatsRotator.tsx / MethodPill.tsx / Icon.tsx
│   └── modals/
│       ├── types.ts             # ModalProps interface (shared shape; migrated modals add extra props inline)
│       ├── academic/            # NOTE: still named "academic" even though Faculty/Campus/Country/etc. now route under /config/*
│       │   ├── SuccessPopup.tsx / FailurePopup.tsx    # shared success/failure state inside modals
│       │   ├── New/EditFacultyModal.tsx, New/EditCampusModal.tsx, New/EditCountryModal.tsx,
│       │   │   New/EditDepartmentModal.tsx, New/EditDesignationModal.tsx,
│       │   │   New/EditPermissionModal.tsx (wizard, built on usePermissionWizard)   # real mutations
│       │   ├── New/EditCurrencyModal.tsx, New/EditStreamModal.tsx, New/EditLedgerModal.tsx,
│       │   │   New/EditSkillModal.tsx                                              # still mock mutations
│       │   ├── New/EditIntakeModal.tsx, New/EditBatchModal.tsx, New/EditRoomModal.tsx,
│       │   │   RoomMgmtModal.tsx, New/EditRepTagModal.tsx
│       │   ├── CourseUnitModal.tsx / EditCourseUnitModal.tsx / ElectiveSelectModal.tsx
│       │   ├── ProgrammeModal.tsx (multi-step) / ProgrammeLevelModal.tsx / ProgrammeGroupModal.tsx / SpecializationModal.tsx
│       │   ├── FeeStructureModal.tsx / FeeItemModal.tsx
│       │   ├── AddSkillModal.tsx (role-aware: lecturer vs dean — unrelated to skill/page.tsx)
│       │   ├── AddSlotModal.tsx / TtImportModal.tsx / AllocImportModal.tsx / ConfirmMovementModal.tsx
│       ├── employee/
│       │   ├── NewEmployeeModal.tsx / EditEmployeeModal.tsx    # real mutations; Country dropdown sourced from useCountries()
│       ├── student/
│       │   ├── NewStudentModal.tsx / EditStudentModal.tsx / StudentProfileModal.tsx
│       └── admission/
│           ├── EnquiryFormModal.tsx / StudentProfileModal.tsx / ImportSourceModal.tsx / ImportCrmModal.tsx / ImportOdelModal.tsx
│           ├── LogFollowupModal.tsx / AllocateFollowupModal.tsx / VettingReviewModal.tsx / CompleteRegistrationModal.tsx
│           └── RejectModal.tsx / OnboardModal.tsx
├── hooks/
│   ├── config/                  # react-query "use-case" layer for most /config/* pages — one file per domain
│   │   ├── useFaculties.ts / useCampuses.ts / useCountries.ts / useDepartments.ts / useDesignations.ts / usePermissionGroups.ts
│   │   └── useStreams.ts / useSkills.ts / useLedgers.ts / useCurrencies.ts    (still mock underneath)
│   ├── academic/
│   │   └── useIntakes.ts        # the one hook that stayed under "academic" naming (backs /academic/intake-master)
│   ├── employee/
│   │   └── useEmployees.ts
│   └── users/
│       ├── usePermissionCatalog.ts   # GET permission-groups/permissions (real)
│       └── usePermissionWizard.ts    # shared accordion/search/module-block state behind New/EditPermissionModal
└── lib/
    ├── auth.ts                  # all auth API calls; mock when NEXT_PUBLIC_AUTH_MOCK=true, real .NET calls otherwise
    ├── session.ts                # sessionStorage: login flow state (isbat_login_flow) + session identity (isbat_session_identity)
    ├── errorMessages.ts          # ID/password validation rules
    ├── applicantProfileLink.ts   # builds /admission/applicant-profile?... query-string links from an applicant's data
    └── api/
        ├── client.ts             # generic HTTP core — see Auth section for the refresh/retry interceptor
        ├── academic/              # per-domain data-access modules — mixed real/mock, see Data & API Architecture
        │   ├── faculty.ts / campus.ts / country.ts / designation.ts / department.ts / permissionGroup.ts / intake.ts   (real)
        │   └── currency.ts / stream.ts / ledger.ts / skill.ts                                                          (still mock)
        ├── employee/
        │   └── employee.ts        # real; EmployeeListItem uses isApproved: boolean (not a status string)
        └── users/
            └── permissionCatalog.ts   # real; GET permission catalog for the wizard
```

---

## Data & API Architecture

Layering, thin to thick:

```
src/lib/api/client.ts              → generic HTTP core (post/get/apiPost/apiPut/apiDelete/apiGet + refresh-retry interceptor)
src/lib/api/<domain-group>/<x>.ts  → data access: <X> type + get/create/update/delete functions
src/hooks/<group>/use<X>.ts        → react-query: use<X>() query, useCreate<X>()/useUpdate<X>()/useDelete<X>() mutations
src/components/modals/...           → presentational only — modals take mutation objects as props, never call hooks themselves for fetching
src/app/<module>/<domain>/page.tsx → thin: reads the hook, tracks which row is being edited/deleted, passes mutations down to modals
```

**Current state — real backend wiring, by domain (all under `src/lib/api/academic/*` regardless of which route module they serve):**

| Domain | Status | Notes |
|---|---|---|
| `faculty.ts` | Real | `campusGuid`/`deanEmployeeGuid` FKs; `deanName` from the backend is often `null` — the page falls back to resolving it client-side via `useEmployees()` |
| `campus.ts` | Real | Full CRUD incl. delete |
| `country.ts` | Real | Also consumed by Employee modals' country dropdown |
| `designation.ts` | Real | |
| `department.ts` | Real | |
| `permissionGroup.ts` | Real | Backs the wizard in `usePermissionWizard.ts` |
| `intake.ts` | Real | |
| `employee.ts` (own `src/lib/api/employee/`) | Real | `isApproved: boolean`, not a status string |
| `permissionCatalog.ts` (own `src/lib/api/users/`) | Real | |
| `currency.ts` | **Still mock-only** | No `MOCK_AUTH` check — in-memory array unconditionally |
| `stream.ts` | **Still mock-only** | Same |
| `ledger.ts` | **Still mock-only** | Same |
| `skill.ts` | **Still mock-only** | Same |

For the still-mock modules, real endpoints don't exist yet; each keeps an in-memory array so create/update mutations visibly work end-to-end (react-query invalidates the list query on success). When migrating one: swap the mock-only body for `apiGet`/`apiPost`/`apiPut`/`apiDelete` calls gated behind `MOCK_AUTH`, and remember a 2xx response can come back with a `null` body (cookies-only auth / no-content success) — normalize `null` to `[]` before `.filter()`/`.map()`.

To migrate another page to this pattern: copy the shape of `faculty.ts` + `useFaculties.ts` + `config/faculty-master/page.tsx` + `NewFacultyModal.tsx`/`EditFacultyModal.tsx` — that's the current reference implementation (includes list, create, update, delete, and a client-side FK-name-resolution fallback).

---

## Key Patterns

### Page pattern (all module pages)
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

### Page pattern (real-hook-layer pages, e.g. config/faculty-master)
Same open/close/toast scaffolding, plus:
```tsx
const { data: rows = [], isLoading } = useFaculties()
const createFaculty = useCreateFaculty()
const updateFaculty = useUpdateFaculty()
const deleteFaculty = useDeleteFaculty()
const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null)
```
- Old hardcoded row/column markup is commented out in place (not deleted) when a page migrates, with a note on why — preserves the previous shape for reference until backend fields are fully confirmed.
- Delete uses a shared confirmation-card pattern: `deleteTarget` state + `perm-delete-overlay`/`perm-delete-card`/`perm-delete-icon`/`perm-delete-title`/`perm-delete-sub`/`perm-delete-actions` classes, `btn-danger`, `disabled={x.isPending}` with a `'Deleting…'` label swap.

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
- Real-hook-layer modals extend `ModalProps` with their own props inline (e.g. `createFaculty: { mutate; isPending }`); Edit variants also take the row being edited and seed controlled form state via a `useEffect` placed **before** any early `if (!isOpen) return null`, to keep hook order valid
- Every newly-wired mutating modal renders `<FailurePopup>` on `onError`, using `error instanceof AuthError ? error.code : undefined` to surface a backend error code when available, with a specific message for `404 not_found` ("no longer exists — it may have been deleted")

### Number inputs — use `string` state, not `number`
Controlled number inputs must use `string` state (e.g. `useState('25')`) so backspace works correctly. `+e.target.value` coerces `""` to `0` and prevents clearing the field. Parse with `+value || 0` only at computation time.

---

## Sidebar & Navigation (`src/components/Sidebar.tsx`)

- **Rail** (left icon strip): Admission, Academic, Finance (locked), Student, Attendance (locked), Analytics (locked), Employee, Config, then a spacer and Admin/User & Role (locked). Clicking the active rail's own icon toggles the panel open/closed; clicking a different rail switches `activeRail` and forces the panel open.
- **Panel** nav items render as `next/link` `<Link>` elements (not `<div onClick={router.push}>`), so browser-native ctrl/cmd-click "open in new tab" and right-click work, and Next can prefetch them.
- On mount, `Sidebar` also eagerly calls `router.prefetch()` for **every** route across all five modules (not just the active rail), since a rail's `<Link>`s don't exist in the DOM — and so can't self-prefetch — until that rail is actually clicked once.
- A small circular `.sb-toggle` button is pinned to the sidebar's right edge (`position: absolute; right: -12px` relative to the fixed-position `.sidebar`) to manually collapse/expand the panel, independent of the rail-click toggle.
- Each module's `layout.tsx` owns its own `panelOpen`/`collapsedSections`/`activeRail` state independently — switching modules unmounts one layout and mounts another, so panel-open state does **not** carry over between modules (only within a module, across page navigations, since the layout doesn't remount there).

---

## Auth, Sessions & Cookies

- **Tokens:** the .NET backend issues httpOnly cookies (`erp_access`, `erp_refresh`-equivalent) on login/refresh responses. Client JS never reads these directly, and has no way to read the access token's expiry client-side.
- **Reactive refresh-and-retry (`src/lib/api/client.ts`):** every real call (`post`/`get`/`apiPost`/`apiPut`/`apiDelete`/`apiGet`) detects an "unauthorized" response and, for any endpoint other than `/auth/login`, `/auth/refresh`, `/auth/logout`, calls a shared `handleUnauthorized()` helper which refreshes (deduped across concurrent 401s via one in-flight promise) and retries the original call once. **Only a definitive `AuthError` from the refresh call itself triggers a hard redirect to `/login`** — a network error/timeout hitting `/auth/refresh` throws a plain error instead and is left to surface as a normal failure, so a transient blip doesn't force a logout. There is no proactive polling; refresh only fires reactively on a real 401, or once on `academic/layout.tsx` mount as a fallback (below).
- **Session identity (`src/lib/session.ts`):** `setSessionIdentity({ displayName })` is set the moment login/OTP actually succeeds. `academic/layout.tsx` reads `getSessionIdentity()` **synchronously via a lazy `useState` initializer**, so an already-authenticated user navigating in from another module skips any auth-check spinner entirely; it only awaits `refreshSession()` (with a spinner) when identity truly isn't known locally yet (fresh tab / restored session). `academic/layout.tsx` is the *only* layout with this gate — Config/Employee/Student/Admission layouts render Header/Sidebar immediately with no auth check and no real `displayName` (Header defaults to `"Administrator"`).
- **`middleware.ts`** (repo root, edge runtime): coarse presence-check guard — redirects to `/login` only when the path starts with `/academic` and the `erp_access` cookie is absent. **`/config/*`, `/employee/*`, `/student/*`, `/admission/*` are NOT covered by this guard** — only `academic/layout.tsx`'s own client-side check protects the Academic module; the other four modules currently have no route-level protection at all beyond whatever the backend itself enforces per-request. Skipped entirely when `NEXT_PUBLIC_AUTH_MOCK=true`.
- **Empty-body responses:** the real backend can respond `200` with no parseable JSON body (cookies-only auth). `apiPost`/`apiGet`/etc. treat that as success with `null` data — callers that expect an array must normalize `null` to `[]` themselves.

### Mock Credentials (`NEXT_PUBLIC_AUTH_MOCK=true`)

| Role | ID | Password | OTP |
|---|---|---|---|
| Staff | `AR-2024-0001` | `Admin@1234` | `123456` |
| Student | `ISB/2024/BSCS/0142` | `Student@1234` | `123456` |

Login flow state lives in `sessionStorage` under `isbat_login_flow`; session identity under `isbat_session_identity` (both in `src/lib/session.ts`).

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

Key utility classes: `.btn`, `.btn-primary`, `.btn-neu`, `.btn-danger`, `.btn-amber`, `.btn-sm`, `.card`, `.pg-hdr`, `.sb-item`, `.sb-toggle`, `.modal`, `.modal-overlay`, `.modal-hdr`, `.modal-footer`, `.modal-scroll`, `.modal-80`, `.modal-flex`, `.mdl-section`, `.mdl-section--blue/amber/green`, `.mdl-section-hdr`, `.badge-*`, `.ctrl`, `.lbl`, `.fg`, `.g3`, `.req`, `.prog-step`, `.prog-steps`, `.file-zone`, `.wt-input`, `.perm-delete-*`

Tailwind config maps all CSS variables to Tailwind names (`bg-b500`, `text-g400`, `bg-clr-green-bg`, etc.). There is no global `a { }` reset — anchor-based components (like `.sb-item`, now a `<Link>`) must set their own `text-decoration`.

---

## Icons & Fonts

- **Icons:** LineIcons 4.0 from CDN — `<i className="lni lni-{name}"></i>`
- **Fonts (CSS vars):** `--font-serif` (Source Serif 4) · `--font-sans` (Inter Tight) · `--font-mono` (JetBrains Mono)

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL for API calls (empty = relative paths in dev, proxied via `next.config.mjs` rewrites to `API_GATEWAY_URL`) |
| `API_GATEWAY_URL` | Server-only: actual backend URL the Next server proxies `/api/*` to (not exposed to the browser). If unset, the rewrite is skipped entirely rather than producing an invalid `"undefined/api/*"` destination that would fail the build. |
| `NEXT_PUBLIC_AUTH_MOCK` | `"true"` → skip real auth API, use hardcoded mock login/OTP/refresh responses, and skip the `middleware.ts` cookie guard. Also gates each `src/lib/api/**` domain module independently — see the Data & API Architecture table for which ones actually check it. |
