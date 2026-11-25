# Assessment Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Assessment module (including Assessment pages mounted under Analytics and Configuration), the endpoint that fills it, and which of those endpoints are confirmed or likely to return **403 Forbidden** for users who lack certain permissions.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Question Bank Upload
**Tab 1: Question Repository**
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Assessment Category | `/api/v1/assessment/questions/categories` |
| Course Unit ↳ Academic Intake | `/api/v1/assessment/questions/course-units?intakeGuid=&lecturerGuid=` |

**Tab 2: Bulk Excel Import**
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Assessment Category | `/api/v1/assessment/question-bank/categories` |
| Course Unit ↳ Academic Intake | `/api/v1/assessment/question-bank/course-units?intakeGuid=&lecturerGuid=` |
| Select Worksheet ↳ Excel file | `POST /api/v1/assessment/question-bank/sheets` |
| Preview Edit Modal → Question Type, Section | Static (`DQ`/`MCQ`, `Section A`/`B`/`C`) |

### Bulk Exam Scheduler
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Term | Static (`Term 1`, `Term 2`, `Both (Term 1 & 2)`) |
| Campus | `/api/v1/academic/campus/dropdown` |

**Modal & background calls opened on page load**
| Scope → Control | API |
|---|---|
| Bulk Schedule Modal → Mode / Exam Mode | Static (`Online`, `Offline`) |
| Bulk Schedule Modal → Publish Status | Static (`Unpublished`, `Published`) |
| Bulk Schedule Modal → Exam Rule | `/api/v1/assessment/exam-rules?page=1&pageSize=50` |
| Programme GUID lookup (not a visible dropdown) | `/api/v1/academic/program-master/dropdown` |
| Programme Sessions grid (non-dropdown table on load) | `/api/v1/academic/session-management/?intakeGuid=&pageNumber=&pageSize=` |

### Assessment Scheduler (`ia-creation`)
| Dropdown | API |
|---|---|
| Academic Session *(locked read-only field)* | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/assessment/ia-creation/semesters?programGuid=` |

**Modals opened from Assessment Scheduler (CW / CBT / UE & Exam Rule Lookup)**
| Modal → Dropdown | API |
|---|---|
| Schedule Modal → Exam Rule | `/api/v1/assessment/exam-rules?page=1&pageSize=100` |

### IA Evaluation
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Category Filter | Static (`All Categories`, `CW1`, `CW2`, `Test`) |

### CW Rectification
| Dropdown | API |
|---|---|
| Academic intake | `/api/v1/assessment/cw-rectification/intakes` |
| Course unit ↳ Academic intake | `/api/v1/assessment/cw-rectification/intakes/{intakeGuid}/course-units` |
| Attempt (Coursework) ↳ Course unit | `/api/v1/assessment/cw-rectification/intakes/{intakeGuid}/course-units/{courseUnitGuid}/courseworks` |
| Student ↳ Attempt | `/api/v1/assessment/cw-rectification/intakes/{intakeGuid}/course-units/{courseUnitGuid}/courseworks/{courseworkNumber}/students` |

### Project Proposals
**Modals opened from Project Proposals**
| Modal → Dropdown | API |
|---|---|
| Add/Edit Modal → Course Unit | `/api/v1/assessment/project-proposals/units` |
| Add/Edit Modal → Student ↳ Course Unit | `/api/v1/assessment/project-proposals/units/{unitGuid}/eligible-students` |
| Upload Synopsis Modal → Select Project Proposal | `/api/v1/assessment/project-proposals` *(when opened without a preselected row)* |

### Project Reviews
| Dropdown | API |
|---|---|
| Course Unit | `/api/v1/assessment/project-reviews/units` |
| Student ↳ Course Unit | `/api/v1/assessment/project-reviews/units/{unitGuid}/students` |

### Exam Cancel
| Dropdown | API |
|---|---|
| Student *(autocomplete)* | `/api/v1/assessment/exam-cancel/students?searchTerm=` |
| Course Unit ↳ Student | `/api/v1/assessment/exam-cancel/students/{studentGuid}/course-units` |

### Question Paper Vetting (`qp-vetting`)
| Dropdown | API |
|---|---|
| Subject / Course Unit | `/api/v1/assessment/ue-question/course-units` |
| Add/Edit Modal → Section / Level | Static (`Section A`, `Section B`, `Section C`) |

### UE Practical QBank (`question-bank-practical`)
| Dropdown | API |
|---|---|
| Course unit | `/api/v1/assessment/question-bank/practical/course-units` *(page also calls `/api/v1/academic/intakes/dropdown` in background to resolve current intake)* |
| Sheet ↳ Excel file | `POST /api/v1/assessment/question-bank/sheets` |

### Hall Ticket Issuance (`hall-ticket`)
| Dropdown | API |
|---|---|
| Academic Intake *(locked to current)* | `/api/v1/academic/intakes/dropdown` |
| Term Override | Static (`Auto`, `Term 1`, `Term 2`) |
| Search Student *(autocomplete/grid)* | `/api/v1/students/hall-ticket-search` *(selecting a student also calls `/api/v1/students/{guid}` for photo)* |

**Bulk Issue Modal**
| Modal → Dropdown | API |
|---|---|
| Bulk Issue Modal → Programme | `/api/v1/academic/program-master/dropdown` |
| Bulk Issue Modal → Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Bulk Issue Modal → Status / Clearance / Term Override | Static |

### Hall Ticket Print (`hall-print`)
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` *(deep-link `?semCode=` also calls `/api/v1/academic/semesters/filter/by-semcode/{semCode}`)* |
| Term Override / Status Filter | Static |

### Hall Ticket Print All
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Term Override | Static (`Auto`, `Term 1`, `Term 2`) |

### UE Material Print
| Dropdown | API |
|---|---|
| Academic Intake *(disabled)* | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit ↳ Programme + Semester + Intake | `/api/v1/assessment/ue-question-print/course-units?programGuid=&semesterGuid=&intakeGuid=&unitTypes=Theory&unitTypes=Combined` |

### UE QP/Booklet Print
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` *(also calls `/api/v1/academic/intakes/dropdown` silently for current intake, and `/api/v1/academic/program-course-units/{programGuid}` in background for unit types)* |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit ↳ Programme + Semester | `/api/v1/assessment/ue-question-print/course-units?programGuid=&semesterGuid=&intakeGuid=` |

### UE Practical QP Print
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit (Practical) ↳ Programme + Semester | `/api/v1/academic/program-course-units/{programGuid}` *(falls back to `/api/v1/assessment/ue-question-print/course-units?...&unitTypes=Practical` if 403)* |

### UE Project Booklet Print
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit (Project) ↳ Programme + Semester | `/api/v1/academic/program-course-units/{programGuid}` *(no fallback)* |

### UE Attendance
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Semester ↳ Programme | `/api/v1/assessment/ue-attendance/semesters?programGuid=&intakeGuid=` |
| Course Unit ↳ Programme + Semester | `/api/v1/assessment/ue-attendance/units?programGuid=&semesterGuid=` |
| Report Type *(Combined units only)* | Static (`Theory`, `Practical`) |

### UE Mark Import
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit ↳ Programme + Semester | `/api/v1/assessment/ue-mark-import/units?programGuid=&semesterGuid=` |
| Select Sheet ↳ Excel file | `POST /api/v1/assessment/ue-mark-import/sheets` |

### Mark Entry — UE (`mark-ue`)
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Semester ↳ Programme | `/api/v1/assessment/ue-attendance/semesters?programGuid=&intakeGuid=` |
| Course Unit ↳ Programme + Semester | `/api/v1/assessment/ue-detailed-marks/units?programGuid=&semesterGuid=` *(lecturer-scoped; picking a unit then calls `/api/v1/assessment/ue-mark-import/exam`)* |

### Mark Verify — UE (`mark-ue-verify`)
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Semester ↳ Programme | `/api/v1/assessment/ue-attendance/semesters?programGuid=&intakeGuid=` |
| Course Unit ↳ Programme + Semester | `/api/v1/assessment/ue-attendance/units?programGuid=&semesterGuid=` *(picking a unit then calls `/api/v1/assessment/ue-mark-import/exam`)* |

### Exam Mark Import
| Dropdown | API |
|---|---|
| Select sheet ↳ Excel file | `POST /api/v1/assessment/exam-mark-import/sheets` |

### Result & Moderation (`moderation`)
| Dropdown | API |
|---|---|
| Academic intake | `/api/v1/academic/intakes/dropdown` |
| Filter Panel → Programme | `/api/v1/academic/program-master/dropdown` |
| Filter Panel → Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Filter Panel → Course unit ↳ Programme | `/api/v1/academic/program-course-units/{programGuid}/dropdown` *(filtered client-side by semester)* |
| Filter Panel → IA total / UE total operators | Static |

### Generate Result
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Filter Popover → Programme / Semester / Batch ↳ Intake | Derived client-side from `/api/v1/assessment/generate-results/status?intakeGuid=` |
| Filter Popover → Status | Static (`All statuses`, `Not generated`, `Generated`, `Published`) |

### Transcript Print
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |

### Graduate Transcript
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-groups/dropdown` *(Note: `erp-docs` updated this page to `/api/v1/academic/program-master/dropdown`)* |
| Exam Month / Exam Year | Static |

### HEC Graduate Transcript
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/hec-graduation-dropdown` |
| Program Group | `/api/v1/academic/program-groups/hec-graduation-dropdown` |
| Exam Month / Exam Year | Static |

### Transcript Collection
| Modal → Dropdown | API |
|---|---|
| Record Collection Modal → Collection Mode | Static (`Self Collection`, `Proxy Collection`) |

### Resit Master (`resit-configs`)
| Dropdown | API |
|---|---|
| All Intakes (filter) | `/api/v1/academic/intakes/dropdown` |
| Add/Edit Modal → Academic Intake | `/api/v1/academic/intakes/dropdown` |

### Resit Question Print
| Dropdown | API |
|---|---|
| Academic Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` *(also calls `/api/v1/academic/program-course-units/{programGuid}` in background for unit types)* |
| Semester ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Course Unit ↳ Programme + Semester + Intake | `/api/v1/assessment/resit-question-print/course-units?programGuid=&semesterGuid=&academicIntakeGuid=` |
| Question Bank Intake *(optional)* | `/api/v1/academic/intakes/dropdown` |

### Resit Applications
| Dropdown | API |
|---|---|
| Course Unit | `/api/v1/assessment/resit-application/applications/course-units` |

### Resit Apply
| Dropdown | API |
|---|---|
| Course Unit ↳ picked student | `/api/v1/assessment/resit-application/students/{studentGuid}/dropdown` |

### Resit Scheduling
| Dropdown | API |
|---|---|
| Tab 1: UE (Add Drawer) → Course Unit | `/api/v1/assessment/resit-schedule/course-units` |
| Tabs 1, 2, 3 (UE / CT / CW) → Exam Rule | `/api/v1/assessment/exam-rules?page=1&pageSize=100` |

### Resit IA Evaluation
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Resit ↳ Academic Session | `/api/v1/assessment/resit-configs?page=1&pageSize=50&intakeGuid=` |

### Resit IA Result
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Resit ↳ Academic Session | `/api/v1/assessment/resit-configs?page=1&pageSize=50&intakeGuid=` |
| Campus | `/api/v1/academic/campus/dropdown` |
| Show entries | Static (`10`, `25`, `50`, `100`) |

### Resit UE Mark Import
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Import Drawer → Sheet | Static / client-side parsed `.xlsx` |

### Resit Mark Update
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Resit ↳ Academic Session | `/api/v1/assessment/resit-configs?page=1&pageSize=50&intakeGuid=` |

### Exam Grievances
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Payment | Static (`All`, `Paid`, `Not paid`) |
| Review Side Drawer → Status | `/api/v1/students/exam-grievances/statuses` |

### Reports → Exam Schedule Report (`Analytics → Assessment`)
| Dropdown | API |
|---|---|
| Schedule type, Status, Mode, Theory / Practical, Scheduling | Static |
| Intake (multi) | `/api/v1/academic/intakes/dropdown` |
| Programme (multi) | `/api/v1/academic/program-master/dropdown` |
| Semester (multi) ↳ Programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` *(one call per selected programme)* |
| Course unit (multi, no Programme picked) | `/api/v1/academic/courseunits/dropdown?search=` |
| Course unit (multi) ↳ Programme | `/api/v1/academic/program-course-units/{programGuid}/dropdown` *(one call per selected programme, filtered by semester)* |

### Configuration → Exam Rules Master
| Modal → Dropdown | API |
|---|---|
| Form Modal → Question Type | Static (`MCQ`, `Descriptive`) |

### Pages with no API-backed dropdowns
- **Assessment Dashboard, Fee Clearance Master, Question FAQs, Gown Collection:** no dropdown controls.
- **Hidden / unintegrated routes:** `cw-submissions`, `mark-cw`, `recheck`, `rpt-pending-qp`, and `weight-config` contain only static mock dropdown options; `cbt-schedule` uses `/api/v1/assessment/exam-rules`; `schedule` uses `/api/v1/assessment/assessment-types/dropdown` plus static options.

---

## 2. Which endpoints may return 403

> **Verified against `erp-docs` (`develop` @ `e2585aa`):** `/dropdown` endpoints are meant to be readable by **any logged-in user**, while plain list, structure, and feature endpoints are tied to their owning module or master page's permission. Always confirm live on `erp-dev` as some permissions documented in `erp-docs` are staged or recently enabled in backend services.

### Most likely: list or filter endpoints used as dropdown / grid sources
| Endpoint | Used in | Permission it needs (verified via `erp-docs` / `erp-dev`) |
|---|---|---|
| `/api/v1/academic/program-course-units/{programGuid}` | UE Project Booklet Print; UE Practical QP Print *(primary, falls back on 403)*; UE QP/Booklet Print & Resit Question Print *(background `unitTypeName`)* | **`academic.program.get`** (Academic → Programme Master View). `erp-docs` directs other pages to use the open `/dropdown` variant below instead |
| `/api/v1/academic/session-management/` | Bulk Exam Scheduler *(main table loaded on page mount)* | Academic → Session Movement View *(confirmed returning 403 on `erp-dev` for Assessment-only users)* |
| `/api/v1/assessment/exam-rules` | Bulk Exam Scheduler, Assessment Scheduler (`ia-creation`), Resit Scheduling | Config → Exam Rules Master *(auth-only in `erp-docs` today; will 403 once Exam Rules permissions are enforced because no `/exam-rules/dropdown` exists)* |
| `/api/v1/assessment/resit-configs` | Resit IA Evaluation, Resit IA Result, Resit Mark Update | Resit Master *(auth-only in `erp-docs` today; will 403 once Resit Master permissions are enforced because no `/resit-configs/dropdown` exists)* |
| `/api/v1/academic/semesters/filter/by-semcode/{semCode}` | Hall Ticket Print *(deep-link `?semCode=` only)* | Open in `erp-docs`, though non-`/dropdown` filter path |

### Possible: feature endpoints used outside their own page
| Endpoint | Used in | Why it might fail (`403`) |
|---|---|---|
| `/api/v1/assessment/ue-attendance/semesters` | Mark Entry — UE, Mark Verify — UE | Enforces **`assessment.ueattendance.get`** (`UE Attendance` View). A user with only Mark Entry/Verify permission gets `403` |
| `/api/v1/assessment/ue-attendance/units` | Mark Verify — UE | Enforces **`assessment.ueattendance.get`** (`UE Attendance` View) instead of `assessment.uedetailedmarks.get` |
| `/api/v1/assessment/ue-mark-import/exam` | Mark Entry — UE, Mark Verify — UE *(when picking a unit)* | Enforces **`assessment.uemarkimport.get`** (`UE Mark Import` View) instead of `assessment.uedetailedmarks.get` |
| `/api/v1/students/exam-grievances/statuses` | Exam Grievances → Review Side Drawer | Sits under the Students service (`students.examgrievance.get` planned, not enforced yet in `erp-docs`) |
| `/api/v1/students/{guid}` | Hall Ticket Issuance *(photo fetch when picking a student)* | Sits under Student Master; open in `erp-docs`, but will fail if Student Master read permission is enforced |
| `/api/v1/assessment/ue-question-print/course-units` | UE Material Print, UE QP/Booklet Print | Enforces **`assessment.uequestionprint.get`** (`403` for a Booklet-only user who lacks QP print view) |
| `/api/v1/assessment/generate-results` & `/generate-results/moderation` | Result & Moderation (`moderation`) | Enforces **`assessment.generateresult.get`** and **`.moderate`** (`Generate Result` permissions), not only `assessment.moderation.*` |
| `/api/v1/academic/program-course-units/{programGuid}/dropdown` | Result & Moderation (`moderation`), Exam Schedule Report | Documented in `erp-docs` as open (auth-only), **however marked `In progress` on `feature/result_moderation_12_11_26` (not on `develop` yet)** — may 404/fail until deployed |
| `/api/v1/assessment/project-proposals` | Project Proposals → Upload Synopsis Modal | Requires `assessment.projectproposal.get` once enforced (same page, low risk) |

### Unlikely
- Every `/dropdown` endpoint: `academic/intakes/dropdown`, `academic/intakes/hec-graduation-dropdown`, `academic/program-master/dropdown`, `academic/program-groups/dropdown`, `academic/program-groups/hec-graduation-dropdown`, `academic/semesters/dropdownforprogram`, `academic/campus/dropdown`, `academic/courseunits/dropdown` (`courseunit.get` defined in catalog but not wired per `erp-docs`), and `assessment/assessment-types/dropdown`.
- Assessment `init` and dedicated dropdown endpoints documented as auth-only: `/assessment/ia-creation/init`, `/assessment/ia-creation/semesters`, `/assessment/ia-bulk-cw-schedule/init`, `/assessment/questions/*`, `/assessment/question-bank/*`, `/assessment/cw-rectification/*`, `/assessment/ue-question/course-units`, `/assessment/resit-application/students/{studentGuid}/dropdown`, and `/students/hall-ticket-search`.
- Page-owned endpoints that only run inside their own page: once a user holds that page's View permission, `/ue-attendance/semesters`, `/ue-attendance/units`, `/ue-mark-import/units`, `/ue-detailed-marks/units`, `/resit-question-print/course-units`, `/generate-results/status`, `/exam-cancel/students/*`, `/project-proposals/units*`, `/project-reviews/units*`, and `/resit-schedule/course-units` should succeed *(note: `/resit-question-print/course-units` still enforces `assessment.resitquestionprint.get` and `/consolidated-mark-sheet/pdf` enforces `assessment.consolidatedmarksheet.get`)*.

### Suggested follow-ups for the backend team
1. **Deploy `/api/v1/academic/program-course-units/{programGuid}/dropdown`** (`feature/result_moderation_12_11_26`) to `develop` / `erp-dev` so `Result & Moderation`, `Exam Schedule Report`, and all UE/Resit Print pages stop hitting `academic.program.get` on `program-course-units/{programGuid}` *(and allow `uebooklet.*` callers on `ue-question-print/course-units` or include `unitTypeName` on open print dropdowns)*.
2. **Add an Assessment-owned sessions endpoint for Bulk Exam Scheduler** (e.g., `/api/v1/assessment/ia-bulk-cw-schedule/sessions`) or allow read-only `GET /api/v1/academic/session-management/` for `Bulk Exam Scheduler` users so they do not need `Academic → Session Movement` permission.
3. **Add open `/dropdown` endpoints for `exam-rules` and `resit-configs`** (`/api/v1/assessment/exam-rules/dropdown`, `/api/v1/assessment/resit-configs/dropdown`) so scheduling and resit result/evaluation pages do not depend on master-page permissions.
4. **Decouple `Mark Entry — UE` and `Mark Verify — UE` from `UE Attendance` / `UE Mark Import` permissions:** allow `assessment.uedetailedmarks.get` on `/ue-attendance/semesters`, `/ue-attendance/units`, and `/ue-mark-import/exam` (or expose `/ue-detailed-marks/*` equivalents).
5. **Confirm shared Academic `/dropdown` routes on `erp-dev`** truly require no `academic.*` permissions, and verify CloudFront does not rewrite `/api/*` `403` responses into `200` `index.html`.

### How to verify
Sign in as an Assessment-only staff user with limited permissions (or per-page permissions), open each page above with the browser's Network tab filtered to status `403` (and also check `200` responses returning HTML if CloudFront error-rewrite is still active on `erp-dev`), and exercise every tab, modal, and cascading dropdown.
