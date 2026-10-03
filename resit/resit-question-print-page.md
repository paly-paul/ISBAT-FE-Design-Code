# Resit Question Print Page

**Route:** /assessment/resit-question-print (proposed — page not yet built)
**Module:** Assessment

## Purpose
The exam-office screen for generating and printing every resit exam material for a course unit within an active resit round: Question Paper (Theory/Practical), QP Delete, Booklet, Answer Key, Attendance, Cover Letter, Consolidated Mark Sheet, and QP Print in MS Word. Same 8 actions as the [University Exam Question Print Page](../university-exam-question-print-page.md), scoped to a resit round instead of the regular University Exam cycle, with a few resit-specific rules described below.

## Flow

1. **Academic Intake / Program / Semester / Course Unit / Question Bank Intake dropdowns** — cascading:
   - **Academic Intake** — identifies which resit round applies; drives the roster and schedule lookups for every action on this page.
   - **Program** — [GET /program-master/dropdown](../../../api/academic-service/academic/program-master/get-program-dropdown.md).
   - **Semester** — once Program is selected: [GET /semesters/dropdownforprogram?programGuid=](../../../api/academic-service/academic/semesters/get-semester-dropdown-by-program.md).
   - **Course Unit** — once Program + Semester + Academic Intake are selected: [GET /resit-question-print/course-units](../../../api/assessment-attendance-service/assessment/resit-question-print/get-course-units.md), scoped to units with a qualifying resit application for the active round on that intake (direct units, plus member units of any combination the program offers for the semester). Unlike the University Exam version of this screen, the list is **not** scoped by lecturer — every unit with a resit application shows up regardless of who teaches it.
   - **Question Bank Intake** — a separate intake picker for which intake's verified question bank to sample from when printing. Usually the same as Academic Intake, but can be pointed at a different intake (e.g. to reuse a previously-approved question bank).

2. **QP Print** (Theory):
   - Call [POST /resit-question-print/theory](../../../api/assessment-attendance-service/assessment/resit-question-print/post-theory.md) with `programGuid`, `semesterGuid`, `courseUnitGuid`, `academicIntakeGuid`, `questionBankIntakeGuid`, `confirm: false` on the first attempt.
   - Read `data.outcome`:
     - `Printed` → proceed to view/download.
     - `ConfirmationRequired` → show `message` ("Questions are already printed. Do you want to reprint the same?") as a confirm dialog; only if the user agrees, resend with `confirm: true` to get `Reprinted`.
     - `ScheduleNotSet` → show "Resit Exam not yet Scheduled/Exam Rule not yet set!!" and stop — the resit schedule for this unit/round needs an exam rule set before printing can proceed.
     - `QuestionsNotAvailable` → show "Questions are not yet uploaded!!" and stop.
   - On `Printed`/`Reprinted`: [GET /resit-question-print/theory/pdf](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-pdf.md) to download.

3. **QP Delete**:
   - [DELETE /resit-question-print/theory](../../../api/assessment-attendance-service/assessment/resit-question-print/delete-theory.md) with the same 4 identifying params, `confirm=false` first.
   - Always shows a confirm dialog before deleting: *"You are about to delete the resit QP set of {unit}, {program}({semester}). Do you want to continue?"*. The unconfirmed call returns `200` with `data: false` and that message (nothing deleted yet). Resend with `confirm=true` only if the user agrees, which deletes and returns `data: true`, message `"Deleted successfully......!"`.
   - 404s (message `"Could not delete....!"`) if nothing has been printed yet for this scope.

4. **Booklet (Print)**:
   - Call [POST /resit-booklet](../../../api/assessment-attendance-service/assessment/resit-booklet/post-print.md) with `programGuid`, `semesterGuid`, `courseUnitGuid`, `academicIntakeGuid`, `ueType`, `confirm: false` first.
   - **No schedule/exam-rule precondition** — unlike QP Print, the booklet can be printed even before the resit exam has been scheduled.
   - **Every call merges in newly-applied students regardless of `confirm`** — the response's `data.confirmationRequired` only tells the UI whether to show the "Booklets are already printed. Do you want to reprint the same?" prompt before treating the call as a completed action; the roster merge already happened either way. If `confirmationRequired` is `true`, show the prompt and resend with `confirm: true` only if the user agrees (this resend just re-stamps the print record — the merge is already done).
   - Once `confirmationRequired` is `false`: [GET /resit-booklet/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-pdf.md) to download.

5. **Answer Key** — Theory only, only meaningful once QP Print (step 2) has succeeded at least once:
   - [GET /resit-question-print/theory/answer-key](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-answer-key.md) with the same identifying params and download the PDF. No print/confirm step of its own — reads straight from the already-printed theory set (404s if nothing has been printed). Hide/disable this button for practical units.

6. **Attendance** — only meaningful once Booklet (step 4) has succeeded at least once:
   - [GET /resit-booklet/attendance/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-attendance-sheet-pdf.md). 404s if the booklet hasn't been printed for this exam type.

7. **Cover Letter** — same precondition as Attendance:
   - [GET /resit-booklet/cover/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-cover-letter-pdf.md).

8. **Consolidated Mark Sheet** — same precondition as Attendance:
   - [GET /resit-booklet/consolidated/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-consolidated-mark-sheet-pdf.md).

9. **QP Print in MS Word**:
   - Same print step as QP Print (step 2), same `confirm`/`data.outcome` handling.
   - Download: [GET /resit-question-print/theory/word](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-word.md) — HTML content served with a `.doc` extension; browsers offer to open it in Word.

10. **Practical units** work the same as steps 2–3 and 9 but through the `/practical` endpoints — [POST /resit-question-print/practical](../../../api/assessment-attendance-service/assessment/resit-question-print/post-practical.md), [GET /resit-question-print/practical/pdf](../../../api/assessment-attendance-service/assessment/resit-question-print/get-practical-pdf.md), [GET /resit-question-print/practical/word](../../../api/assessment-attendance-service/assessment/resit-question-print/get-practical-word.md), [DELETE /resit-question-print/practical](../../../api/assessment-attendance-service/assessment/resit-question-print/delete-practical.md) — with one extra roster rule: only **fee-paid** applicants in the **selected program** get a question generated (see "Business logic notes" below). No Answer Key button for practical units.

## Business logic notes
- **A confirm-then-print/delete two-step flow is required** for QP Print (Theory/Practical), Booklet, and QP Delete. Call first with `confirm: false` (or omitted); branch on `data.outcome === "ConfirmationRequired"` (QP print/word), `data.confirmationRequired` (booklet), or `data === false` (QP delete) to show the returned `message`, and only resend with `confirm: true` if the user agrees.
- **`ConfirmationRequired`, `ScheduleNotSet`, and `QuestionsNotAvailable` are all HTTP 200, not errors.** Branch on `data.outcome`, not HTTP status.
- **Practical QP reprint merges before confirmation is given.** Every call, if a set already exists, the server immediately generates a question for any newly fee-paid, in-program applicant not yet in the set — this happens regardless of `confirm`. `confirm` only decides whether the response is `ConfirmationRequired` or `Reprinted`.
- **Booklet roster and practical QP roster are deliberately different populations.** The booklet includes every applicant regardless of fee status or program; the practical question paper is only generated for fee-paid applicants in the program the caller selected. Don't assume the two lists match.
- **Answer Key, Attendance, Cover Letter, and Consolidated Mark Sheet have no print/confirm step of their own** — they read straight from whatever was last printed via QP Print / Booklet respectively, and 404 if nothing has been printed yet.
- **Word downloads are literal HTML, not real `.docx` files.** Trigger a normal browser file download from the response bytes with the filename the API returns.
- **Course Unit list is scoped by resit application, not by lecturer assignment** (see step 1, and contrast with the University Exam version of this screen) — handled server-side, the frontend just renders whatever list comes back.
- Permissions: `assessment.resitquestionprint.print` (QP Print/Word), `.get` (QP Print/Word/PDF downloads), `.getanswerkey` (Answer Key), `.delete` (QP Delete); `assessment.resitbooklet.print` (Booklet), `.get` (Booklet PDF), `.getattendancesheet` (Attendance), `.getcoverletter` (Cover Letter); `assessment.consolidatedmarksheet.get` (Consolidated Mark Sheet). A user can have some but not all of these — hide/disable buttons accordingly but expect 403s to be possible regardless.

## APIs used
| Step | API | API ID | Notes |
|---|---|---|---|
| Load Program dropdown | [GET /program-master/dropdown](../../../api/academic-service/academic/program-master/get-program-dropdown.md) | `academic-service.academic.program-master.dropdown` | |
| Load Semester dropdown | [GET /semesters/dropdownforprogram](../../../api/academic-service/academic/semesters/get-semester-dropdown-by-program.md) | `academic-service.academic.semesters.dropdown-for-program` | Needs `programGuid` |
| Load Course Unit dropdown | [GET /resit-question-print/course-units](../../../api/assessment-attendance-service/assessment/resit-question-print/get-course-units.md) | `assessment-service.resit-question-print.course-units` | Scoped by resit application, not lecturer |
| QP Print (Theory) | [POST /resit-question-print/theory](../../../api/assessment-attendance-service/assessment/resit-question-print/post-theory.md) | `assessment-service.resit-question-print.print-theory` | Confirm-gated reprint |
| QP Print (Practical) | [POST /resit-question-print/practical](../../../api/assessment-attendance-service/assessment/resit-question-print/post-practical.md) | `assessment-service.resit-question-print.print-practical` | Merge-before-confirm on reprint |
| Download QP PDF (Theory) | [GET /resit-question-print/theory/pdf](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-pdf.md) | `assessment-service.resit-question-print.theory-pdf` | 404s if not printed yet |
| Download QP PDF (Practical) | [GET /resit-question-print/practical/pdf](../../../api/assessment-attendance-service/assessment/resit-question-print/get-practical-pdf.md) | `assessment-service.resit-question-print.practical-pdf` | 404s if not printed yet |
| QP Delete (Theory) | [DELETE /resit-question-print/theory](../../../api/assessment-attendance-service/assessment/resit-question-print/delete-theory.md) | `assessment-service.resit-question-print.delete-theory` | Confirm-gated |
| QP Delete (Practical) | [DELETE /resit-question-print/practical](../../../api/assessment-attendance-service/assessment/resit-question-print/delete-practical.md) | `assessment-service.resit-question-print.delete-practical` | Confirm-gated |
| Booklet Print | [POST /resit-booklet](../../../api/assessment-attendance-service/assessment/resit-booklet/post-print.md) | `assessment-service.resit-booklet.print` | No schedule gate; merge-before-confirm |
| Download Booklet PDF | [GET /resit-booklet/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-pdf.md) | `assessment-service.resit-booklet.pdf` | 404s if not printed yet |
| Download Answer Key | [GET /resit-question-print/theory/answer-key](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-answer-key.md) | `assessment-service.resit-question-print.theory-answer-key` | Theory only; 404s if not printed |
| Download Attendance sheet | [GET /resit-booklet/attendance/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-attendance-sheet-pdf.md) | `assessment-service.resit-booklet.attendance-pdf` | 404s if not printed yet |
| Download Cover Letter | [GET /resit-booklet/cover/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-cover-letter-pdf.md) | `assessment-service.resit-booklet.cover-pdf` | 404s if not printed yet |
| Download Consolidated Mark Sheet | [GET /resit-booklet/consolidated/pdf](../../../api/assessment-attendance-service/assessment/resit-booklet/get-consolidated-mark-sheet-pdf.md) | `assessment-service.resit-booklet.consolidated-pdf` | 404s if not printed yet |
| QP Print in MS Word | [POST /resit-question-print/theory](../../../api/assessment-attendance-service/assessment/resit-question-print/post-theory.md) | `assessment-service.resit-question-print.print-theory` | Same print step as QP Print (PDF) |
| Download QP Word doc (Theory) | [GET /resit-question-print/theory/word](../../../api/assessment-attendance-service/assessment/resit-question-print/get-theory-word.md) | `assessment-service.resit-question-print.theory-word` | 404s if not printed yet |
| Download QP Word doc (Practical) | [GET /resit-question-print/practical/word](../../../api/assessment-attendance-service/assessment/resit-question-print/get-practical-word.md) | `assessment-service.resit-question-print.practical-word` | 404s if not printed yet |

## Bruno requests
All requests for this page are in the shared Bruno collection (`erp-shared-docs`):
- `Academic/Program-Master/GetDropdown.bru`
- `Academic/Semester/GetDropdownByProgram.bru`
- `Assessment/Resit-Question-Print/GetCourseUnits.bru`
- `Assessment/Resit-Question-Print/PostTheory.bru`
- `Assessment/Resit-Question-Print/PostPractical.bru`
- `Assessment/Resit-Question-Print/GetTheoryPdf.bru`
- `Assessment/Resit-Question-Print/GetPracticalPdf.bru`
- `Assessment/Resit-Question-Print/GetTheoryWord.bru`
- `Assessment/Resit-Question-Print/GetPracticalWord.bru`
- `Assessment/Resit-Question-Print/GetTheoryAnswerKey.bru`
- `Assessment/Resit-Question-Print/DeleteTheory.bru`
- `Assessment/Resit-Question-Print/DeletePractical.bru`
- `Assessment/Resit-Booklet/PostPrint.bru`
- `Assessment/Resit-Booklet/GetPdf.bru`
- `Assessment/Resit-Booklet/GetAttendanceSheetPdf.bru`
- `Assessment/Resit-Booklet/GetCoverLetterPdf.bru`
- `Assessment/Resit-Booklet/GetConsolidatedMarkSheetPdf.bru`

## Related pages
- [University Exam Question Print Page](../university-exam-question-print-page.md) — the same 8 materials for the regular University Exam cycle instead of a resit round.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-28 | Nebu Salim | Initial version created |
