# Resit UE Mark Import Page

**Route:** /assessment/resit-ue-mark-import
**Module:** Assessment

## Purpose
The exam office imports the **resit university exam (UE) marks** for the **active resit of the current intake**, one course unit and part at a time. The page shows every resit exam with its import progress, so staff can see what is left and work through the list. For each exam they download a template of the students who sat it, fill in the marks, upload the file, fix any problems the preview highlights and save.

The saved totals become the UE part of the resit result on the [Resit Mark Update Page](./resit-mark-update-page.md).

## Screens
1. **Exam list** — every resit exam of the active resit with its status and progress.
2. **Import drawer** — opens from a *To do* exam; three steps: *Template → Upload → Review & save*.

## 1. Exam list

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Resit UE Mark Import                                           Active resit ▸ Resit Spring 2026 │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ To do  333 ]  [ Upcoming  2 ]  [ Not scheduled  120 ]  [ Completed  0 ]  [ All ]           │
│ ══════════════                                                                               │
│ 🔍 Unit code or name___________________                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Course unit                                   Part       Exam date    Marks imported        │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│  BIT1103                                       Theory     11 Mar 2026  ▱▱▱▱▱▱▱▱   0 / 32     │
│  Problem Solving Methodologies Using C                                          [ Import ]   │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│  BCS2204                                       Practical  10 Mar 2026  ▰▰▰▰▱▱▱▱  12 / 25     │
│  Web Programming                                                                [ Continue ] │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│  BNCS3132                                      Project    —            Not scheduled         │
│  Internship                                                          Schedule it ↗           │
│                                                                                              │
│                                                              Showing 1–10 of 333   ‹ 1 2 … › │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Header
- Title and the active resit (`resit.refCode`).
- `resit: null` → banner *"There is no active resit in this academic intake."*; tabs and table hidden.

### Tabs
One call per tab change with `status`; the badge counts come from `summary` and never change with the search.

| Tab | `status` | Badge |
|---|---|---|
| **To do** (default) | `1` | `summary.toDo` |
| **Upcoming** | `3` | `summary.upcoming` |
| **Not scheduled** | `4` | `summary.notScheduled` — amber when above 0 |
| **Completed** | `2` | `summary.completed` |
| **All** | omitted | — |

### Search
Unit code or name, debounced 400 ms, max 100 characters. Resets to page 1.

### Columns
| Column | Fields | Display |
|---|---|---|
| **Course unit** | `unitCode`, `unitName` | Code bold; name grey below, truncated with a tooltip |
| **Part** | `layout`, `part` | Badge: *Theory* (blue), *Practical* (purple), *Project* (teal) |
| **Exam date** | `examDate` | `dd MMM yyyy`; *—* when not scheduled |
| **Marks imported** | `importedCount`, `studentCount`, `status` | Progress bar and *"imported / students"*. Replaced by the status text for Upcoming and Not scheduled |
| **Action** | `status`, `importedCount` | See below |

| `status` | Action |
|---|---|
| `1` To do, nothing imported | **Import** (primary) → opens the drawer |
| `1` To do, some imported | **Continue** (primary) → opens the drawer |
| `2` Completed | ✓ *Completed* (green text) |
| `3` Upcoming | *Opens after {examDate}* (grey) |
| `4` Not scheduled | *Schedule it ↗* → [Resit Scheduling Page](./resit-scheduling-page.md) |

Server-side paging, 10 per page.

## 2. Import drawer
A right-side drawer, 960 px wide (full screen on small screens). The list stays behind it.

### Drawer header (all steps)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Import marks · BIT1103 Theory                                                 ✕  │
│ Problem Solving Methodologies Using C · Exam 11 Mar 2026 · Max mark 100          │
│ 32 students · 0 imported · 32 pending                                            │
│                                                                                  │
│   ① Template  ─────────  ② Upload  ─────────  ③ Review & save                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```
The stepper shows done steps with ✓. Staff can go back to any earlier step; going back to ① or ② clears the preview.

When the drawer opens it loads [GET /students](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-students.md) once; the file is checked against this list and the exam's `columns[]` in the browser.

### ① Template
```
│ Mark columns                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                               │
│ │ SECTIONA     │ │ SECTIONB     │ │ SECTIONC     │     Total 100                 │
│ │ max 20       │ │ max 60       │ │ max 20       │                               │
│ └──────────────┘ └──────────────┘ └──────────────┘                               │
│                                                                                  │
│ • Enter a mark in every column for every student; up to 2 decimals.              │
│ • Do not change SLNO or STUDENTNUM. STUDENTNAME is for reference only.           │
│ • The template holds only the 32 students still without marks.                  │
│                                                                                  │
│              [ ⬇ Download template (32 students) ]    I already have the file →  │
```
- Column cards from `columns[]` (`header`, `maxMark`); total `maxMark`.
- **Download template** → [GET /template](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-template.md); on success the stepper moves to ②.
- *I already have the file →* goes to ② without downloading.

### ② Upload
```
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│   📄 Drop the filled template here, or browse                                    │
│      .xlsx only · max 5 MB                                                        │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                                                  │
│ 📄 BIT1103_Theory_Resit_UE_Template_20260930.xlsx · 18 KB              Replace   │
│ Sheet [ Theory_Template ▾ ]                                  [ Check file → ]    │
```
The file is read in the browser (SheetJS); it is never uploaded.

1. Pick or drop a file → check `.xlsx`, max 5 MB.
2. Read the sheet names from the workbook.
3. Exactly one sheet, or one sheet ending in `_Template` → select it and check it straight away (no extra click).
4. Otherwise show **Sheet** and **Check file →**.
5. Sheet checks — the first failure shows as an inline red box under the file and the step stays on ②:

| Check | Message |
|---|---|
| Not a readable workbook | *The file could not be read. Upload the template as .xlsx.* |
| Row 1 lacks `SLNO`, `STUDENTNUM` or any `columns[].header` (names matched ignoring case, spaces and dots; order free; extra columns ignored) | *The sheet is missing the column(s) {HEADERS}. Download the template again.* |
| No data rows (rows with a blank `SLNO` are skipped) | *There is no data in the sheet.* |
| More than 1000 data rows | *The sheet can have at most 1000 students.* |

6. Row checks — every row, every problem, then go to ③:

| Check | Cell | Message |
|---|---|---|
| `STUDENTNUM` blank | Student | *Student number is required.* |
| Same student number on more than one row | Student | *Appears more than once in the file (rows {slNos}).* |
| Not in the students list | Student | *Has not applied for this resit exam.* |
| `imported: true` | Student | *Marks are already imported.* |
| Mark blank | Mark | *Required.* |
| Not a number | Mark | *Must be a number.* |
| Below 0 | Mark | *Cannot be negative.* |
| More than 2 decimals | Mark | *At most 2 decimals.* |
| Above `columns[].maxMark` | Mark | *Cannot be more than {max}.* |

Student numbers are compared trimmed and ignoring case; names come from the students list, not the file. The same checks run again on the server when saving.

### ③ Review & save
```
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│ │ 32 rows    │ │ 31 ready   │ │ ⚠ 1 row    │ │ Average    │ │ High / Low │       │
│ │            │ │            │ │ 3 problems │ │ 61.4       │ │ 92 / 18    │       │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                                  │
│ [ All rows ]  [ ⚠ Problems only (1) ]                          [ ⬇ Problem list ] │
│ ──────────────────────────────────────────────────────────────────────────────── │
│  SL  Student                    Section A   Section B   Section C      Total     │
│                                   (20)        (60)        (20)        (100)      │
│ ──────────────────────────────────────────────────────────────────────────────── │
│  1   BAGUMA STEPHEN               15.00       48.50       12.00        75.50     │
│      011240168                                                                   │
│ ▌3   ⚠ Unknown student          ┌──────┐    ┏━━━━━━┓      10.00          —       │
│ ▌    012230213                  │ blank│    ┃ 65.00┃                              │
│ ▌    Has not applied for this   └──────┘    ┗━━━━━━┛                              │
│ ▌    resit exam.                Required.   Max 60.                               │
│ ──────────────────────────────────────────────────────────────────────────────── │
│                                                                                  │
│ ⚠ Fix 3 problems in the file and upload it again.  [ ↻ Upload corrected file ]   │
│                                                          [ Save 32 marks ] (off) │
```
**Summary cards**

| Card | Value |
|---|---|
| Rows | Data rows read |
| Ready | Rows without problems (green) |
| Problems | Rows with problems · number of problems (red; hidden when 0) |
| Average | Mean total over rows without problems, 1 decimal |
| High / Low | Highest and lowest total over rows without problems |

**Grid**
- Columns: **SL** (`SLNO`), **Student** (name bold, number grey; *⚠ Unknown student* in red when the number is not in the students list), one column per `columns[]` with header `label (maxMark)`, **Total** (sum of the marks, bold, *—* when a mark is missing).
- Rows with problems: red left border and light red background, **sorted to the top**.
- Each problem marks its cell with a red outline and shows its message under the value; the full list is also in a tooltip.
- Blank marks show as a dashed empty cell.
- **Problems only** filter; paging at 25 rows.
- **Problem list** downloads a CSV (`slNo, studentNum, column, message`), for the lecturer.

**Footer**
- No problems → **Save N marks** (primary, N = rows).
- Problems → Save disabled; message *"Fix {n} problems in the file and upload it again."* and **Upload corrected file**, which goes back to ② and keeps the sheet name for the next file.

### Save
1. **Save N marks** → confirm dialog: *"Save the resit UE marks of N students for {unitCode} {Theory/Practical/Project}? Saved marks cannot be changed on this page."*
2. [POST /import](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/post-resit-ue-mark-import.md) with `resitScheduleGuid` and the checked rows as JSON — `{ slNo, studentNum, marks: { <columns[].key>: number } }`. The button shows a spinner and the drawer cannot be closed while saving.
3. Success → the drawer shows the result:

```
│                                  ✓                                               │
│                  32 marks saved for BIT1103 Theory                                │
│                  All students of this exam now have marks.                        │
│                                                                                  │
│                   [ Close ]     [ Import next exam → ]                           │
```
- `pendingCount` > 0 → second line *"{pendingCount} students still have no marks."* and a **Download template for the rest** button (back to ①).
- **Import next exam →** loads the first *To do* exam ([GET /exams?status=1&page=1&pageSize=1](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-exams.md)) into the drawer at step ①; hidden when none is left.
- On close, the list and tab counts reload on the same tab and page.

### Closing the drawer
- ✕ / Esc / clicking outside while a preview is shown → confirm *"Discard the checked file? Nothing has been saved."*
- Otherwise closes at once.

## Flow summary

| # | User action | API |
|---|---|---|
| 1 | Open page, change tab, search, page | [GET /resit-ue-mark-import/exams](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-exams.md) |
| 2 | **Import** / **Continue** | [GET /resit-ue-mark-import/students](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-students.md) |
| 3 | **Download template** | [GET /resit-ue-mark-import/template](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-template.md) |
| 4 | Pick a file, sheet auto-picked or **Check file** | — (read and checked in the browser) |
| 5 | **Save N marks** | [POST /resit-ue-mark-import/import](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/post-resit-ue-mark-import.md) |
| 6 | **Import next exam** | [GET /resit-ue-mark-import/exams?status=1&pageSize=1](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-exams.md) |

## Business logic notes
- Only the **active resit of the current intake** is used; there is no resit or intake selector.
- An exam can be imported once its exam date has passed and at least one active student who applied for it has no marks.
- A combined unit appears twice, once per part (Theory, Practical), each with its own schedule and template.
- The template holds only students still without marks, so a partial import is finished with a fresh template (**Continue**).
- The layout decides the mark columns: **Theory** — the sections of the exam rule (max = attempted questions × mark per question); **Practical** — Record 10, Coding 30, Output 10, Viva 20; **Project** — Synopsis 15, Review 15, Methodology 20, Analysis 20, Report 15, Viva 15.
- Marks may have up to 2 decimals and cannot be blank, negative or above the column maximum. The student's resit UE mark is the sum of the columns.
- Students are matched by student number. A student who did not apply for this resit exam, or is not active, is flagged, never skipped.
- Import is all or nothing and only adds marks; existing marks are never overwritten or edited here.
- Resit fee payment is not checked; every applicant is included.
- Once marks exist the resit exam schedule is locked on the [Resit Scheduling Page](./resit-scheduling-page.md).

## Validation (client)
| Field | Rule | Message |
|---|---|---|
| File | Required; `.xlsx`; max 5 MB | *Upload an .xlsx file of at most 5 MB.* |
| Sheet | Required when shown | *Select a sheet.* |
| Search | Max 100 characters | Input stops at 100 |

The sheet and row checks are listed under [② Upload](#-upload); the server repeats the row checks on save — see the [import API](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/post-resit-ue-mark-import.md#row-checks).

## Error handling
| Response | Where | UI |
|---|---|---|
| Sheet check failed | Step ② | Inline red box under the file; keep the file so the sheet can be changed |
| Row problems | Step ③ | Highlighted cells, Save disabled |
| Import 400 `validation_error` | Step ③ | Something changed since the check (e.g. another import): reload the students list, re-check the rows and map each `Row {slNo} · {COLUMN}: {message}` onto its cell |
| Import 409 `conflict` | Step ③ | Toast with the message; reload the students list and re-check the rows, which flags the students already imported |
| 404 — *Resit exam not found.* | Drawer | Toast; close the drawer and reload the list |
| 400 `bad_request` on students or template | Drawer | Toast with the message |
| 400 `bad_request` on the list | List | Error state with **Retry** |
| 401 | Anywhere | Redirect to login |

## Empty states
| Case | Message |
|---|---|
| To do tab empty, nothing else pending | *"All resit exam marks are imported. 🎉"* |
| To do tab empty, some Upcoming | *"No exam is ready yet. {n} exam(s) open after their exam date."* |
| Not scheduled tab empty | *"Every applied unit is scheduled."* |
| Search matches nothing | *"No course unit matches “{search}”."* |

## APIs used
| Step | API | API ID |
|---|---|---|
| Exam list | [GET /resit-ue-mark-import/exams](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-exams.md) | `assessment-attendance-service.assessment.resit-ue-mark-import.exams` |
| Students | [GET /resit-ue-mark-import/students](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-students.md) | `assessment-attendance-service.assessment.resit-ue-mark-import.students` |
| Template | [GET /resit-ue-mark-import/template](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/get-resit-ue-mark-import-template.md) | `assessment-attendance-service.assessment.resit-ue-mark-import.template` |
| Save | [POST /resit-ue-mark-import/import](../../../api/assessment-attendance-service/assessment/resit-ue-mark-import/post-resit-ue-mark-import.md) | `assessment-attendance-service.assessment.resit-ue-mark-import.import` |

## Permissions (when enabled)
| Permission | Grants |
|---|---|
| `assessment.resituemarkimport.get` | Open the page, list exams, load students, download templates |
| `assessment.resituemarkimport.import` | Save marks |

## Related pages
| Page | Route |
|---|---|
| [Resit Scheduling Page](./resit-scheduling-page.md) | /assessment/resit-scheduling |
| [Resit Mark Update Page](./resit-mark-update-page.md) | /assessment/resit-mark-update |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-30 | Vaishnav | Initial version created |
