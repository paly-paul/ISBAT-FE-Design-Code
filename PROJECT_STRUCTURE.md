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
/admission/online-enquiry          → online enquiry form              ← real hook layer (POST /api/v1/admissions/enquiries; enquirySource hardcoded to 1 for this page — see note below)
/admission/kiosk-enquiry           → self-service kiosk enquiry
/admission/ondesk-enquiry          → on-desk enquiry form             ← real hook layer (same create endpoint as online-enquiry; enquirySource hardcoded to 2, unconfirmed against a spec)
/admission/enquiry-list            → enquiry list                     ← real hook layer (paginated GET; "View" opens EnquiryAssignModal to assign Advisor/Programme/Campus)
/admission/enquiry-followup-master → enquiry followup master          ← real hook layer (ALL follow-ups, paginated; "+ Add Follow-up" create form has heavily-unconfirmed int fields — see note below)
/admission/enquiry-followup        → enquiry followup                 ← real hook layer (follow-ups scoped to the authenticated advisor via GetByAdvisor, paginated; no create form here)
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
/academic/batch-management         → batch setup & editing              ← real hook layer (full CRUD; intProgram/intSem/intStream/batchTime/bInCharge are int-only FKs with no confirmed guid mapping — see note below)
/academic/room-management          → room/venue management
/academic/session-movement         → session movement / repeat
/academic/repetition-tag           → repetition tag master              ← real hook layer
/academic/course-units             → course unit builder (2-step modal) ← real hook layer
/academic/programme-level          → programme level master             ← real hook layer (Create/Update send currencyGuid — see note below)
/academic/programme-group          → programme groups                   ← real hook layer
/academic/programme-master         → programme builder (multi-step modal) ← real hook layer (create + list confirmed — create via apiPostForm/multipart, list via GET ?search=; fee-line ledger wired to the real Finance Ledger master; Update/Delete/GetByGuid still unconfirmed, Edit mode still local-only)
/academic/fee-structure            → fee structure & items               ← partially real (standalone page, unrelated to Programme Master's embedded fee-structure step — see note below; the header Save button is wired to a real endpoint, the per-semester line-item Save button is still a mock stub)
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
/config/enquiry-source             → "Isbat Enquiry Source" in the UI    ← real hook layer (/api/v1/admissions/isbat-enquiry-sources; single-field: sourceName; display label renamed from "Enquiry Source" — route/file/hook names unchanged)
/config/enquiry-source-master      → "Enquiry Source" in the UI          ← real hook layer (a DIFFERENT resource from the one above: /api/v1/admissions/enquiry-sources, single-field: enquirySourceName, own guid space — see note below)
/config/followup-status            → admission enquiry followup status master ← real hook layer (/api/v1/admissions/follow-up-statuses; has an isClose 0/1 flag)
/config/followup-mode              → admission followup mode master      ← real hook layer (/api/v1/admissions/followup-modes; single-field: followUpModeName)
/config/interest-level             → admission interest level master     ← real hook layer (/api/v1/admissions/interest-levels; single-field: interestLevelName)
/config/weekdays                   → weekday master                     ← real hook layer (/api/v1/academic/weekdays)
/config/unit-type                  → unit type master                   ← real hook layer
/config/unit-category               → unit category master               ← real hook layer
/config/batch-times                → batch time master                  ← real hook layer (/api/v1/academic/batchtimes; two plain fields: batchTime/batchTimeCode; fully confirmed CRUD, no int-enum gotchas)

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

**There are now two, unrelated "Enquiry Source" masters, both under `/config/*` Admissions.** `/config/enquiry-source` backs `isbat-enquiry-sources` (`enquirySource.ts`, `isbatSourceGuid`/`sourceName`) and is now labeled **"Isbat Enquiry Source"** in the sidebar/page UI to disambiguate it. `/config/enquiry-source-master` is a newer, genuinely separate resource — plain `enquiry-sources` (`enquirySourceMaster.ts`, own file: `src/lib/api/admission/enquirySourceMaster.ts` / `src/hooks/admission/useEnquirySourceMasters.ts` / `src/app/config/enquiry-source-master/page.tsx`), labeled just **"Enquiry Source"**. The two are NOT interchangeable — they have different guids, different field names, and different backend tables. `Enquiry.sourceName` (the admission enquiry record) is populated from this second master's `enquirySourceName`, not from the Isbat one.

**Batch Times (`/config/batch-times`) lives under Config → Academic Setup despite backing `/api/v1/academic/batchtimes`** — same "route module vs. code location" split as Intake/Programme Level/Programme Group; its API/hook files live in `src/lib/api/academic/batchTime.ts` / `src/hooks/config/useBatchTimes.ts`.

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
│   │   ├── dashboard/, kiosk-enquiry/, payment/, filing/, vetting/,
│   │   │   registration/, applicants/, applicant-profile/, enquiry-form/
│   │   ├── online-enquiry/page.tsx    ← useCreateEnquiry(); First/Last Name/Phone/Email/DOB/Campus/Intake/Programme/Enquiry Source all real, enquirySource hardcoded to 1
│   │   ├── ondesk-enquiry/page.tsx    ← same useCreateEnquiry(); enquirySource hardcoded to 2 (unconfirmed); Enquiry Channel/Preferred Study Mode kept but decorative, not sent
│   │   ├── enquiry-list/page.tsx      ← useEnquiries(page, pageSize) (real, paginated); "View" opens EnquiryAssignModal
│   │   ├── enquiry-followup-master/page.tsx ← useEnquiryFollowUps(page, pageSize) (ALL follow-ups); "+ Add Follow-up" → NewFollowUpLogModal; "View" → EnquiryAssignModal
│   │   └── enquiry-followup/page.tsx        ← useEnquiryFollowUpsByAdvisor(page, pageSize) (advisor-scoped); "View" → EnquiryAssignModal; no create form on this page
│   ├── academic/
│   │   ├── layout.tsx          # own panelOpen/collapsedSections/activeRail state + real session check (see Auth section) — the ONLY layout with an auth gate
│   │   ├── page.tsx            # redirect → /academic/acad-dashboard
│   │   ├── acad-dashboard/, intake-master/ (← useIntakes), skill-master/,
│   │   │   room-management/, session-movement/, repetition-tag/, course-units/, programme-level/,
│   │   │   programme-group/, programme-master/, fee-structure/, timetable/, odl-applications/,
│   │   │   odl-reconciliation/, student-lookup/
│   │   ├── batch-management/page.tsx  ← useBatches(pageNumber, pageSize) (real, full CRUD); Programme/Semester/Stream/Batch Time columns resolved by list-position guess, not a confirmed id — see Data & API Architecture
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
│   │   ├── enquiry-source/page.tsx     ← useEnquirySources/useCreateEnquirySource/useUpdateEnquirySource/useDeleteEnquirySource (hooks/lib live under .../admission/, not .../config/); UI label "Isbat Enquiry Source"
│   │   ├── enquiry-source-master/page.tsx ← useEnquirySourceMasters/useCreateEnquirySourceMaster/useUpdateEnquirySourceMaster/useDeleteEnquirySourceMaster (hooks/lib under .../admission/); a DIFFERENT resource from enquiry-source above — see note above the directory tree; PUT/DELETE/GetByGuid inferred by REST convention, not confirmed against a spec
│   │   ├── followup-status/page.tsx    ← useFollowUpStatuses/useCreateFollowUpStatus/useUpdateFollowUpStatus/useDeleteFollowUpStatus
│   │   ├── followup-mode/page.tsx      ← useFollowUpModes/useCreateFollowUpMode/useUpdateFollowUpMode/useDeleteFollowUpMode (hooks/lib under .../admission/)
│   │   ├── interest-level/page.tsx     ← useInterestLevels/useCreateInterestLevel/useUpdateInterestLevel/useDeleteInterestLevel (hooks/lib under .../admission/)
│   │   ├── weekdays/page.tsx           ← useWeekdays/useCreateWeekday/useUpdateWeekday/useDeleteWeekday
│   │   ├── unit-type/page.tsx          ← useUnitTypes/useCreateUnitType/useUpdateUnitType/useDeleteUnitType
│   │   ├── unit-category/page.tsx      ← useUnitCategories/useCreateUnitCategory/useUpdateUnitCategory/useDeleteUnitCategory
│   │   └── batch-times/page.tsx        ← useBatchTimes/useCreateBatchTime/useUpdateBatchTime/useDeleteBatchTime (hooks/lib under .../academic/); fully confirmed CRUD spec, no int-enum gotchas
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
│       │   ├── New/EditIntakeModal.tsx, New/EditRoomModal.tsx,
│       │   │   RoomMgmtModal.tsx, New/EditRepTagModal.tsx                          # Intake modals require lastDateForReRegistration/grievanceStartDate/grievanceEndDate (backend-confirmed, despite the type marking them nullable) and compute durationInWeeks with Math.ceil, not Math.round — see note below
│       │   ├── NewBatchModal.tsx / EditBatchModal.tsx     # real; intProgram/intSem/intStream/batchTime/bInCharge sent as list position (unconfirmed id) — see Data & API Architecture; Edit can't prefill Stream (no reverse int→guid map) or Batch In-Charge (not returned by GetByGuid at all), both must be re-picked every edit
│       │   ├── NewBatchTimeModal.tsx / EditBatchTimeModal.tsx    # real, fetch-by-guid Edit convention; fully confirmed 2-field CRUD (batchTime/batchTimeCode), no gotchas
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
│           ├── EnquiryFormModal.tsx / StudentProfileModal.tsx / ImportSourceModal.tsx / ImportCrmModal.tsx / ImportOdelModal.tsx    # still mock — EnquiryFormModal ("New Enquiry" on enquiry-list) has no API wiring at all, just a local setSaved(true)
│           ├── EnquiryAssignModal.tsx      # real; fetch-by-guid (useEnquiry), PUT /api/v1/admissions/enquiries/:guid; shows the enquiry read-only (name/phone/email/date/source/remarks — none of these are in the update payload) plus editable Advisor/Programme/Campus (campusGuid required); reused as the "View" action on enquiry-list, enquiry-followup-master, AND enquiry-followup
│           ├── NewFollowUpLogModal.tsx     # real POST /api/v1/admissions/enquiry-followups, but intEnquiry/followUpStatus/followUpMode/enquiryStatus/interestLevel are all sent as 1-based list position, not a confirmed backend id — see Data & API Architecture note
│           ├── LogFollowupModal.tsx / AllocateFollowupModal.tsx    # orphaned — both fully mock, no longer imported by any page (enquiry-followup/enquiry-followup-master were rewired onto EnquiryAssignModal/NewFollowUpLogModal instead); left in place, not deleted
│           ├── VettingReviewModal.tsx / CompleteRegistrationModal.tsx
│           └── RejectModal.tsx / OnboardModal.tsx
├── hooks/
│   ├── config/                  # react-query "use-case" layer for most /config/* pages — one file per domain
│   │   ├── useFaculties.ts / useCampuses.ts / useCountries.ts / useDepartments.ts / useDesignations.ts / usePermissionGroups.ts
│   │   ├── useStreams.ts (backs /config/specialization) / useEnquiryStatuses.ts / useFollowUpStatuses.ts / useWeekdays.ts   (all real; each exports a useX(guid, enabled) single-record query for its Edit modal)
│   │   ├── useUnitTypes.ts / useUnitCategories.ts   (real; same useX(guid, enabled) convention)
│   │   ├── useBatchTimes.ts    (real; backs /config/batch-times; lib file lives under lib/api/academic/ not lib/api/config/ — same split as useStreams/useEnquiryStatuses)
│   │   └── useSkills.ts    (still mock underneath)
│   ├── admission/               # react-query layer for Admission-domain masters/features that route under /config/* or /admission/*
│   │   ├── useEnquirySources.ts / useInterestLevels.ts / useFollowUpModes.ts   (all real; useX(guid, enabled) convention for Edit modals)
│   │   ├── useEnquirySourceMasters.ts   # real; backs /config/enquiry-source-master (the OTHER "Enquiry Source" — see note above the directory tree)
│   │   ├── useEnquiries.ts     # real; useEnquiries(page, pageSize) list, useCreateEnquiry(), useEnquiry(guid, enabled), useUpdateEnquiry() — backs online-enquiry/ondesk-enquiry (create) and enquiry-list/EnquiryAssignModal (list, get, update)
│   │   └── useEnquiryFollowUps.ts   # real; useEnquiryFollowUps(page, pageSize) (all), useEnquiryFollowUpsByAdvisor(page, pageSize) (advisor-scoped, distinct cache key), useCreateEnquiryFollowUp() (heavily unconfirmed fields — see Data & API Architecture)
│   ├── academic/
│   │   ├── useIntakes.ts        # kept "academic" naming (backs /academic/intake-master)
│   │   ├── useProgramLevels.ts / useProgramGroups.ts   # real; back /academic/programme-level and /academic/programme-group
│   │   ├── useRepetitionTags.ts / useCourseUnits.ts / useProgramMaster.ts   # real; back /academic/repetition-tag, /course-units, /programme-master (useProgramMaster.ts now also exports useProgramMasters() — the confirmed list query)
│   │   ├── useBatches.ts       # real; backs /academic/batch-management; useBatches(pageNumber, pageSize), useBatch(guid, enabled), full CRUD
│   │   └── useSemesters.ts     # real, GET-only; useSemestersForProgram(programGuid, enabled) — cascading Semester dropdown for Batch create/edit and the batch-management table's semester-name resolution
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
        │   ├── batch.ts           # /api/v1/academic/batches; full CRUD real, but intProgram/intSem/intStream/batchTime/bInCharge are int-only FKs with no confirmed guid source anywhere — see Data & API Architecture
        │   ├── batchTime.ts       # /api/v1/academic/batchtimes; backs /config/batch-times (route lives in Config, code lives here); fully confirmed 2-field CRUD, no gotchas
        │   ├── semester.ts        # /api/v1/academic/semesters/dropdownforprogram; GET-only, {semesterGuid, semName} scoped to a programGuid — no numeric id exposed
        │   └── skill.ts                                                                                              (still mock)
        │   # currency.ts and ledger.ts used to live here — currency.ts moved to lib/api/finance/currencyMaster.ts,
        │   # ledger.ts was deleted outright (superseded by the real lib/api/finance/ledger.ts)
        ├── admission/             # per-domain data-access modules for Admission-domain masters/features routed under /config/* or /admission/*
        │   ├── enquirySource.ts   # /api/v1/admissions/isbat-enquiry-sources; UI label "Isbat Enquiry Source"
        │   ├── enquirySourceMaster.ts  # /api/v1/admissions/enquiry-sources — a DIFFERENT resource from enquirySource.ts above, own guid space; backs /config/enquiry-source-master, UI label plain "Enquiry Source"
        │   ├── followUpMode.ts    # /api/v1/admissions/followup-modes
        │   ├── interestLevel.ts   # /api/v1/admissions/interest-levels
        │   ├── enquiry.ts         # /api/v1/admissions/enquiries; full CRUD real (list paginated, create, getById, update); EnquiryUpdateInput is a narrower shape than the create input — see Data & API Architecture
        │   └── enquiryFollowUp.ts # /api/v1/admissions/enquiry-followups; list + getbyadvisor real and fully resolved (name strings, no numeric ids at all); create is real-endpoint-real but intEnquiry/followUpStatus/followUpMode/enquiryStatus/interestLevel have no confirmed numeric source — see Data & API Architecture
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
| `batchTime.ts` | Real | Backs `/config/batch-times`; `/api/v1/academic/batchtimes`; two plain fields (`batchTime` max 50 chars, `batchTimeCode` max 10 chars); full CRUD incl. delete; fully confirmed spec, no int-enum surprises — the reference implementation to copy for a genuinely clean new master |
| `semester.ts` | Real, GET-only | `/api/v1/academic/semesters/dropdownforprogram?programGuid=`; `{semesterGuid, semName}[]` scoped to one programme; no numeric id exposed, no Semester Master page of its own — dropdown lookup only, used by Batch create/edit |
| `batch.ts` | Real (full CRUD) | Backs `/academic/batch-management`; `/api/v1/academic/batches`. **`intProgram`/`intSem`/`intStream`/`batchTime`/`bInCharge` are legacy int FKs with no confirmed guid-based source anywhere reachable from the frontend** — checked ProgramMaster, Stream, BatchTime (incl. its own `/batchtimes/dropdown`), Semester (`dropdownforprogram`), and Employee; all only expose guids, even in dedicated dropdown endpoints. Create/Edit forms send each as **that option's 1-based position in its fetched list** (not a confirmed id) — flagged in-UI via a warning banner. The list table resolves Programme/Semester/Stream/Batch Time names the same way, in reverse (`list[intValue - 1]`); Semester additionally requires guessing `intProgram → programGuid` first, then fetching *that* programme's semester list and guessing again — two compounded guesses. `Update` per `Update.bru` only actually applies `intStream`/`bStartDate`/`bEndDate`/`bInCharge` — `batchCode`/`batchTime` are accepted in the body (required by validation) but silently ignored server-side, so `EditBatchModal` just echoes back the existing values for those two rather than offering a picker. `GetByGuid` doesn't return `bInCharge` at all, so Edit can never prefill it — must be re-selected on every edit, same for Stream (no reverse int→guid map). Treat anything created/updated through these forms as unverified until the backend confirms the real int mappings |
| `skill.ts` | **Still mock-only** | |

`currency.ts` and `ledger.ts` used to live in this folder — both have since moved out: `currency.ts` relocated (as-is) to `lib/api/finance/currencyMaster.ts`, and the old mock-only `ledger.ts` was deleted outright now that Finance's real `lib/api/finance/ledger.ts` is the only ledger master.

For any still-mock module: real endpoints don't exist yet; each keeps an in-memory array so create/update mutations visibly work end-to-end (react-query invalidates the list query on success). When migrating one: swap the mock-only body for `apiGet`/`apiPost`/`apiPut`/`apiDelete` calls gated behind `MOCK_AUTH`, and remember a 2xx response can come back with a `null` body (cookies-only auth / no-content success) — normalize `null` to `[]` before `.filter()`/`.map()`.

To migrate another page to this pattern: copy the shape of `faculty.ts` + `useFaculties.ts` + `config/faculty-master/page.tsx` + `NewFacultyModal.tsx`/`EditFacultyModal.tsx` — that's the current reference implementation (includes list, create, update, delete, and a client-side FK-name-resolution fallback).

**Employee Permission Groups (`AssignEmployeePermissionsModal.tsx` / `EditEmployeePermissionsModal.tsx`, both in `modals/employee/`):** two separate actions on `/employee/employee-master` that both let you pick one or more Permission Master groups (`usePermissionGroups()`), preview each group's accessible/not-accessible breakdown per module/page — walked against the *full* permission catalog (`usePermissionCatalog()`), not just the group's own permission list, via `buildBreakdown()` in `src/lib/permissionBreakdown.ts` — and save the combined set via `useAssignEmployeePermissionGroups()` (`PUT`). Both modals seed their starting tabs from `useEmployeePermissionGroups(employeeGuid, isOpen)` (`GET`) and call the identical mutation on submit. They're kept as two separate components/buttons per product request even though they're functionally near-identical — a real tradeoff, since any future behavior change needs updating in both places rather than one shared implementation.

**Admission module (`src/lib/api/admission/*`) — real, routed under `/config/*` and `/admission/*`:**

| Domain | Status | Notes |
|---|---|---|
| `enquirySource.ts` | Real | Backs `/config/enquiry-source` (UI label "Isbat Enquiry Source"); `/api/v1/admissions/isbat-enquiry-sources`; single field (`sourceName`), keyed by `isbatSourceGuid`; full CRUD, fetch-by-guid Edit convention |
| `enquirySourceMaster.ts` | Real | Backs `/config/enquiry-source-master` (UI label plain "Enquiry Source") — a genuinely **different** resource from `enquirySource.ts`, own guid space (`enquirySourceGuid`), single field `enquirySourceName`; `/api/v1/admissions/enquiry-sources`; full CRUD, fetch-by-guid Edit convention |
| `followUpMode.ts` | Real | Backs `/config/followup-mode`; `/api/v1/admissions/followup-modes`; single field (`followUpModeName`); same conventions |
| `interestLevel.ts` | Real | Backs `/config/interest-level`; `/api/v1/admissions/interest-levels`; single field (`interestLevelName`); same conventions |
| `enquiry.ts` | Real | Backs `/admission/online-enquiry`, `/admission/ondesk-enquiry` (create), `/admission/enquiry-list` + `EnquiryAssignModal` (list/getById/update); `/api/v1/admissions/enquiries`. Create payload confirmed via `Create.bru` (`intakeGuid`/`campusGuid`/`programGuid` are real guids — `intIsbatSource` is the one field with no confirmed source, always sent `null`; `enquirySource` is hardcoded per-page: `1` for online, `2` for on-desk, unconfirmed). List/GetByGuid return a richer `EnquiryDto` (adds `enquiryStatus`/`followUpStatus`/`intIsbatSource` as raw ints with no confirmed label mapping, plus `campusName`/`programName` which are always `null` — resolved client-side instead). `EnquiryUpdateInput` (via `Update.bru`) is a **materially narrower** shape than create — only `advisorGuid`/`programGuid`/`campusGuid` (campusGuid required), not a full edit of the original fields |
| `enquiryFollowUp.ts` | Real (list); real endpoint, unconfirmed fields (create) | Backs `/admission/enquiry-followup-master` (list = ALL, create), `/admission/enquiry-followup` (list = `getbyadvisor`, scoped server-side, same `EnquiryFollowUpListDto` shape); `/api/v1/admissions/enquiry-followups` + `/getbyadvisor`. List DTOs fully resolve `enquiryStatusName`/`followUpStatusName`/`enquirySourceName` as strings server-side — no ints to resolve. **Create (`Create.bru`) is a different story**: `intEnquiry`/`followUpStatus`/`followUpMode`/`enquiryStatus`/`interestLevel` are all required ints with no confirmed guid-based source anywhere (checked Enquiry's own GetByGuid/List, and the FollowUpStatus/FollowUpMode/InterestLevel/EnquiryStatus masters' real GET responses — all guid+name only, even their dedicated `/dropdown` endpoints). `NewFollowUpLogModal` sends each as that option's 1-based list position — flagged via an in-modal warning banner |

`enquirySource.ts`/`enquirySourceMaster.ts`/`followUpMode.ts`/`interestLevel.ts`: GET returns a plain array (`data: [...]`, not the paginated `items` envelope), matching `weekday.ts`'s shape. PUT/DELETE/GetByGuid follow the same `/{guid}` REST convention as the rest of the app by inference — not explicitly confirmed against a spec for any of them. `enquiry.ts`/`enquiryFollowUp.ts` are both paginated (`items`/`totalCount`/`pageNumber`/`pageSize` envelope), fully confirmed via real sample responses.

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

**Gotcha — some endpoints want a legacy int FK that genuinely has no guid-based source anywhere:** distinct from the "which currency guid" gotcha above, a handful of newer endpoints (`batch.ts`'s create/list, `enquiryFollowUp.ts`'s create) require plain-number foreign keys (`intProgram`, `intSem`, `intStream`, `batchTime`, `bInCharge`, `intEnquiry`, `followUpStatus`, `followUpMode`, `enquiryStatus`, `interestLevel`) where the corresponding master — even checked via its own dedicated `/dropdown` endpoint — only ever returns a guid, never a matching int. This was confirmed the hard way across several rounds this session (Program Master, Stream, BatchTime, Semester's `dropdownforprogram`, FollowUpStatus/FollowUpMode/InterestLevel/EnquiryStatus real GET responses all checked). The one exception found so far was `Enquiry.intIsbatSource`, which *is* a real populated int on the Enquiry entity despite the Isbat Enquiry Source master itself only exposing a guid — so it's always worth checking a *related* entity's own response before concluding a field is totally unreachable, not just the obvious master's list/dropdown.

**Working pattern for these (adopted this session, not a backend fix):** build the picker as a real dropdown sourced from the actual master (good UX, and the guid is genuinely useful for other purposes), but submit **that option's 1-based position in its fetched list** as the numeric value — clearly flagged in an in-UI warning banner and in code comments, never silently. The same heuristic is applied in reverse for read-side display (`list[intValue - 1]`) where a page wants to show a name instead of a raw number (e.g. `batch-management`'s table) — reverse resolution is strictly a cosmetic best-effort guess, never used to decide what gets sent anywhere. Anything created or updated through one of these forms should be treated as **unverified** until the backend confirms the real int↔guid mapping; when that happens, the fix is contained to one mapping point per field, not a rewrite.

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
- **Config panel is grouped into four collapsible sub-sections** (via `sbSection(...)`): **Organization** (Faculty, Department, Designation, Campus, Country), **Academic Setup** (Specialization, Skill, Unit Type, Unit Category, Weekdays, **Batch Times**), **Admissions** (Enquiry Status, **Isbat Enquiry Source**, **Enquiry Source**, Followup Status, Followup Mode, Interest Level), **Access Control** (Permission Master). The old flat "Core Configuration" single section — and its short-lived "Finance" sub-section holding Ledger/Currency Master — no longer exist; both left Config for Finance.
- **The rail (module icon strip) is "always visible" per its own code comment, but was actually `display: none` below `max-width:900px`** — a real bug (no substitute UI to switch modules on mobile; the hamburger button only toggles the *current* module's panel open/closed). Fixed: `.sb-rail`'s `display:none` was removed and `.main`'s mobile margin override changed from `margin-left: 0 !important` to `margin-left: var(--rail-w) !important`, so the rail stays visible and reserves its own space while the wider slide-out panel still overlays content instead of pushing it, matching the existing desktop overlay behavior for the panel.
- **Finance panel is grouped into two sub-sections**: **Finance Core** (Cooperates, Discounts, Ledgers, Currency Master, Receipt Books, General Settings) and **Banking** (Banks, Bank Branches, Proc Banks, Proc GL Accounts).
- On mount, `Sidebar` also eagerly calls `router.prefetch()` for **every** route across all six modules (not just the active rail), since a rail's `<Link>`s don't exist in the DOM — and so can't self-prefetch — until that rail is actually clicked once.
- A small circular `.sb-toggle` button is pinned to the sidebar's right edge (`position: absolute; right: -12px` relative to the fixed-position `.sidebar`) to manually collapse/expand the panel, independent of the rail-click toggle.
- Each module's `layout.tsx` owns its own `panelOpen`/`collapsedSections`/`activeRail` state independently — switching modules unmounts one layout and mounts another, so panel-open state does **not** carry over between modules (only within a module, across page navigations, since the layout doesn't remount there).
- Nav item icons are picked by hand per `sbItem(...)` call, not derived from anything — nothing stops two items reusing the same LineIcons name across different rails/sections (this happened once between `enquiry-status` and `followup-status`, both briefly `flag`; `followup-status` now uses `phone` instead). Check the existing icon list in the target rail's block before picking one for a new item, and verify the icon actually exists in LineIcons 4.0 before using it — `lni-percent` was tried for Discounts and doesn't exist in this font version (silently renders nothing); `lni-tag` was used instead.

---

## Auth, Sessions & Cookies

- **Tokens:** the .NET backend issues httpOnly cookies (`erp_access`, `erp_refresh` — both names confirmed via a real browser cookie dump) on login/refresh responses. Client JS never reads these directly, and has no way to read the access token's expiry client-side.
- **Reactive refresh-and-retry (`src/lib/api/client.ts`):** every real call (`post`/`get`/`apiPost`/`apiPut`/`apiDelete`/`apiGet`) detects an "unauthorized" response and, for any endpoint other than `/auth/login`, `/auth/refresh`, `/auth/logout`, calls a shared `handleUnauthorized()` helper which refreshes (deduped across concurrent 401s via one in-flight promise) and retries the original call once. **Only a definitive `AuthError` from the refresh call itself triggers a hard redirect to `/login`** — a network error/timeout hitting `/auth/refresh` throws a plain error instead and is left to surface as a normal failure, so a transient blip doesn't force a logout. There is no proactive polling; refresh only fires reactively on a real 401, or once on `academic/layout.tsx` mount as a fallback (below).
- **Session identity (`src/lib/session.ts`):** `setSessionIdentity({ displayName })` is set the moment login/OTP actually succeeds. `academic/layout.tsx` reads `getSessionIdentity()` **synchronously via a lazy `useState` initializer**, so an already-authenticated user navigating in from another module skips any auth-check spinner entirely; it only awaits `refreshSession()` (with a spinner) when identity truly isn't known locally yet (fresh tab / restored session). `academic/layout.tsx` is the *only* layout with this gate — Config/Employee/Student/Admission/Finance layouts render Header/Sidebar immediately with no auth check and no real `displayName` (Header defaults to `"Administrator"`).
- **`middleware.ts`** (repo root, edge runtime): coarse presence-check guard — redirects to `/login` only when the path starts with `/academic` and the `erp_refresh` cookie is absent (**not** `erp_access` — see the fix note below). **`/config/*`, `/employee/*`, `/student/*`, `/admission/*`, `/finance/*` are NOT covered by this guard** — only `academic/layout.tsx`'s own client-side check protects the Academic module; the other modules currently have no route-level protection at all beyond whatever the backend itself enforces per-request. Skipped entirely when `NEXT_PUBLIC_AUTH_MOCK=true`.
- **Fixed this session — middleware was gating on the wrong cookie.** `erp_access` is a short-lived **session cookie** (`Expires: Session`, ~15min JWT inside — confirmed via a real browser cookie dump) that's gone after any browser restart, while `erp_refresh` is long-lived (~1 week real expiry). Gating the guard on `erp_access` alone forced a fresh login far more often than the refresh token's actual lifetime warranted — once `erp_access` was gone but `erp_refresh` was still valid, the client-side silent-refresh fallback in `academic/layout.tsx` (described above) never got a chance to run, because middleware bounced the request to `/login` before any client code executed. Now middleware only redirects when there's no session at all (no `erp_refresh`); if `erp_access` is missing but `erp_refresh` is present, the request is let through and `academic/layout.tsx`'s existing `refreshSession()` fallback handles it silently.
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
