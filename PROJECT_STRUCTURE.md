# ISBAT ERP — Project Structure Reference

**Stack:** Next.js 16 App Router · React 18 · TypeScript · Tailwind CSS 3 · `@tanstack/react-query` · `zod` · `jose`
**Purpose:** UI-first design prototype that's incrementally being wired to the real .NET backend. Auth (login/refresh/logout) and a growing set of Academic/Admission/Finance/Config/Employee "master" endpoints hit the real backend via httpOnly cookies when `NEXT_PUBLIC_AUTH_MOCK=false`; everything else is still hard-coded mock data.

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
/academic/intake-master            → intake management                  ← real hook layer
/academic/skill-master             → skill/competency tags (batch/curriculum) — NOT the same as /config/skill
/academic/batch-management         → batch setup & editing
/academic/room-management          → room/venue management
/academic/session-movement         → session movement / repeat
/academic/repetition-tag           → repetition tag master              ← real hook layer
/academic/course-units             → course unit builder (2-step modal) ← real hook layer
/academic/programme-level          → programme level master             ← real hook layer (Create/Update send currencyGuid — see note below)
/academic/programme-group          → programme groups                   ← real hook layer
/academic/programme-master         → programme builder (multi-step modal) ← real hook layer (create + list confirmed — create via apiPostForm/multipart, list via GET ?search=; fee-line ledger wired to the real Finance Ledger master; Update/Delete/GetByGuid still unconfirmed, Edit mode still local-only)
/academic/fee-structure            → fee structure & items               (still fully mock — standalone page, unrelated to Programme Master's embedded fee-structure step)
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
/employee/employee-master          → employee records                    ← real hook layer (also assigns/edits per-employee Permission Groups — see note below)

/config/*                          → protected module (NOT guarded by middleware.ts); redirects to /config/department-master
/config/faculty-master             → faculty records                     ← real hook layer
/config/department-master          → department master                  ← real hook layer
/config/designation-master         → designation master                 ← real hook layer
/config/specialization             → specialization/stream master        ← real hook layer (renamed from /config/stream-master; backend fields/type/hook/file still say "stream" — GET/POST/PUT/DELETE all hit /api/v1/academic/specializations)
/config/skill                      → skill master (lecturer subject skills) ← still mock-only; unrelated to /academic/skill-master
/config/campus-master              → campus records                     ← real hook layer
/config/country-master             → country master                     ← real hook layer
/config/permission-master          → permission group master (wizard)   ← real hook layer
/config/enquiry-status             → admission enquiry status master     ← real hook layer (/api/v1/admissions/enquiry-statuses)
/config/enquiry-source             → admission enquiry source master     ← real hook layer (/api/v1/admissions/isbat-enquiry-sources; single-field: sourceName)
/config/followup-status            → admission enquiry followup status master ← real hook layer (/api/v1/admissions/follow-up-statuses; has an isClose 0/1 flag)
/config/followup-mode              → admission followup mode master      ← real hook layer (/api/v1/admissions/followup-modes; single-field: followUpModeName)
/config/interest-level             → admission interest level master     ← real hook layer (/api/v1/admissions/interest-levels; single-field: interestLevelName)
/config/weekdays                   → weekday master                     ← real hook layer (/api/v1/academic/weekdays)
/config/unit-type                  → unit type master                   ← real hook layer
/config/unit-category               → unit category master               ← real hook layer

/finance                           → redirects to /finance/cooperates
/finance/cooperates                → corporate partner master           ← real hook layer (/api/v1/finance/cooperates)
/finance/discounts                 → discount master                    ← real hook layer (/api/v1/finance/discounts; calcType/status are int enums — see note below)
/finance/ledgers                   → ledger master                      ← real hook layer (/api/v1/finance/ledgers; distinct from the old /config/ledger, which was deleted — this is the only ledger master left)
/finance/currency-master           → currency master                    ← real hook layer (moved here from /config/currency-master; GET/create real, hits /api/v1/finance/currencies; update still mock — see note below)
/finance/receipt-books             → receipt book master                ← real hook layer (/api/v1/finance/receipt-books; status/category/bookCategory int enums; Update only allows status/category/copy/bookCategory — bookCode/startNo/prefix/count are locked after creation; no GetByGuid endpoint)
/finance/gen-sets                  → general settings (type/condition lookups) ← real hook layer (/api/v1/finance/gen-sets; two plain text fields)
/finance/banks                     → bank master                        ← real hook layer (/api/v1/finance/banks)
/finance/bank-branches              → bank branch master                 ← real hook layer (/api/v1/finance/bank-branches; Bank dropdown ← useBanks())
/finance/proc-gl-accounts          → procurement GL account master      ← real hook layer (/api/v1/finance/proc-gl-accounts)
/finance/proc-banks                → procurement bank master            ← real hook layer (/api/v1/finance/proc-banks; Currency dropdown sourced from finance's own currency lookup, not /finance/currency-master)
```

`← real hook layer` = wired to the actual .NET backend via `apiGet`/`apiPost`/`apiPut`/`apiDelete` (gated by `NEXT_PUBLIC_AUTH_MOCK`). See **Data & API Architecture** below for the full list and how to migrate a still-mock domain.

**Faculty/Campus/Country/Designation/Department/Permission live under `/config/*`, not `/academic/*`** — they were moved there this project; only Intake and Skill-Master (a distinct thing from Config's Skill Master) stayed under `/academic`. **`/academic/programme-level` and `/academic/programme-group`** are also real hook layer despite living under `/academic/*` rather than `/config/*`.

**Ledger and Currency Master both moved out of `/config/*` into `/finance/*`** this round: `/config/ledger` was deleted outright (Finance's `/finance/ledgers` is the only ledger master now); `/config/currency-master` was relocated as-is to `/finance/currency-master` (its page/modals/hook/api file moved, internals unchanged). The Config sidebar's old "Finance" subsection (which held just these two) was removed entirely once both left.

**Enquiry Source, Followup Mode, and Interest Level are new Admission-domain masters that live under `/config/*`** (in the sidebar's Config → Admissions group, alongside Enquiry Status and Followup Status) even though their API/hook files live in `src/lib/api/admission/` and `src/hooks/admission/` — same "route module vs. code location" split as the pre-existing Faculty/Campus/etc.

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
│   │   └── employee-master/page.tsx    ← uses useEmployees(); Assign/Edit Permissions actions use AssignEmployeePermissionsModal/EditEmployeePermissionsModal
│   ├── config/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state, no auth gate; no displayName passed to Header (always shows "Administrator")
│   │   ├── page.tsx             # redirect → /config/department-master
│   │   ├── faculty-master/page.tsx     ← uses useFaculties/useCreateFaculty/useUpdateFaculty/useDeleteFaculty
│   │   ├── campus-master/page.tsx      ← uses useCampuses/useCreateCampus/useUpdateCampus/useDeleteCampus
│   │   ├── country-master/page.tsx     ← uses useCountries/useCreateCountry/useUpdateCountry
│   │   ├── department-master/page.tsx  ← uses useDepartments/useCreateDepartment/useUpdateDepartment
│   │   ├── designation-master/page.tsx ← uses useDesignations/useCreateDesignation/useUpdateDesignation
│   │   ├── permission-master/page.tsx  ← uses usePermissionGroups + usePermissionWizard (shared wizard logic hook)
│   │   ├── specialization/page.tsx     ← useStreams/useCreateStream/useUpdateStream/useDeleteStream (renamed from stream-master; type/hook/file still say "Stream")
│   │   ├── skill/page.tsx              ← useSkills (still mock)
│   │   ├── enquiry-status/page.tsx     ← useEnquiryStatuses/useCreateEnquiryStatus/useUpdateEnquiryStatus/useDeleteEnquiryStatus
│   │   ├── enquiry-source/page.tsx     ← useEnquirySources/useCreateEnquirySource/useUpdateEnquirySource/useDeleteEnquirySource (hooks/lib live under .../admission/, not .../config/)
│   │   ├── followup-status/page.tsx    ← useFollowUpStatuses/useCreateFollowUpStatus/useUpdateFollowUpStatus/useDeleteFollowUpStatus
│   │   ├── followup-mode/page.tsx      ← useFollowUpModes/useCreateFollowUpMode/useUpdateFollowUpMode/useDeleteFollowUpMode (hooks/lib under .../admission/)
│   │   ├── interest-level/page.tsx     ← useInterestLevels/useCreateInterestLevel/useUpdateInterestLevel/useDeleteInterestLevel (hooks/lib under .../admission/)
│   │   ├── weekdays/page.tsx           ← useWeekdays/useCreateWeekday/useUpdateWeekday/useDeleteWeekday
│   │   ├── unit-type/page.tsx          ← useUnitTypes/useCreateUnitType/useUpdateUnitType/useDeleteUnitType
│   │   └── unit-category/page.tsx      ← useUnitCategories/useCreateUnitCategory/useUpdateUnitCategory/useDeleteUnitCategory
│   └── finance/
│       ├── layout.tsx           # own panelOpen/collapsedSections/activeRail state, no auth gate
│       ├── page.tsx             # redirect → /finance/cooperates
│       ├── cooperates/page.tsx       ← useCooperates/useCreateCooperate/useUpdateCooperate/useDeleteCooperate
│       ├── discounts/page.tsx        ← useDiscounts/useCreateDiscount/useUpdateDiscount/useDeleteDiscount (calcType/status int enums — see note below)
│       ├── ledgers/page.tsx          ← useLedgers/useCreateLedger/useUpdateLedger/useDeleteLedger
│       ├── currency-master/page.tsx  ← useCurrencies (GET/create real; update still mock) — moved here from /config/currency-master, internals untouched
│       ├── receipt-books/page.tsx    ← useReceiptBooks/useCreateReceiptBook/useUpdateReceiptBook/useDeleteReceiptBook (no GetByGuid — Edit modal seeds from the already-loaded row)
│       ├── gen-sets/page.tsx         ← useGenSets/useCreateGenSet/useUpdateGenSet/useDeleteGenSet
│       ├── banks/page.tsx            ← useBanks/useCreateBank/useUpdateBank/useDeleteBank
│       ├── bank-branches/page.tsx    ← useBankBranches/useCreateBankBranch/useUpdateBankBranch/useDeleteBankBranch; Bank name resolved client-side via useBanks()
│       ├── proc-gl-accounts/page.tsx ← useProcGlAccounts/useCreateProcGlAccount/useUpdateProcGlAccount/useDeleteProcGlAccount (status/type int enums)
│       └── proc-banks/page.tsx       ← useProcBanks/useCreateProcBank/useUpdateProcBank/useDeleteProcBank; Currency dropdown ← useFinanceCurrencies (read-only)
├── components/
│   ├── Header.tsx               # fixed top bar; displayName prop defaults to "Administrator" if not passed — only academic/layout.tsx passes the real one
│   ├── Sidebar.tsx               # two-level: rail (module icons) + panel (nav items, grouped into collapsible sub-sections). See Sidebar & Navigation below.
│   ├── Toast.tsx / ScrollTable.tsx / ActionMenu.tsx / SearchSelect.tsx / FilterTh.tsx
│   ├── EmptyState.tsx / TableLoadingState.tsx    # loading/empty states for react-query-backed tables
│   ├── OtpInput.tsx / StrengthBar.tsx / Stepper.tsx / SuccessScreen.tsx / PortalCard.tsx
│   ├── PolicyFooter.tsx / HeroA.tsx / HeroImageSlider.tsx / PanelA.tsx / LiveStatsRotator.tsx / MethodPill.tsx / Icon.tsx
│   └── modals/
│       ├── types.ts             # ModalProps interface (shared shape; migrated modals add extra props inline)
│       ├── academic/            # NOTE: still named "academic" even though Faculty/Campus/Country/Enquiry Source/Followup Mode/Interest Level/etc. route under /config/*
│       │   ├── SuccessPopup.tsx / FailurePopup.tsx    # shared success/failure state inside modals
│       │   ├── New/EditFacultyModal.tsx, New/EditCampusModal.tsx, New/EditCountryModal.tsx,
│       │   │   New/EditDepartmentModal.tsx, New/EditDesignationModal.tsx,
│       │   │   New/EditPermissionModal.tsx (wizard, built on usePermissionWizard)   # real mutations
│       │   ├── New/EditSkillModal.tsx                                              # still mock mutations
│       │   ├── New/EditStreamModal.tsx (backs /config/specialization), New/EditEnquiryStatusModal.tsx,
│       │   │   New/EditFollowUpStatusModal.tsx, New/EditWeekdayModal.tsx           # real mutations, all Edit variants fetch fresh by guid (useX(guid, isOpen)) rather than reusing the row from the list
│       │   ├── New/EditEnquirySourceModal.tsx, New/EditFollowUpModeModal.tsx,
│       │   │   New/EditInterestLevelModal.tsx    # real mutations, single-field forms, fetch-by-guid Edit convention; import from @/lib/api/admission/* + @/hooks/admission/*
│       │   ├── New/EditIntakeModal.tsx, New/EditBatchModal.tsx, New/EditRoomModal.tsx,
│       │   │   RoomMgmtModal.tsx, New/EditRepTagModal.tsx                          # Intake modals require lastDateForReRegistration/grievanceStartDate/grievanceEndDate (backend-confirmed, despite the type marking them nullable) and compute durationInWeeks with Math.ceil, not Math.round — see note below
│       │   ├── CourseUnitModal.tsx / EditCourseUnitModal.tsx / ElectiveSelectModal.tsx
│       │   ├── ProgrammeModal.tsx (multi-step) / ProgrammeLevelModal.tsx / ProgrammeGroupModal.tsx / SpecializationModal.tsx
│       │   │   # ProgrammeModal's fee-line Ledger dropdown is wired to the real Finance Ledger master (useLedgers) — previously hardcoded to one fake ledger regardless of selection
│       │   │   # ProgrammeLevelModal/EditProgrammeLevelModal source Currency from useFinanceCurrencies (currencyGuid), not useCurrencies (intCurrency) — see note below
│       │   ├── FeeStructureModal.tsx / FeeItemModal.tsx    # standalone /academic/fee-structure page — still fully mock, has its own separate hardcoded ledger list (not migrated)
│       │   ├── AddSkillModal.tsx (role-aware: lecturer vs dean — unrelated to skill/page.tsx)
│       │   └── AddSlotModal.tsx / TtImportModal.tsx / AllocImportModal.tsx / ConfirmMovementModal.tsx
│       ├── finance/
│       │   ├── New/EditCooperateModal.tsx
│       │   ├── New/EditDiscountModal.tsx           # calcType/status converted label↔int at the mutation boundary, see note below
│       │   ├── New/EditLedgerModal.tsx             # real mutations, fetch-by-guid Edit convention
│       │   ├── New/EditCurrencyModal.tsx           # moved from modals/academic/ — create real, update still mock
│       │   ├── New/EditReceiptBookModal.tsx        # Edit only exposes status/category/copy/bookCategory (rest locked post-creation); takes the row directly, no fetch-by-guid (no GetByGuid endpoint)
│       │   ├── New/EditGenSetModal.tsx             # real mutations, fetch-by-guid Edit convention
│       │   ├── New/EditBankModal.tsx, New/EditBankBranchModal.tsx   # real mutations, fetch-by-guid Edit convention
│       │   ├── New/EditProcGlAccountModal.tsx       # status/type converted label↔int at the mutation boundary
│       │   └── New/EditProcBankModal.tsx            # Currency dropdown sourced from useFinanceCurrencies(), not useCurrencies()
│       ├── employee/
│       │   ├── NewEmployeeModal.tsx / EditEmployeeModal.tsx    # real mutations; Country dropdown sourced from useCountries()
│       │   └── AssignEmployeePermissionsModal.tsx / EditEmployeePermissionsModal.tsx    # two separate entry points onto the same view-then-edit flow — pick one or more Permission Master groups via tabs (add/remove), preview each as an Accessible/Not-Accessible breakdown, save via the same PUT; share buildBreakdown() from lib/permissionBreakdown.ts. Kept as two components/buttons per product request even though they're functionally near-identical
│       ├── student/
│       │   ├── NewStudentModal.tsx / EditStudentModal.tsx / StudentProfileModal.tsx
│       └── admission/
│           ├── EnquiryFormModal.tsx / StudentProfileModal.tsx / ImportSourceModal.tsx / ImportCrmModal.tsx / ImportOdelModal.tsx
│           ├── LogFollowupModal.tsx / AllocateFollowupModal.tsx / VettingReviewModal.tsx / CompleteRegistrationModal.tsx
│           └── RejectModal.tsx / OnboardModal.tsx
├── hooks/
│   ├── config/                  # react-query "use-case" layer for most /config/* pages — one file per domain
│   │   ├── useFaculties.ts / useCampuses.ts / useCountries.ts / useDepartments.ts / useDesignations.ts / usePermissionGroups.ts
│   │   ├── useStreams.ts (backs /config/specialization) / useEnquiryStatuses.ts / useFollowUpStatuses.ts / useWeekdays.ts   (all real; each exports a useX(guid, enabled) single-record query for its Edit modal)
│   │   ├── useUnitTypes.ts / useUnitCategories.ts   (real; same useX(guid, enabled) convention)
│   │   └── useSkills.ts    (still mock underneath)
│   ├── admission/               # new — react-query layer for Admission-domain masters that route under /config/*
│   │   └── useEnquirySources.ts / useInterestLevels.ts / useFollowUpModes.ts   (all real; useX(guid, enabled) convention for Edit modals)
│   ├── academic/
│   │   ├── useIntakes.ts        # kept "academic" naming (backs /academic/intake-master)
│   │   ├── useProgramLevels.ts / useProgramGroups.ts   # real; back /academic/programme-level and /academic/programme-group
│   │   └── useRepetitionTags.ts / useCourseUnits.ts / useProgramMaster.ts   # real; back /academic/repetition-tag, /course-units, /programme-master (useProgramMaster.ts now also exports useProgramMasters() — the confirmed list query)
│   ├── finance/
│   │   ├── useCooperates.ts / useDiscounts.ts / useLedgers.ts / useReceiptBooks.ts / useGenSets.ts / useBanks.ts /
│   │   │   useBankBranches.ts / useProcGlAccounts.ts / useProcBanks.ts   (all real; useX(guid, enabled) convention for Edit modals except useReceiptBooks — no GetByGuid endpoint)
│   │   ├── useCurrencies.ts     # backs /finance/currency-master — GET/create real, hits /api/v1/finance/currencies; update still mock. Moved here from hooks/config/.
│   │   └── useFinanceCurrencies.ts   # GET-only lookup for the Currency dropdown in ProcBank/Programme Level modals — distinct from useCurrencies(), carries a confirmed real currencyGuid
│   ├── employee/
│   │   └── useEmployees.ts    # useEmployees/useEmployee/useCreateEmployee/useUpdateEmployee, plus useEmployeePermissionGroups(guid, enabled) and useAssignEmployeePermissionGroups() for the per-employee Permission Group assign/edit flow
│   └── users/
│       ├── usePermissionCatalog.ts   # GET permission-groups/permissions (real)
│       └── usePermissionWizard.ts    # shared accordion/search/module-block state behind New/EditPermissionModal
└── lib/
    ├── auth.ts                  # all auth API calls; mock when NEXT_PUBLIC_AUTH_MOCK=true, real .NET calls otherwise
    ├── session.ts                # sessionStorage: login flow state (isbat_login_flow) + session identity (isbat_session_identity)
    ├── errorMessages.ts          # ID/password validation rules
    ├── applicantProfileLink.ts   # builds /admission/applicant-profile?... query-string links from an applicant's data
    ├── permissionBreakdown.ts    # buildBreakdown() — walks the FULL permission catalog against a set of Permission Master groups, tagging every permission granted/not-granted (not just the groups' own lists); shared by AssignEmployeePermissionsModal and EditEmployeePermissionsModal
    └── api/
        ├── client.ts             # generic HTTP core — see Auth section for the refresh/retry interceptor
        ├── academic/              # per-domain data-access modules — mixed real/mock, see Data & API Architecture
        │   ├── faculty.ts / campus.ts / country.ts / designation.ts / department.ts / permissionGroup.ts / intake.ts
        │   │   / programLevel.ts / programGroup.ts / stream.ts / enquiryStatus.ts / followUpStatus.ts / weekday.ts
        │   │   / unitType.ts / unitCategory.ts / repetitionTag.ts / courseUnit.ts / programMaster.ts                   (real)
        │   └── skill.ts                                                                                              (still mock)
        │   # currency.ts and ledger.ts used to live here — currency.ts moved to lib/api/finance/currencyMaster.ts,
        │   # ledger.ts was deleted outright (superseded by the real lib/api/finance/ledger.ts)
        ├── admission/             # new — per-domain data-access modules for Admission-domain masters routed under /config/*
        │   ├── enquirySource.ts   # /api/v1/admissions/isbat-enquiry-sources
        │   ├── followUpMode.ts    # /api/v1/admissions/followup-modes
        │   └── interestLevel.ts   # /api/v1/admissions/interest-levels
        ├── finance/               # per-domain data-access modules for /finance/* — all real
        │   ├── cooperate.ts       # /api/v1/finance/cooperates
        │   ├── discount.ts        # /api/v1/finance/discounts; calcType/status int enums — see Data & API Architecture note
        │   ├── ledger.ts          # /api/v1/finance/ledgers; real, fetch-by-guid Edit convention (intLedger/ledgerNum added for ProgramMaster's fee-line FK — see note below)
        │   ├── currencyMaster.ts  # /api/v1/finance/currencies (GET/create real; update still mock); backs /finance/currency-master — moved from lib/api/academic/currency.ts, renamed to avoid colliding with currency.ts below
        │   ├── currency.ts        # /api/v1/finance/currencies (GET-only) — distinct FinanceCurrency type with a confirmed real currencyGuid; used only as a dropdown lookup (Bank/ProcBank/Programme Level), no Currency Master page of its own
        │   ├── receiptBook.ts     # /api/v1/finance/receipt-books; status/category/bookCategory int enums (hardcoded from Finance/Enums/*.bru); no GetByGuid
        │   ├── genSet.ts          # /api/v1/finance/gen-sets; two plain text fields (type, condition) — a generic lookup table, NOT the same guid space as currencyMaster.ts or currency.ts, despite all three being "currency-shaped" in places
        │   ├── procGlAccount.ts   # /api/v1/finance/proc-gl-accounts; status/type int enums
        │   ├── procBank.ts        # /api/v1/finance/proc-banks; currencyGuid references currency.ts above, not currencyMaster.ts
        │   ├── bank.ts            # /api/v1/finance/banks
        │   └── bankBranch.ts      # /api/v1/finance/bank-branches; bankGuid FK, resolved client-side via useBanks()
        ├── employee/
        │   └── employee.ts        # real; EmployeeListItem uses isApproved: boolean (not a status string). Also assignEmployeePermissionGroups/getEmployeePermissionGroups (PUT/GET /api/v1/users/admin/users/{employeeGuid}/permission-groups) — GET's real shape is an array of {permissionGroupGuid, groupName, description} objects (not bare guid strings as first assumed), mapped down to just the guids since names/descriptions are already available from Permission Master's own list
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

**Academic module (`src/lib/api/academic/*`) — real backend wiring by domain:**

| Domain | Status | Notes |
|---|---|---|
| `faculty.ts` | Real | `campusGuid`/`deanEmployeeGuid` FKs; `deanName` from the backend is often `null` — the page falls back to resolving it client-side via `useEmployees()` |
| `campus.ts` | Real | Full CRUD incl. delete |
| `country.ts` | Real | Also consumed by Employee modals' country dropdown |
| `designation.ts` | Real | |
| `department.ts` | Real | |
| `permissionGroup.ts` | Real | Backs the wizard in `usePermissionWizard.ts` |
| `intake.ts` | Real | Create/Update require `lastDateForReRegistration`/`grievanceStartDate`/`grievanceEndDate` non-empty — confirmed by a real `validation_error` ("must not be empty") despite `CreateIntakeInput` typing them nullable; both New/EditIntakeModal now mark them required. `durationInWeeks` must be computed with `Math.ceil`, not `Math.round` — rounding down a fractional week count caused the backend's own `semesterEndDate ≤ semStart + (durationInWeeks-2) weeks` re-validation to reject a date the user actually entered |
| `programLevel.ts` | Real | Backs `/academic/programme-level`; create/update payload omits `semCount`/`currencyCode`/`currencyName` (server-derived) even though the GET response returns them. **Currency field is `currencyGuid: string`, not `intCurrency: number`** — sending `intCurrency` (Currency Master's key) fails with `"Currency is required."` The correct source is `useFinanceCurrencies()` (real `currencyGuid`), not `useCurrencies()` (Currency Master, no reliable guid) |
| `programGroup.ts` | Real | Backs `/academic/programme-group` |
| `stream.ts` | Real | Backs `/config/specialization` (route renamed from `/config/stream-master` — type/hook/file still say "Stream" since the backend fields do too); full CRUD incl. delete |
| `enquiryStatus.ts` | Real | Backs `/config/enquiry-status`; full CRUD incl. delete |
| `followUpStatus.ts` | Real | Backs `/config/followup-status`; full CRUD incl. delete; has an `isClose: number` 0/1 flag (not a bool), same convention as `country.ts`'s `defaultCountry` |
| `weekday.ts` | Real | Backs `/config/weekdays`; full CRUD incl. delete; `dayCode` casing isn't guaranteed by the backend — the table cell forces it with an `uppercase` CSS class rather than trusting the stored value |
| `unitType.ts` | Real | Backs `/config/unit-type`; full CRUD incl. delete |
| `unitCategory.ts` | Real | Backs `/config/unit-category`; full CRUD incl. delete |
| `repetitionTag.ts` | Real | Backs `/academic/repetition-tag`; full CRUD incl. delete |
| `courseUnit.ts` | Real | Backs `/academic/course-units` (2-step modal) |
| `programMaster.ts` | Real (create + list) | Backs `/academic/programme-master`; create goes through `apiPostForm` (`/api/v1/academic/program-master/save-complete`, multipart); list hits `GET /api/v1/academic/program-master?search=`. The confirmed list response replaced the old guessed `ProgramMaster` type — notably `streamGuids: string[]` (plural array; create only accepts one `streamGuid`), `currencyGuid` (nullable, seen `null` in every sample so far) instead of create's `currencyCode`, and `yearCount`/`semCount` echoed back directly rather than needing a separate programLevel lookup. GetById/Update/Delete still unconfirmed — Edit mode remains local-only. The table resolves `programGroupGuid`/`programLevelGuid`/`facultyGuid`/`streamGuids` to display names client-side via `useProgramGroups`/`useProgramLevels`/`useFaculties`/`useStreams`. Fee-line `intLedger`/`ledgerGuid`/`ledgerNum` are sourced from the real `useLedgers()` (previously hardcoded to one fake ledger regardless of the dropdown selection) |
| `employee.ts` (own `src/lib/api/employee/`) | Real | `isApproved: boolean`, not a status string. Also `assignEmployeePermissionGroups`/`getEmployeePermissionGroups` (`PUT`/`GET /api/v1/users/admin/users/{employeeGuid}/permission-groups`) — see the Employee Permission Groups note below the table |
| `permissionCatalog.ts` (own `src/lib/api/users/`) | Real | |
| `skill.ts` | **Still mock-only** | |

`currency.ts` and `ledger.ts` used to live in this folder — both have since moved out: `currency.ts` relocated (as-is) to `lib/api/finance/currencyMaster.ts`, and the old mock-only `ledger.ts` was deleted outright now that Finance's real `lib/api/finance/ledger.ts` is the only ledger master.

For any still-mock module: real endpoints don't exist yet; each keeps an in-memory array so create/update mutations visibly work end-to-end (react-query invalidates the list query on success). When migrating one: swap the mock-only body for `apiGet`/`apiPost`/`apiPut`/`apiDelete` calls gated behind `MOCK_AUTH`, and remember a 2xx response can come back with a `null` body (cookies-only auth / no-content success) — normalize `null` to `[]` before `.filter()`/`.map()`.

To migrate another page to this pattern: copy the shape of `faculty.ts` + `useFaculties.ts` + `config/faculty-master/page.tsx` + `NewFacultyModal.tsx`/`EditFacultyModal.tsx` — that's the current reference implementation (includes list, create, update, delete, and a client-side FK-name-resolution fallback).

**Employee Permission Groups (`AssignEmployeePermissionsModal.tsx` / `EditEmployeePermissionsModal.tsx`, both in `modals/employee/`):** two separate actions on `/employee/employee-master` that both let you pick one or more Permission Master groups (`usePermissionGroups()`), preview each group's accessible/not-accessible breakdown per module/page — walked against the *full* permission catalog (`usePermissionCatalog()`), not just the group's own permission list, via `buildBreakdown()` in `src/lib/permissionBreakdown.ts` — and save the combined set via `useAssignEmployeePermissionGroups()` (`PUT`). Both modals seed their starting tabs from `useEmployeePermissionGroups(employeeGuid, isOpen)` (`GET`) and call the identical mutation on submit. They're kept as two separate components/buttons per product request even though they're functionally near-identical — a real tradeoff, since any future behavior change needs updating in both places rather than one shared implementation.

**Admission module (`src/lib/api/admission/*`) — new, all real, route under `/config/*`:**

| Domain | Status | Notes |
|---|---|---|
| `enquirySource.ts` | Real | Backs `/config/enquiry-source`; `/api/v1/admissions/isbat-enquiry-sources`; single field (`sourceName`); full CRUD, fetch-by-guid Edit convention |
| `followUpMode.ts` | Real | Backs `/config/followup-mode`; `/api/v1/admissions/followup-modes`; single field (`followUpModeName`); same conventions |
| `interestLevel.ts` | Real | Backs `/config/interest-level`; `/api/v1/admissions/interest-levels`; single field (`interestLevelName`); same conventions |

All three: GET returns a plain array (`data: [...]`, not the paginated `items` envelope), matching `weekday.ts`'s shape. PUT/DELETE/GetByGuid follow the same `/{guid}` REST convention as the rest of the app by inference — not explicitly confirmed against a spec for any of these three.

**Finance module (`src/lib/api/finance/*`) — all real:**

| Domain | Status | Notes |
|---|---|---|
| `cooperate.ts` | Real | Backs `/finance/cooperates`; two plain string fields (`cooperateCode`/`cooperateName`), full CRUD incl. delete |
| `discount.ts` | Real | Backs `/finance/discounts`; `calcType` (1=Amount/2=Percentage) and `status` are **int enums on the wire**, not strings — a first attempt sent `calcType: "Percentage"` and got a real `validation_error` back from the backend. `CALC_TYPE_VALUES`/`CALC_TYPE_LABELS` convert both ways at the mutation boundary; the modal itself still shows/picks the string label |
| `ledger.ts` | Real | Backs `/finance/ledgers`; full CRUD, fetch-by-guid Edit convention. `Ledger` carries `intLedger`/`ledgerNum` (legacy ints, server-assigned) alongside `ledgerGuid` — added specifically because `programMaster.ts`'s `FeeLineInput` needs all three |
| `currencyMaster.ts` | Real (GET/create); update still mock | Backs `/finance/currency-master`; relocated as-is from `/config/currency-master` (formerly `academic/currency.ts`) — internals untouched by the move. Keeps `intCurrency` as its primary key, not `currencyGuid`, even though the type carries an (unreliable/unused-here) `currencyGuid` field. `updateCurrency()` never calls the backend in any mode — it's a local-only mock regardless of `MOCK_AUTH`, so Edit silently doesn't persist |
| `currency.ts` | Real, GET-only | Backs the Currency dropdown in ProcBank and Programme Level modals only (`/api/v1/finance/currencies` — the *same* endpoint `currencyMaster.ts` hits, just unwrapped into a distinct `FinanceCurrency` type keyed by a **confirmed real `currencyGuid`**). No Currency Master page of its own — dropdown lookup only |
| `receiptBook.ts` | Real | Backs `/finance/receipt-books`; `status`/`category`/`bookCategory` are int enums (hardcoded from `Finance/Enums/receipt-book-statuses|categories.bru` and `receipt-categories.bru`, same convention as `discount.ts`). **Update only accepts `status`/`category`/`copy`/`bookCategory`** — `bookCode`/`startNo`/`prefix`/`count` are immutable after creation per the Update.bru docs. No GetByGuid endpoint exists — `EditReceiptBookModal` is seeded from the row already in the list, not fetched fresh |
| `genSet.ts` | Real | Backs `/finance/gen-sets`; two plain text fields (`type` max 10 chars, `condition` max 100 chars), full CRUD incl. delete. A generic key/value lookup table — **its `genSetGuid` is a separate guid space from both `currencyMaster.ts` and `currency.ts`**, even though a GenSet record can represent a currency (`type: "CCY"`) |
| `procGlAccount.ts` | Real | Backs `/finance/proc-gl-accounts`; `status` (1=Active/2=Inactive) and `type` (1=Asset/2=Liability/3=Equity/4=Revenue/5=Expense) are also int enums, same `*_VALUES`/`*_LABELS` conversion pattern; `blocked` is a genuine boolean (no conversion needed) |
| `procBank.ts` | Real | Backs `/finance/proc-banks`; reuses the same `status` 1/2 convention; `currencyGuid` references `currency.ts` above — **not** `currencyMaster.ts`, which has no reliable guid |
| `bank.ts` | Real | Backs `/finance/banks`; full CRUD, fetch-by-guid Edit convention |
| `bankBranch.ts` | Real | Backs `/finance/bank-branches`; `bankGuid` FK resolved client-side via `useBanks()`, same fallback-resolution pattern as `faculty.ts`'s dean name |

**Gotcha — int-encoded enum fields:** when a new domain's sample payload has a field typed as a bare number with no accompanying enum reference (e.g. `calcType`, `status`, `type`, `category`, `bookCategory`), don't assume it's freeform or send a string label — confirm the int↔label mapping against the corresponding `Finance/Enums/*.bru` doc (or ask) first. Guessing wrong doesn't fail type-checking (the field is typed `number` either way) — it only surfaces as a real `validation_error` from the live backend, same as the `discount.ts` `calcType` incident.

**Gotcha — there are three different "currency" guid spaces in this backend**, and picking the wrong one produces a confusing `not_found`/`"Currency is required"` rather than a type error:
1. **Currency Master** (`currencyMaster.ts`, `/api/v1/finance/currencies`, `useCurrencies()`) — keyed by `intCurrency`, the historical/primary key; `currencyGuid` is present on the wire but was long assumed unreliable.
2. **FinanceCurrency lookup** (`currency.ts`, same `/api/v1/finance/currencies` endpoint, `useFinanceCurrencies()`) — a second client-side wrapper around the identical GET, but keyed by the **confirmed real `currencyGuid`** that ProcBank/Programme Level actually need.
3. **GenSet** (`genSet.ts`, `/api/v1/finance/gen-sets`) — a wholly separate generic lookup table; a currency can also be represented here as `{ type: "CCY", condition: "UGX" }` with its own `genSetGuid`, unrelated to either of the above.

When wiring a new domain's currency field, check whether it wants `intCurrency` or `currencyGuid` before assuming — and if `currencyGuid`, source it from `useFinanceCurrencies()`, not `useCurrencies()`.

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
- **Fetch-by-guid convention** (most real-hook-layer domains: programLevel, stream, enquiryStatus, followUpStatus, weekday, enquirySource, followUpMode, interestLevel, ledger, currency master, bank, bankBranch, genSet, cooperate, discount, procGlAccount, procBank): rather than the page passing the already-loaded row into the Edit modal, the page passes only the **guid**; the modal itself calls a `useX(guid, isOpen)` query (`enabled: isOpen && !!guid`) that hits a `getXById` real GET-by-guid endpoint. This guarantees the edit form always reflects the latest server state rather than a possibly-stale row from the list cache. These modals add `isLoading`/`isError` branches (a "Loading X details…" placeholder and a `FailurePopup` "Couldn't Load X") before the main form render, and the corresponding hook's update mutation invalidates both the list query key and the `[...key, guid]` query key on success.
- **Row-passed exception (receiptBook only):** no GetByGuid endpoint exists for receipt books, so `EditReceiptBookModal` takes the already-loaded row as a prop instead, same as the old pre-fetch-by-guid convention used elsewhere before it was introduced.

### Number inputs — use `string` state, not `number`
Controlled number inputs must use `string` state (e.g. `useState('25')`) so backspace works correctly. `+e.target.value` coerces `""` to `0` and prevents clearing the field. Parse with `+value || 0` only at computation time.

---

## Sidebar & Navigation (`src/components/Sidebar.tsx`)

- **Rail** (left icon strip): Admission, Academic, Finance, Student, Attendance (locked), Analytics (locked), Employee, Config, then a spacer and Admin/User & Role (locked). Finance is a full rail like Admission/Academic/Student/Employee/Config, with its own `finance/layout.tsx` (no auth gate, same as Config/Employee/Student). Clicking the active rail's own icon toggles the panel open/closed; clicking a different rail switches `activeRail` and forces the panel open.
- **Panel** nav items render as `next/link` `<Link>` elements (not `<div onClick={router.push}>`), so browser-native ctrl/cmd-click "open in new tab" and right-click work, and Next can prefetch them.
- **Config panel is grouped into four collapsible sub-sections** (via `sbSection(...)`): **Organization** (Faculty, Department, Designation, Campus, Country), **Academic Setup** (Specialization, Skill, Unit Type, Unit Category, Weekdays), **Admissions** (Enquiry Status, Enquiry Source, Followup Status, Followup Mode, Interest Level), **Access Control** (Permission Master). The old flat "Core Configuration" single section — and its short-lived "Finance" sub-section holding Ledger/Currency Master — no longer exist; both left Config for Finance.
- **Finance panel is grouped into two sub-sections**: **Finance Core** (Cooperates, Discounts, Ledgers, Currency Master, Receipt Books, General Settings) and **Banking** (Banks, Bank Branches, Proc Banks, Proc GL Accounts).
- On mount, `Sidebar` also eagerly calls `router.prefetch()` for **every** route across all six modules (not just the active rail), since a rail's `<Link>`s don't exist in the DOM — and so can't self-prefetch — until that rail is actually clicked once.
- A small circular `.sb-toggle` button is pinned to the sidebar's right edge (`position: absolute; right: -12px` relative to the fixed-position `.sidebar`) to manually collapse/expand the panel, independent of the rail-click toggle.
- Each module's `layout.tsx` owns its own `panelOpen`/`collapsedSections`/`activeRail` state independently — switching modules unmounts one layout and mounts another, so panel-open state does **not** carry over between modules (only within a module, across page navigations, since the layout doesn't remount there).
- Nav item icons are picked by hand per `sbItem(...)` call, not derived from anything — nothing stops two items reusing the same LineIcons name across different rails/sections (this happened once between `enquiry-status` and `followup-status`, both briefly `flag`; `followup-status` now uses `phone` instead). Check the existing icon list in the target rail's block before picking one for a new item, and verify the icon actually exists in LineIcons 4.0 before using it — `lni-percent` was tried for Discounts and doesn't exist in this font version (silently renders nothing); `lni-tag` was used instead.

---

## Auth, Sessions & Cookies

- **Tokens:** the .NET backend issues httpOnly cookies (`erp_access`, `erp_refresh`-equivalent) on login/refresh responses. Client JS never reads these directly, and has no way to read the access token's expiry client-side.
- **Reactive refresh-and-retry (`src/lib/api/client.ts`):** every real call (`post`/`get`/`apiPost`/`apiPut`/`apiDelete`/`apiGet`) detects an "unauthorized" response and, for any endpoint other than `/auth/login`, `/auth/refresh`, `/auth/logout`, calls a shared `handleUnauthorized()` helper which refreshes (deduped across concurrent 401s via one in-flight promise) and retries the original call once. **Only a definitive `AuthError` from the refresh call itself triggers a hard redirect to `/login`** — a network error/timeout hitting `/auth/refresh` throws a plain error instead and is left to surface as a normal failure, so a transient blip doesn't force a logout. There is no proactive polling; refresh only fires reactively on a real 401, or once on `academic/layout.tsx` mount as a fallback (below).
- **Session identity (`src/lib/session.ts`):** `setSessionIdentity({ displayName })` is set the moment login/OTP actually succeeds. `academic/layout.tsx` reads `getSessionIdentity()` **synchronously via a lazy `useState` initializer**, so an already-authenticated user navigating in from another module skips any auth-check spinner entirely; it only awaits `refreshSession()` (with a spinner) when identity truly isn't known locally yet (fresh tab / restored session). `academic/layout.tsx` is the *only* layout with this gate — Config/Employee/Student/Admission/Finance layouts render Header/Sidebar immediately with no auth check and no real `displayName` (Header defaults to `"Administrator"`).
- **`middleware.ts`** (repo root, edge runtime): coarse presence-check guard — redirects to `/login` only when the path starts with `/academic` and the `erp_access` cookie is absent. **`/config/*`, `/employee/*`, `/student/*`, `/admission/*`, `/finance/*` are NOT covered by this guard** — only `academic/layout.tsx`'s own client-side check protects the Academic module; the other modules currently have no route-level protection at all beyond whatever the backend itself enforces per-request. Skipped entirely when `NEXT_PUBLIC_AUTH_MOCK=true`.
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

- **Icons:** LineIcons 4.0 from CDN — `<i className="lni lni-{name}"></i>`. Not every plausible icon name exists in this version — verify against the CDN stylesheet before using one (see Sidebar & Navigation above for a real example of a guess that failed silently).
- **Fonts (CSS vars):** `--font-serif` (Source Serif 4) · `--font-sans` (Inter Tight) · `--font-mono` (JetBrains Mono)

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL for API calls (empty = relative paths in dev, proxied via `next.config.mjs` rewrites to `API_GATEWAY_URL`) |
| `API_GATEWAY_URL` | Server-only: actual backend URL the Next server proxies `/api/*` to (not exposed to the browser). If unset, the rewrite is skipped entirely rather than producing an invalid `"undefined/api/*"` destination that would fail the build. |
| `NEXT_PUBLIC_AUTH_MOCK` | `"true"` → skip real auth API, use hardcoded mock login/OTP/refresh responses, and skip the `middleware.ts` cookie guard. Also gates each `src/lib/api/**` domain module independently — see the Data & API Architecture table for which ones actually check it. |

---

## Reference Bruno Collections (repo root)

Root-level `Admissions/` and `Finance/` directories are [Bruno](https://www.usebruno.com/) API-collection files (`.bru`) — request/response specs for the real backend, not app source. Not part of the Next.js build; useful for confirming exact field names, enum values, and payload shapes before wiring a new domain (several real mismatches this round — `discount.ts`'s `calcType`, `programLevel.ts`'s `currencyGuid` — were only caught by cross-checking these). `Finance/Enums/*.bru` in particular documents every int-enum's value↔label mapping.
