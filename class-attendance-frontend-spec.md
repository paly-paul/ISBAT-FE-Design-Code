# Class Attendance — Frontend Design Specification

**Service:** Attendance Service (`http://localhost:5400`)  
**Feature:** Class Attendance Recording & Session Management  
**Audience:** Frontend Designer / Developer  

---

## Overview

The Class Attendance feature allows a **lecturer** to record student attendance for a scheduled class session. The flow is:

1. Lecturer selects a timetable and a date
2. System loads the eligible students and course unit outline topics for that session
3. Lecturer marks each student Present/Absent and selects which outline topics were covered
4. Lecturer submits — session is saved as Completed
5. If the class did not run, lecturer can mark it as Skipped with a reason

---

## Pages / Screens Required

### Screen 1 — Pending Outlines Dashboard

A landing screen showing sessions where outlines have not yet been recorded.

**Purpose:** Remind the lecturer of sessions that are complete (students marked) but outlines are still missing.

**API:**
```
GET /api/v1/attendance/sessions/pending-outlines?timetableGuid={guid}
```

**Response fields:**
| Field | Type | Display |
|---|---|---|
| `attendanceSessionGuid` | Guid | Hidden (used for navigation) |
| `sessionDate` | DateOnly | Date column |
| `startTime` | TimeOnly | Start time column |
| `endTime` | TimeOnly | End time column |

**Controls required:**
- **Table** — lists pending sessions with columns: Date, Start Time, End Time, Action
- **Action button per row** — "Record Outlines" → navigates to Screen 2 with the session pre-loaded
- **Empty state** — message "No pending outline sessions" when table is empty

---

### Screen 2 — Record Class Attendance

The main attendance recording form. Opened either from Screen 1 (existing session) or directly by a lecturer starting a new session.

#### Section A — Session Header (Read-Only Info)

Loaded via:
```
GET /api/v1/attendance/sessions/by-timetable-date?timetableGuid={guid}&date={YYYY-MM-DD}
```

**Displays:**
| Field | Type | Display |
|---|---|---|
| `sessionDate` | DateOnly | "Session Date" — read-only label |
| `startTime` | TimeOnly | "Class Start Time" — read-only label |
| `endTime` | TimeOnly | "Class End Time" — read-only label |
| `status` | Enum | Status badge (see Status Badge section below) |
| `isAutomated` | bool | Hidden — used to control which sections are editable |
| `isSpecialClass` | bool | Show a warning banner "This is a special/makeup class" if true |

**Controls:**
- **Date Picker** — for selecting the session date (DateOnly, `YYYY-MM-DD` format sent to API)
- **Read-only info card** — shows course unit name, batch, lecturer, start/end time once session is loaded
- **Status Badge** — coloured chip:
  - `0 = Scheduled` → Blue
  - `1 = Completed` → Green
  - `2 = Cancelled` → Grey
  - `3 = Skipped` → Orange

---

#### Section B — Skip Class Toggle

Shown only for **non-automated** sessions (when `isAutomated = false`).

**Controls:**
- **Toggle / Checkbox** — "Skip this class session" (`isSkipped`)
- **Dropdown — Skip Reason** — shown only when toggle is ON (`isSkipped = true`)

| Value | Label |
|---|---|
| `1` | Holiday |
| `2` | Lecturer Absence |
| `3` | On Duty |
| `4` | Other |

> When Skip is ON, Sections C and D are hidden. The Submit button submits with `isSkipped: true` and the selected `skipReason`.

---

#### Section C — Outline Topics Covered

Loaded when a course unit is known:
```
GET /api/v1/attendance/sessions/outlines/by-unit?courseUnitGuid={guid}
```

**Response fields per outline topic:**
| Field | Type | Display |
|---|---|---|
| `outlineTlGuid` | Guid | Hidden (sent on submit) |
| `outlineCode` | string | Topic code label |
| `outlineDetails` | string | Topic description |

**Controls required:**
- **Multi-select checklist / checkbox list** — one row per outline topic showing `outlineCode` + `outlineDetails`
- At least one topic must be checked before submitting (show validation error "Please select at least one outline topic")
- If no topics exist for the unit — show "No outline topics configured for this unit"

---

#### Section D — Student Attendance List

Loaded via:
```
GET /api/v1/attendance/sessions/students?timetableGuid={guid}&date={YYYY-MM-DD}
```

If no prior session exists for the date, falls back to eligible students:
```
GET /api/v1/attendance/sessions/students?timetableGuid={guid}&date={YYYY-MM-DD}
```
(same endpoint — the backend resolves whether a session already exists and returns either saved records or fresh eligible students)

**Response fields per student:**
| Field | Type | Display |
|---|---|---|
| `studentGuid` | Guid | Hidden (sent on submit) |
| `studentNumber` | string | Student Number column |
| `fullName` | string | Student Name column |
| `isPresent` | bool | Present/Absent toggle |

**Controls required:**
- **Table** with columns: #, Student Number, Student Name, Present
- **Toggle per row** — Present/Absent for each student (`isPresent: true/false`)
- **Mark All Present** button — sets all toggles to Present
- **Mark All Absent** button — sets all toggles to Absent
- **Student count summary** — "X Present / Y Absent out of Z students" — updates live as toggles change
- Empty state: "No students registered for this batch"

> For **automated sessions** (`isAutomated = true`), this section is read-only — the system populated attendance from biometrics. Toggles should be disabled.

---

#### Section E — Submit Bar

Fixed at bottom of the form.

**Controls:**
- **Submit / Save button** — "Save Attendance" → calls `POST /api/v1/attendance/sessions/record`
- **Refresh button** — resets the form without navigating away
- **Validation Summary** — inline error area that shows API error messages (e.g., "Cannot record attendance before the class start time (08:30)", "Date is outside term dates", "Cannot record for a future date")

---

## API: Submit Attendance

```
POST /api/v1/attendance/sessions/record
```

**Request body:**
```json
{
  "attendanceSessionGuid": "guid or null",
  "timetableGuid": "guid",
  "lecturerEmployeeGuid": "guid",
  "sessionDate": "2026-10-28",
  "isSkipped": false,
  "skipReason": null,
  "outlines": [
    {
      "courseUnitGuid": "guid",
      "batchGuid": "guid",
      "semesterGuid": "guid",
      "outlineTlGuid": "guid"
    }
  ],
  "studentRecords": [
    {
      "studentGuid": "guid",
      "isPresent": true
    }
  ]
}
```

**Success response — `AttendanceSessionDetailDto`:**
| Field | Type | Notes |
|---|---|---|
| `attendanceSessionGuid` | Guid | Session ID |
| `timetableGuid` | Guid | |
| `sessionDate` | DateOnly | |
| `isAutomated` | bool | |
| `isSkipped` | bool | |
| `skipReason` | int? | Enum value |
| `isSpecialClass` | bool | Show warning if true |
| `status` | int | 0=Scheduled, 1=Completed, 2=Cancelled, 3=Skipped |
| `outlines` | array | Saved outline GUIDs |
| `studentRecords` | array | Saved student GUIDs + present flag |

**On success:** Show success toast/notification "Attendance recorded successfully." and update the status badge to Completed (green).

---

## Validation Rules (enforced by backend — surface to user)

| Rule | Error Message |
|---|---|
| Session date is in the future | "Cannot record attendance for a future date." |
| Current time is before class start time | "Cannot record attendance before the class start time (HH:mm)." |
| Session date is outside the term dates | "Date is outside term {N} dates ({start} – {end})." |
| No outline topic selected | "Please select at least one outline topic." |
| Skip reason not provided when skipping | "Skip reason is required when skipping a class." |

These errors come from the API response body. The frontend should display them in the validation summary area near the submit button.

---

## Screen 3 — Session List (Management View)

A paginated list of all recorded sessions, for admin/coordinator view.

**API:**
```
GET /api/v1/attendance/sessions?page=1&pageSize=10&batchGuid={guid}&courseUnitGuid={guid}
```

**Query parameters (filters):**
| Param | Type | Control |
|---|---|---|
| `batchGuid` | Guid | Dropdown — filter by batch |
| `courseUnitGuid` | Guid | Dropdown — filter by course unit |
| `page` | int | Pagination control |
| `pageSize` | int | Items per page selector (10/25/50) |

**Table columns:**
| Field | Display |
|---|---|
| `sessionDate` | Date |
| `startTime` | Start |
| `endTime` | End |
| `status` | Status badge |
| `isAutomated` | "Biometric" / "Manual" chip |
| `isSkipped` | Show skip indicator if true |
| Actions | View / Edit / Delete buttons |

**Controls:**
- **Filter bar** — Batch dropdown + Course Unit dropdown + Search/Apply button
- **Paginated table** — with status badges and action buttons
- **View button** → opens Screen 2 in read-only mode with the session pre-filled
- **Edit button** → opens Screen 2 in edit mode (only for non-automated, non-cancelled sessions)
- **Delete button** → confirmation dialog before calling `DELETE /api/v1/attendance/sessions/{guid}`

---

## Enums Reference

### Session Status
| Value | Label | Badge Colour |
|---|---|---|
| `0` | Scheduled | Blue |
| `1` | Completed | Green |
| `2` | Cancelled | Grey |
| `3` | Skipped | Orange |

### Skip Reason
| Value | Label |
|---|---|
| `1` | Holiday |
| `2` | Lecturer Absence |
| `3` | On Duty |
| `4` | Other |

### Attendance Status (per student)
| Value | Label |
|---|---|
| `0` | Present |
| `1` | Absent |
| `2` | Late |
| `3` | Excused |

---

## Permissions

The backend enforces these permissions — the frontend should hide/disable controls accordingly:

| Permission | Controls affected |
|---|---|
| `ClassAttendance.Get` | View sessions, load students, load outlines |
| `ClassAttendance.Record` | Submit attendance (Save button) |
| `AttendanceSession.Add` | Create new session manually |
| `AttendanceSession.Edit` | Edit existing session |
| `AttendanceSession.Delete` | Delete session |

---

---

## Wireframes (Rough Sketches)

> These are layout sketches only — final colours, spacing, and typography are at the designer's discretion.

---

### Wireframe 1 — Pending Outlines Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISBAT ERP                                          [User] [Notifications]  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │                                                               │
│  [Nav Menu]  │   Pending Outline Sessions                                   │
│              │   ─────────────────────────────────────────────────────────  │
│  Dashboard   │                                                               │
│  Timetable   │   ┌─────────────────────────────────────────────────────┐   │
│  Attendance ◄│   │  [Timetable ▼ ──────────────────]  [Apply]          │   │
│  Reports     │   └─────────────────────────────────────────────────────┘   │
│              │                                                               │
│              │   ┌────────────────────────────────────────────────────────┐ │
│              │   │  ##  │  Date          │  Start   │  End     │  Action  │ │
│              │   ├────────────────────────────────────────────────────────┤ │
│              │   │  1   │  28 Oct 2026   │  08:00   │  10:00   │[Record]  │ │
│              │   │  2   │  27 Oct 2026   │  10:00   │  12:00   │[Record]  │ │
│              │   │  3   │  25 Oct 2026   │  14:00   │  16:00   │[Record]  │ │
│              │   │  4   │  22 Oct 2026   │  08:00   │  10:00   │[Record]  │ │
│              │   └────────────────────────────────────────────────────────┘ │
│              │                              [< Prev]  Page 1 of 3  [Next >] │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

### Wireframe 2 — Record Class Attendance (Main Form)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISBAT ERP                                          [User] [Notifications]  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │                                                               │
│  [Nav Menu]  │   Record Class Attendance                                    │
│              │   ─────────────────────────────────────────────────────────  │
│  Dashboard   │                                                               │
│  Timetable   │  ┌── Section A: Session Info ────────────────────────────┐  │
│  Attendance ◄│  │                                                        │  │
│  Reports     │  │   Session Date  [28 / Oct / 2026 📅]                  │  │
│              │  │                                                        │  │
│              │  │   ┌──────────────────────────────────────────────┐    │  │
│              │  │   │  Course Unit  :  Database Systems (DBS301)   │    │  │
│              │  │   │  Batch        :  BSIT-2024-A                 │    │  │
│              │  │   │  Lecturer     :  Dr. John Mukasa             │    │  │
│              │  │   │  Class Time   :  08:00 – 10:00               │    │  │
│              │  │   │  Status       :  ● Scheduled                 │    │  │
│              │  │   └──────────────────────────────────────────────┘    │  │
│              │  │                                                        │  │
│              │  │   ⚠  This is a special/makeup class  [shown if true]  │  │
│              │  └────────────────────────────────────────────────────────┘  │
│              │                                                               │
│              │  ┌── Section B: Skip Class ───────────────────────────────┐  │
│              │  │                                                         │  │
│              │  │   [ ] Skip this class session                           │  │
│              │  │                                                         │  │
│              │  │   Skip Reason  [── Select reason ──────────────── ▼]   │  │
│              │  │               (shown only when Skip is checked)         │  │
│              │  └─────────────────────────────────────────────────────────┘ │
│              │                                                               │
│              │  ┌── Section C: Outline Topics Covered ──────────────────┐  │
│              │  │                                                        │  │
│              │  │   [✓] DBS301-T01  Introduction to Relational Models    │  │
│              │  │   [✓] DBS301-T02  ER Diagrams and Normalisation        │  │
│              │  │   [ ] DBS301-T03  SQL Fundamentals                     │  │
│              │  │   [ ] DBS301-T04  Joins and Subqueries                 │  │
│              │  │   [ ] DBS301-T05  Transactions and ACID Properties     │  │
│              │  │                                                        │  │
│              │  │   ⚠  Please select at least one topic  (validation)   │  │
│              │  └────────────────────────────────────────────────────────┘  │
│              │                                                               │
│              │  ┌── Section D: Student Attendance ──────────────────────┐  │
│              │  │                                                        │  │
│              │  │   [Mark All Present]  [Mark All Absent]               │  │
│              │  │   ● 22 Present  /  3 Absent  of 25 students           │  │
│              │  │                                                        │  │
│              │  │  ┌──────────────────────────────────────────────────┐ │  │
│              │  │  │ ##  │ Std Number │ Student Name      │ Present   │ │  │
│              │  │  ├──────────────────────────────────────────────────┤ │  │
│              │  │  │  1  │ 2024/BIT/01│ Alice Nakamura    │  [●  ○]  │ │  │
│              │  │  │  2  │ 2024/BIT/02│ Brian Ssekandi    │  [●  ○]  │ │  │
│              │  │  │  3  │ 2024/BIT/03│ Carol Atim        │  [○  ●]  │ │  │
│              │  │  │  4  │ 2024/BIT/04│ David Mugisha     │  [●  ○]  │ │  │
│              │  │  │ ... │ ...        │ ...               │  ...     │ │  │
│              │  │  └──────────────────────────────────────────────────┘ │  │
│              │  │         [●  ○] = Present toggle  /  [○  ●] = Absent   │  │
│              │  └────────────────────────────────────────────────────────┘  │
│              │                                                               │
│              │  ┌── Section E: Submit Bar ───────────────────────────────┐  │
│              │  │                                                         │  │
│              │  │  ⚠ Cannot record attendance before class start time    │  │
│              │  │    (shown when current time < class start time)         │  │
│              │  │                                                         │  │
│              │  │            [Refresh]        [Save Attendance]           │  │
│              │  └─────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

**Skip Class active state (Section B expanded, Sections C & D hidden):**

```
  ┌── Section B: Skip Class ─────────────────────────────────────────────┐
  │                                                                       │
  │   [✓] Skip this class session                                         │
  │                                                                       │
  │   Skip Reason  [Lecturer Absence ────────────────────────────── ▼]   │
  │                                                                       │
  │   Sections C and D are hidden ↓                                       │
  │                                                                       │
  │               [Refresh]          [Save — Skip Session]                │
  └───────────────────────────────────────────────────────────────────────┘
```

**Automated session state (biometric — Section D read-only):**

```
  ┌── Section D: Student Attendance (Biometric) ──────────────────────────┐
  │                                                                        │
  │  ℹ  Attendance populated automatically from biometric system.          │
  │     Student records are read-only.                                     │
  │                                                                        │
  │  ┌────────────────────────────────────────────────────────────────┐   │
  │  │ ##  │ Std Number  │ Student Name      │ Status                 │   │
  │  ├────────────────────────────────────────────────────────────────┤   │
  │  │  1  │ 2024/BIT/01 │ Alice Nakamura    │ ✔ Present             │   │
  │  │  2  │ 2024/BIT/02 │ Brian Ssekandi    │ ✘ Absent              │   │
  │  └────────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────────────┘
```

---

### Wireframe 3 — Session List (Management View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISBAT ERP                                          [User] [Notifications]  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │                                                               │
│  [Nav Menu]  │   Attendance Sessions                                        │
│              │   ─────────────────────────────────────────────────────────  │
│  Dashboard   │                                                               │
│  Timetable   │  ┌── Filters ──────────────────────────────────────────────┐ │
│  Attendance ◄│  │  Batch [── Select Batch ─────── ▼]                      │ │
│  Reports     │  │  Unit  [── Select Course Unit ── ▼]    [Apply] [Clear]  │ │
│              │  └─────────────────────────────────────────────────────────┘ │
│              │                                                               │
│              │  ┌───────────────────────────────────────────────────────────┐│
│              │  │ ##│ Date        │Start │End  │ Status      │Type  │Actions││
│              │  ├───────────────────────────────────────────────────────────┤│
│              │  │ 1 │ 28 Oct 2026 │08:00 │10:00│ ● Completed │Manual│[👁][✏]││
│              │  │ 2 │ 27 Oct 2026 │10:00 │12:00│ ● Completed │Manual│[👁][✏]││
│              │  │ 3 │ 25 Oct 2026 │08:00 │10:00│ ◌ Skipped   │Manual│[👁]   ││
│              │  │ 4 │ 22 Oct 2026 │14:00 │16:00│ ● Completed │Biomet│[👁]   ││
│              │  │ 5 │ 20 Oct 2026 │08:00 │10:00│ ○ Scheduled │Manual│[👁][✏]││
│              │  └───────────────────────────────────────────────────────────┘│
│              │                                                               │
│              │   Show [10 ▼] per page          [< Prev] Page 1/4 [Next >]  │
└──────────────┴──────────────────────────────────────────────────────────────┘

  Status badge legend:
  ● Green   = Completed
  ● Blue    = Scheduled
  ◌ Orange  = Skipped
  ● Grey    = Cancelled

  Type badge:
  "Manual"  = lecturer-entered (isAutomated = false)
  "Biomet"  = biometric system (isAutomated = true)

  Actions:
  [👁] View   → opens Record Attendance screen in read-only mode
  [✏] Edit   → opens Record Attendance screen in edit mode
       (Edit only shown for non-automated, non-cancelled sessions)
```

---

### Delete Confirmation Dialog

```
  ┌────────────────────────────────────────────┐
  │  Delete Session                            │
  │  ──────────────────────────────────────    │
  │                                            │
  │  Are you sure you want to delete the       │
  │  session for 28 Oct 2026?                  │
  │                                            │
  │  This action cannot be undone.             │
  │                                            │
  │           [Cancel]   [Delete]              │
  └────────────────────────────────────────────┘
```

---

## Notes for Designer

- **Automated sessions** (`isAutomated = true`) are created by the biometric system. On these sessions the student attendance list is **read-only** — do not show toggles, show a banner: "Attendance populated automatically from biometric system."
- **Special classes** (`isSpecialClass = true`) happen when the session date does not fall on the scheduled day of the week. Show a distinct warning banner.
- The **Submit button must be disabled** if the current time is before `startTime` on today's date — the backend will also reject the request, but the button state should reflect this proactively.
- All dates use `YYYY-MM-DD` format in API calls.
- All times are `HH:mm:ss` (24-hour) from the API.
