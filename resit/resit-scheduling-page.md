# Resit Scheduling Page

**Route:** /assessment/resit-scheduling
**Module:** Assessment

## Purpose
One page where the exam office schedules everything for the **active resit of the current intake**:

| Tab | What is scheduled | How many |
|---|---|---|
| **University Exam** | Exam date, time, mark, test type, publish status and exam rule per course unit and part (Theory / Practical) | One per unit and part |
| **Class Test** | The class test (CBT) window, duration, test type, publish status and exam rule | One per resit |
| **Coursework** | The coursework window, test type, publish status and exam rule (Section A only) | One per resit |

Staff always work on the active resit; there is no resit or intake selector.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Resit Scheduling                                                             │
│ Active resit: Resit Spring 2026                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐   │
│ │ UNIVERSITY EXAM      │ │ CLASS TEST           │ │ COURSEWORK           │   │
│ │ 335 scheduled        │ │ 10–15 Mar · 60 min   │ │ 10–15 Mar            │   │
│ │ 138 units pending    │ │ Online · Published   │ │ Online · Published   │   │
│ │                      │ │ 🔒 20 started        │ │ 🔒 25 started        │   │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ University Exam (335) ]  [ Class Test ● ]  [ Coursework ● ]                │
│ ════════════════════════                                                     │
│   <active tab body>                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Header
- Title and the active resit name (`resit.refCode`).
- When there is no active resit: a banner *"There is no active resit in this academic intake. Scheduling not possible."*; all tabs are read-only.

### Summary cards
Three cards, one per tab. Clicking a card opens its tab.

| Card | Shows |
|---|---|
| University Exam | Total schedules (`totalCount`) and units still pending (units from course-units where no part is scheduled) |
| Class Test | Window in local time, duration, Online/Offline, Published/Not published, 🔒 *N started* when locked, or *Not scheduled* |
| Coursework | Window in local time, Online/Offline, Published/Not published, 🔒 *N started* when locked, or *Not scheduled* |

### Tabs
- **University Exam (N)** — the count is `totalCount`.
- **Class Test** / **Coursework** — a dot `●` when `schedule` is `null` (nothing saved yet).

### Tab 1 — University Exam
```
│ 🔍 Unit code or name______________ [Search] [Clear]              [ + Add ]   │
│ Code | Unit | Part | Exam Date | Start | End | Max Mark | Test Type |         │
│ Published | Exam Rule | ✏️                                         ‹ 1 2 … › │
```
**Add / Edit drawer** (right side):
```
│ Course unit  [BFX2221 · Motion Design ▾]   read-only on Edit             │
│ Part         (•) Theory ( ) Practical      only for theory+practical     │
│ Exam date    [12 Oct 2026]                                                │
│ Start [09:00]   End [12:00]                                               │
│ Exam mark    [100]                         🔒 when marks entered          │
│ Test type    (•) Offline ( ) Online                                       │
│ Publish      (•) Published ( ) Not published                              │
│ Exam rule    [R3 · CW1] [🔍]               🔒 when marks entered          │
│                                  [Cancel] [Save]                          │
```

### Tabs 2 and 3 — Class Test / Coursework (shared window form)
```
│ ┌─ 🔒 20 students have started — some fields are locked ──────────────────┐ │
│  Opens       [10 Mar 2026] [14:00]        (local time)                     │
│  Closes      [15 Mar 2026] [17:00]                                         │
│  Duration    [60] min                     Class Test only                  │
│  Test type   (•) Online ( ) Offline       Offline = hidden from students   │
│  Publish     (•) Published ( ) Not published                               │
│  Exam rule   [R4 · MID] [🔍]              Coursework: "Section A only"     │
│                                               [Reset] [Save]               │
```
Both tabs use **one** form component configured per tab:

| Setting | Class Test | Coursework |
|---|---|---|
| Duration field | shown (1–600 min, fits the window) | hidden |
| Locked fields after start | Exam rule, Duration, Test type | Exam rule, Test type |
| Rule hint | — | *Resit coursework uses Section A of the rule only* |
| Load / Save APIs | `/resit-ct-schedule` | `/resit-cw-schedule` |

## Flow

### 1. Page load
1. Call in parallel:
   - [GET /resit-schedule?page=1&pageSize=10](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedules.md) — first page of the exam list and `totalCount`.
   - [GET /resit-ct-schedule](../../../api/assessment-attendance-service/assessment/resit-ct-schedule/get-resit-ct-schedule.md)
   - [GET /resit-cw-schedule](../../../api/assessment-attendance-service/assessment/resit-cw-schedule/get-resit-cw-schedule.md)
2. Any response with `resit: null` → no-active-resit banner, all tabs read-only.
3. Fill the three cards and the tab badges.
4. Open the tab from the URL (`?tab=exam|ct|cw`), default `exam`.
5. The *units pending* number on the exam card needs [GET /resit-schedule/course-units](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedule-course-units.md); load it after the first paint (or when the Exam tab's **Add** is first opened) and cache it for the drawer.

### 2. University Exam tab
1. **Search** → GET list with `search=<text>&page=1` (unit code or name). **Clear** → reload page 1. Pager keeps `search`.
2. **Add** → open the drawer with the course-units dropdown (*UnitName (UnitCode)*):
   - disable a unit when it is fully scheduled (`theoryScheduled` and, for theory + practical units, `practicalScheduled`);
   - `isTheoryPracticalUnit: true` → show Theory / Practical, disable the part already scheduled;
   - defaults: Test type **Offline**, Publish **Published**.
3. **Save (Add)** → [POST /resit-schedule](../../../api/assessment-attendance-service/assessment/resit-schedule/post-resit-schedule.md) → close, toast, reload the list page, refresh the exam card and the cached course-units.
4. **Edit** → [GET /resit-schedule/{guid}](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedule.md); unit and part read-only; `marksEntered: true` → lock Exam rule and Exam mark with a note.
5. **Save (Edit)** → [PUT /resit-schedule/{guid}](../../../api/assessment-attendance-service/assessment/resit-schedule/put-resit-schedule.md) → close, toast, reload the list page.

### 3. Class Test / Coursework tabs
1. Fill the form from the data already loaded on page load; convert `startDateTime` / `endDateTime` from UTC to local time.
2. `schedule: null` → empty form with defaults: Test type **Online**, Publish **Published**.
3. `locked: true` → show the banner with `studentsStarted`, disable the locked fields.
4. **Save** → send date + time as ISO 8601 with the offset or in UTC (never without a zone):
   - Class Test → [PUT /resit-ct-schedule](../../../api/assessment-attendance-service/assessment/resit-ct-schedule/put-resit-ct-schedule.md)
   - Coursework → [PUT /resit-cw-schedule](../../../api/assessment-attendance-service/assessment/resit-cw-schedule/put-resit-cw-schedule.md)
   
   Refill the form and the card from the response; clear the tab dot.
5. **Reset** → refill from the last loaded data.

### 4. Exam rule picker (all tabs)
Search button → `GET /api/v1/assessment/exam-rules` (active rules only): Rule Code, Rule Name, Section A/B/C question and mark columns. Selecting fills code + name and keeps `examRuleGuid`. On the Coursework tab highlight the Section A columns.

### 5. Leaving a tab with unsaved changes
Switching tab, closing the drawer or leaving the page with a changed form → *"You have unsaved changes. Discard them?"*

## Validation (client side, mirrors the server)
| Tab | Field | Rule | Message |
|---|---|---|---|
| Exam | Course unit | required (Add) | *Select Course Unit* |
| Exam | Exam date | required, from 01 Jan 2000, at most 2 years ahead (past dates allowed) | *Enter Exam Date* |
| Exam | Start / End time | required, end after start | *End time must be after start time.* |
| Exam | Exam mark | required, > 0, ≤ 9999.99, 2 decimals | *Enter Exam Mark* |
| All | Exam rule | required | *Select Rule* |
| CT / CW | Opens / Closes | required, closes after opens, from 01 Jan 2000, at most 2 years ahead | *End date-time must be after start date-time.* |
| CT | Duration | 1–600 minutes, not longer than the window | *Duration cannot be longer than the window between start and end.* |

## Success messages
| Action | Toast |
|---|---|
| Add exam schedule | *Resit schedule created successfully.* |
| Edit exam schedule | *Resit schedule updated successfully.* |
| Save class test | *Resit class test schedule saved successfully.* |
| Save coursework | *Resit coursework schedule saved successfully.* |

## Business rules the UI must show
- **University Exam:** each unit and part once per resit; Practical only for theory + practical units; after marks are entered the exam rule and mark are locked.
- **Class Test:** after any student starts, exam rule, duration and test type are locked; the window and publish status can still change (extend or close early).
- **Coursework:** after any student opens it, exam rule and test type are locked; Section A of the rule is used.
- **Offline** class test / coursework is not shown to students.
- All windows are stored in UTC; always display local time.

## Error handling
| Response | UI |
|---|---|
| `400 validation_error` | Show every message in `errors` on the form |
| `400 bad_request` | Show `errors[0]` |
| `404 not_found` | Show `errors[0]`; on Edit close the drawer and reload the list |
| `409 conflict` | Show `errors[0]` and reload that tab (already scheduled, marks entered, locked after start, created by someone else) |
| `401` | Redirect to login |

## APIs needed
All APIs already exist; no new API is required for this page.

| API | Used for |
|---|---|
| [GET /resit-schedule](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedules.md) | Exam list, search, paging, exam card total |
| [GET /resit-schedule/course-units](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedule-course-units.md) | Add drawer dropdown, *units pending* on the exam card |
| [POST /resit-schedule](../../../api/assessment-attendance-service/assessment/resit-schedule/post-resit-schedule.md) | Add exam schedule |
| [GET /resit-schedule/{guid}](../../../api/assessment-attendance-service/assessment/resit-schedule/get-resit-schedule.md) | Edit drawer |
| [PUT /resit-schedule/{guid}](../../../api/assessment-attendance-service/assessment/resit-schedule/put-resit-schedule.md) | Save exam edit |
| [GET /resit-ct-schedule](../../../api/assessment-attendance-service/assessment/resit-ct-schedule/get-resit-ct-schedule.md) | Class Test tab + card |
| [PUT /resit-ct-schedule](../../../api/assessment-attendance-service/assessment/resit-ct-schedule/put-resit-ct-schedule.md) | Save class test schedule |
| [GET /resit-cw-schedule](../../../api/assessment-attendance-service/assessment/resit-cw-schedule/get-resit-cw-schedule.md) | Coursework tab + card |
| [PUT /resit-cw-schedule](../../../api/assessment-attendance-service/assessment/resit-cw-schedule/put-resit-cw-schedule.md) | Save coursework schedule |
| GET /api/v1/assessment/exam-rules | Exam rule picker |

**Optional later:** a single `GET /api/v1/assessment/resit-scheduling/summary` returning the three card summaries would replace the three parallel calls on load. Add it only if the page load feels slow.

## Permissions (when enabled)
| Tab | View | Save |
|---|---|---|
| University Exam | `assessment.resitschedule.get` | `assessment.resitschedule.save` |
| Class Test | `assessment.resitctschedule.get` | `assessment.resitctschedule.save` |
| Coursework | `assessment.resitcwschedule.get` | `assessment.resitcwschedule.save` |

Hide a tab (and its card) without the view permission; disable **Add** / **Save** without the save permission.

## Routes
This page replaces the separate pages. Redirect them here:

| Old route | Redirect to |
|---|---|
| /assessment/resit-schedule | /assessment/resit-scheduling?tab=exam |
| /assessment/resit-ct-schedule | /assessment/resit-scheduling?tab=ct |
| /assessment/resit-cw-schedule | /assessment/resit-scheduling?tab=cw |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Vaishnav | Initial version created |
