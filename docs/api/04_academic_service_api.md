# ISBAT University ERP — Academic Service API
### REST API Specification · Backend: .NET Core 8 · Version: v2

---

## Table of Contents

1. [Base Architecture](#1-base-architecture)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Standard Response Envelope](#3-standard-response-envelope)
4. [Error Codes](#4-error-codes)
5. [Domain: Dashboard](#5-domain-dashboard)
6. [Domain: Intake Master (Academic Calendar & Sessions)](#6-domain-intake-master-academic-calendar--sessions)
7. [Domain: Course Units Master (Curriculum)](#7-domain-course-units-master-curriculum)
8. [Domain: Course Unit Allocation](#8-domain-course-unit-allocation)
9. [Domain: Timetable Management](#9-domain-timetable-management)
10. [Domain: Attendance](#10-domain-attendance)
11. [Domain: Coursework (CW) Management](#11-domain-coursework-cw-management)
12. [Domain: Class-Based Test (CBT) Management](#12-domain-class-based-test-cbt-management)
13. [Domain: Examination Schedule](#13-domain-examination-schedule)
14. [Domain: Results & Grade Records](#14-domain-results--grade-records)
15. [Domain: Session Movement](#15-domain-session-movement)
16. [Domain: Student Lookup & Profile](#16-domain-student-lookup--profile)
17. [Domain: Finance Clearance (Read-Only Proxy)](#17-domain-finance-clearance-read-only-proxy)
18. [Domain: Notifications](#18-domain-notifications)
19. [Domain: Faculty Master](#19-domain-faculty-master)
20. [Domain: Lecturer Master](#20-domain-lecturer-master)
21. [Domain: Skill Management](#21-domain-skill-management)
22. [Domain: Programme Level](#22-domain-programme-level)
23. [Domain: Programme Group](#23-domain-programme-group)
24. [Domain: Programme Master](#24-domain-programme-master)
25. [Domain: Batch Management](#25-domain-batch-management)
26. [Domain: Fee Structure](#26-domain-fee-structure)
27. [Domain: ODL Applications](#27-domain-odl-applications)
28. [Domain: ODL Payment Reconciliation](#28-domain-odl-payment-reconciliation)
29. [Domain: Qualification Equating](#29-domain-qualification-equating)
30. [Domain: Grievance Management](#30-domain-grievance-management)
31. [Domain: Access Gate](#31-domain-access-gate)
32. [C# DTO Definitions](#32-c-dto-definitions)

---

## 1. Base Architecture

```
Base URL (production) : https://api.isbat.ac.ug/api/v1/academic
Base URL (staging)    : https://staging-api.isbat.ac.ug/api/v1/academic
Base URL (local dev)  : http://localhost:5001/api/v1/academic
```

### Service Identity

| Property | Value |
|---|---|
| Service Name | `Academic Service` |
| Internal Port | `5001` |
| Framework | .NET 8 Web API (Minimal API Controllers) |
| Auth Mechanism | JWT Bearer (issued by Auth Gateway, `Service 1`) |
| Dependent Services | Auth Gateway (S1), Finance/Clearance (S3), Assessment Module (S4), Student Microservice (S10) |
| Database | PostgreSQL 16 (EF Core 8) |
| Caching | Redis (output caching on read-heavy timetable/results endpoints) |

### URL Conventions

```
GET    /resource             → list collection
GET    /resource/{id}        → single record
POST   /resource             → create
PUT    /resource/{id}        → full replace
PATCH  /resource/{id}        → partial update
DELETE /resource/{id}        → soft-delete (sets IsDeleted = true)

All list endpoints support:
  ?page=1&pageSize=20        → pagination (default pageSize = 20, max = 100)
  ?search=keyword            → free-text search
  ?sortBy=field&sortDir=asc  → sorting
```

---

## 2. Authentication & Authorization

All endpoints require a valid JWT Bearer token issued by the Auth Gateway. Pass the token in the `Authorization` header.

```http
Authorization: Bearer <jwt_token>
```

### Required JWT Claims

| Claim | Type | Description |
|---|---|---|
| `sub` | `string` | Subject — Student number or Staff ID |
| `role` | `string[]` | One or more of: `Student`, `Lecturer`, `Dean`, `Registrar`, `Admin` |
| `campus` | `string` | Campus code (e.g. `main`, `kampala-city`) |
| `programme` | `string` | Programme code (students only, e.g. `BSCS`) |
| `exp` | `number` | Expiry Unix timestamp |

### Role Permission Matrix

| Endpoint Group | Student | Lecturer | Dean | Registrar | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard (own/admin view) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Timetable (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Timetable (write) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Course Units (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Course Units (write) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Attendance (mark) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Attendance (view own) | ✅ | ❌ | ✅ | ✅ | ✅ |
| CW/CBT (schedule) | ❌ | ✅ | ✅ | ✅ | ✅ |
| CW/CBT (submit marks) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Results (read own) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Results (publish) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Session Movement | ❌ | ❌ | ❌ | ✅ | ✅ |
| Student Profile (own) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Student Profile (any) | ❌ | ✅* | ✅ | ✅ | ✅ |
| Intake Master (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Faculty Master (write) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lecturer Master (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Skill Management (write) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Programme Level/Group/Master (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Batch Management (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Fee Structure (write) | ❌ | ❌ | ❌ | ❌ | ✅ |
| ODL Applications (process) | ❌ | ❌ | ❌ | ✅ | ✅ |
| ODL Reconciliation (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Qualification Equating (write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Grievance (manage) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Access Gate (write) | ❌ | ❌ | ✅ | ✅ | ✅ |

> *Lecturers may view profiles of students enrolled in their allocated course units only.

---

## 3. Standard Response Envelope

All responses — success and error — are wrapped in the following `.NET enterprise` envelope.

### Success

```json
{
  "isSuccess": true,
  "data": { ... },
  "message": null,
  "errors": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

> `meta` is present only on paginated list responses. It is omitted for single-resource responses.

### Error

```json
{
  "isSuccess": false,
  "data": null,
  "message": "Validation failed.",
  "errors": [
    { "field": "courseCode", "message": "Course code already exists." }
  ],
  "meta": null
}
```

---

## 4. Error Codes

| HTTP Status | Scenario |
|---|---|
| `200 OK` | Successful read or update |
| `201 Created` | Resource created successfully |
| `204 No Content` | Successful delete or action with no body |
| `400 Bad Request` | Validation failure or malformed payload |
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | JWT valid but insufficient role |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (e.g., timetable clash) |
| `422 Unprocessable Entity` | Business rule violation (e.g., publishing results before CW entry complete) |
| `500 Internal Server Error` | Unhandled server exception |

---

## 5. Domain: Dashboard

### `GET /dashboard/summary`

Returns the student's (or staff's) academic overview — GPA, credit load, attendance rate, and current semester metadata. Powers the **Academic Dashboard** landing view.

**Query Parameters:** none

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "fullName": "Sarah Nakato",
    "programme": "BSc. Computer Science",
    "campus": "Kampala Main",
    "semester": "Semester 5",
    "academicYear": "2025–2026",
    "studyMode": "Day",
    "gpa": 3.72,
    "cgpa": 3.65,
    "creditsEarned": 96,
    "creditLoad": 18,
    "attendanceRate": 87.4,
    "feeClearanceStatus": "Cleared",
    "registrationStatus": "Active",
    "notifications": [
      {
        "id": "notif-001",
        "type": "Warning",
        "message": "Attendance below 75% in IT305.",
        "createdAt": "2026-05-10T08:00:00+03:00",
        "isRead": false
      }
    ]
  },
  "message": null
}
```

### `GET /dashboard/admin-summary`

Returns the admin/registrar ERP overview used by the **Academic Dashboard** admin landing view. Requires `Dean`, `Registrar`, or `Admin` role.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `intakeCode` | `string` | current | Filter stats by intake code (e.g. `20261`) |

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "intakeCode": "20261",
    "intakeLabel": "Spring 2026",
    "activeStudents": 1284,
    "allocationPending": 3,
    "timetablesActive": 14,
    "odlPendingRecon": 4,
    "setupHierarchy": {
      "facultiesConfigured": true,
      "programmeLevelsConfigured": true,
      "programmeGroupsConfigured": true,
      "programmeMasterConfigured": true,
      "courseUnitsLinked": true
    },
    "semesterCycle": {
      "allocationDone": true,
      "timetablePublished": true,
      "courseworkScheduled": false,
      "examScheduled": false
    },
    "activeBatches": [
      {
        "batchCode": "BSCS-2026-A",
        "programme": "BSc. Computer Science",
        "studyMode": "Day",
        "enrolledCount": 48,
        "capacity": 60
      }
    ],
    "recentActivity": [
      {
        "type": "ODL_APPLICATION",
        "description": "New ODL application: James Opio (20261-ODL-0112)",
        "timestamp": "2026-05-24T14:23:00+03:00"
      }
    ]
  },
  "message": null
}
```

---

## 6. Domain: Intake Master (Academic Calendar & Sessions)

### `GET /academic-years`

Returns all configured academic years and their semester date windows.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "ay-2526",
      "label": "Academic Year 2025–2026",
      "isCurrent": true,
      "semesters": [
        {
          "semesterNo": 1,
          "label": "Semester 1",
          "startDate": "2025-09-01",
          "endDate": "2026-01-31",
          "examStartDate": "2026-01-20",
          "examEndDate": "2026-01-31",
          "isActive": false
        },
        {
          "semesterNo": 2,
          "label": "Semester 2",
          "startDate": "2026-02-01",
          "endDate": "2026-06-30",
          "examStartDate": "2026-06-15",
          "examEndDate": "2026-06-30",
          "isActive": true
        }
      ]
    }
  ],
  "message": null
}
```

### `GET /academic-years/current`

Returns the currently active academic year and semester. Shorthand used by all other endpoints that default to the current period.

### Intake Master Endpoints

The **Intake Master** admin page manages intake records (semester/year enrolment windows). Intakes correspond to the `intakeCode` used across the ERP (e.g., `20261` = Spring 2026, Semester 1).

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/intakes` | Any staff | List all intakes |
| `GET` | `/intakes/{code}` | Any staff | Get single intake |
| `POST` | `/intakes` | Registrar, Admin | Create new intake |
| `PUT` | `/intakes/{code}` | Registrar, Admin | Update intake |
| `PATCH` | `/intakes/{code}/status` | Registrar, Admin | Toggle active/inactive |
| `DELETE` | `/intakes/{code}` | Admin | Soft-delete intake |

### `GET /intakes`

**Query Parameters:** `?academicYear=2025-2026&studyMode=Day&status=Active`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "code": "20261",
      "label": "Spring 2026",
      "academicYear": "2025–2026",
      "semesterNo": 2,
      "studyMode": "Day",
      "registrationStart": "2026-01-15",
      "registrationEnd": "2026-02-28",
      "classesStart": "2026-03-01",
      "classesEnd": "2026-06-30",
      "status": "Active",
      "enrolledCount": 1284
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 12, "totalPages": 1 }
}
```

### `POST /intakes`

**Request Body:**

```json
{
  "code": "20262",
  "label": "Autumn 2026",
  "academicYearId": "ay-2526",
  "semesterNo": 1,
  "studyMode": "Day",
  "registrationStart": "2026-07-01",
  "registrationEnd": "2026-08-31",
  "classesStart": "2026-09-01",
  "classesEnd": "2027-01-31"
}
```

**Response `201 Created`:** Returns the created intake object.

### `PATCH /intakes/{code}/status`

```json
{ "status": "Inactive" }
```

**Response `200 OK`:** `{ "isSuccess": true, "data": { "code": "20261", "status": "Inactive" } }`

---

## 7. Domain: Course Units Master (Curriculum)

### `GET /course-units`

Returns the full curriculum (Course Units Master). Supports filtering by programme, semester, and campus.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `programmeCode` | `string` | No | Filter by programme (e.g. `BSCS`) |
| `semesterNo` | `int` | No | Filter by semester number (1–8) |
| `unitType` | `string` | No | `theory`, `practical`, `cbt`, `project` |
| `campus` | `string` | No | Campus code |

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "courseCode": "IT101",
      "courseName": "Introduction to Programming",
      "credits": 3,
      "semesterNo": 1,
      "programmeCode": "BSCS",
      "unitType": "theory",
      "assessmentWeightage": {
        "coursework": { "rawMark": 25, "scaledMark": 15 },
        "cbt":        { "rawMark": 50, "scaledMark": 15 },
        "universityExam": { "rawMark": 100, "scaledMark": 70 },
        "practical":  null
      },
      "passMarkPercent": 50,
      "hasOutline": true,
      "outlineChapterCount": 5,
      "isActive": true
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 40, "totalPages": 2 }
}
```

### `GET /course-units/{courseCode}`

Returns a single Course Unit including its full syllabus outline.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "courseCode": "IT101",
    "courseName": "Introduction to Programming",
    "credits": 3,
    "semesterNo": 1,
    "programmeCode": "BSCS",
    "unitType": "theory",
    "assessmentWeightage": {
      "coursework":     { "rawMark": 25, "scaledMark": 15 },
      "cbt":            { "rawMark": 50, "scaledMark": 15 },
      "universityExam": { "rawMark": 100, "scaledMark": 70 },
      "practical":      null
    },
    "passMarkPercent": 50,
    "outline": [
      {
        "chapterNo": 1,
        "title": "Introduction to Programming Concepts",
        "topics": [
          "Primitive Types",
          "Variables & Constants",
          "Type Casting"
        ]
      },
      {
        "chapterNo": 2,
        "title": "Function Definition",
        "topics": [
          "Parameters & Return Values",
          "Recursion"
        ]
      }
    ],
    "isActive": true
  },
  "message": null
}
```

### `POST /course-units`

Creates a new Course Unit. Dean / Registrar / Admin only.

**Request Body:**

```json
{
  "courseCode": "IT201",
  "courseName": "Data Structures and Algorithms",
  "credits": 3,
  "semesterNo": 2,
  "programmeCode": "BSCS",
  "unitType": "theory",
  "unitCategory": "Compulsory",
  "assessmentWeightage": {
    "coursework":     { "rawMark": 25, "scaledMark": 15 },
    "cbt":            { "rawMark": 50, "scaledMark": 15 },
    "universityExam": { "rawMark": 100, "scaledMark": 70 },
    "practical":      null
  },
  "passMarkPercent": 50
}

> **`unitType` enum:** `"Theory"` | `"Practical"` | `"CBT"` | `"Project"` | `"Mixed"`
>
> **`unitCategory` enum:** `"Compulsory"` | `"Elective"` | `"Optional"` | `"Core"`
```

**Response `201 Created`:** Returns the created `CourseUnitDto` inside the envelope.

### `PUT /course-units/{courseCode}`

Full replace of a Course Unit record.

### `PUT /course-units/{courseCode}/outline`

Replaces the entire syllabus outline (chapters + topics) for a given Course Unit. Validates that chapter count does not exceed the configured maximum before saving.

**Request Body:**

```json
{
  "chapters": [
    {
      "chapterNo": 1,
      "title": "Introduction to Programming Concepts",
      "topics": ["Primitive Types", "Variables & Constants"]
    }
  ]
}
```

**Response `200 OK`:** Returns the updated outline.

---

## 8. Domain: Course Unit Allocation

### `GET /allocations`

Returns all faculty-to-course-unit allocations for the active semester.

**Query Parameters:** `programmeCode`, `semesterNo`, `lecturerStaffId`, `batchId`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "allocationId": "alloc-001",
      "courseCode": "IT101",
      "courseName": "Introduction to Programming",
      "batchId": "BSC-IT-S1-D",
      "batchLabel": "BSc. IT · Semester 1 · Day",
      "lecturerStaffId": "STF/2020/042",
      "lecturerName": "Dr. Ssekibuule Ronald",
      "academicYear": "2025–2026",
      "semesterNo": 1
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 12, "totalPages": 1 }
}
```

### `POST /allocations`

Assigns a lecturer to a course unit / batch. Dean / Admin only.

**Request Body:**

```json
{
  "courseCode": "IT101",
  "batchId": "BSC-IT-S1-D",
  "lecturerStaffId": "STF/2020/042",
  "academicYear": "2025–2026",
  "semesterNo": 1
}
```

### `POST /allocations/import`

Bulk-imports course allocations from the Dean's Excel export. Accepts `multipart/form-data` with a single `file` field (`.xlsx`). Returns a summary of imported rows and any validation errors per row.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "importedCount": 48,
    "skippedCount": 2,
    "errors": [
      { "row": 12, "message": "Course code IT999 not found in Course Units Master." }
    ]
  },
  "message": "Import complete."
}
```

### `DELETE /allocations/{allocationId}`

Removes a course-unit allocation (soft-delete).

---

## 9. Domain: Timetable Management

### `GET /timetable`

Returns the full timetable for all active batches, optionally filtered. Students receive only their batch.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `batchId` | `string` | e.g. `BSC-IT-S1-D` |
| `day` | `string` | `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat` |
| `week` | `string` | ISO week string (e.g. `2026-W22`) |

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "batchId": "BSC-IT-S1-D",
    "batchLabel": "BSc. IT · Semester 1 · Day",
    "isPublished": true,
    "publishedAt": "2026-05-01T10:30:00+03:00",
    "slots": [
      {
        "slotId": "slot-001",
        "day": "Mon",
        "startTime": "08:00",
        "endTime": "10:00",
        "courseCode": "IT101",
        "courseName": "Introduction to Programming",
        "type": "Lecture",
        "venue": "LR-02",
        "lecturerStaffId": "STF/2020/042",
        "lecturerName": "Dr. Ssekibuule Ronald",
        "colorToken": "c1",
        "hasConflict": false
      }
    ],
    "conflicts": []
  },
  "message": null
}
```

### `POST /timetable/slots`

Saves a new timetable slot. Performs server-side clash detection across venue and lecturer before saving.

**Request Body:**

```json
{
  "batchId": "BSC-IT-S1-D",
  "day": "Mon",
  "startTime": "08:00",
  "endTime": "10:00",
  "courseCode": "IT101",
  "type": "Lecture",
  "venue": "LR-02",
  "lecturerStaffId": "STF/2020/042"
}
```

**Response `201 Created`:** Returns the created slot including `slotId`.

**Response `409 Conflict` (clash detected):**

```json
{
  "isSuccess": false,
  "data": null,
  "message": "Timetable clash detected.",
  "errors": [
    { "field": "venue",   "message": "LR-02 is already occupied on Mon 08:00–10:00." },
    { "field": "lecturer","message": "Dr. Ssekibuule Ronald has a conflicting slot on Mon 08:00–10:00." }
  ]
}
```

### `PUT /timetable/slots/{slotId}`

Updates an existing slot. Re-runs clash detection.

### `DELETE /timetable/slots/{slotId}`

Removes a slot from the timetable draft.

### `POST /timetable/publish`

Publishes the timetable for a batch, making it visible on the Student Portal and Lecturer view immediately.

**Request Body:**

```json
{
  "batchId": "BSC-IT-S1-D"
}
```

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": { "batchId": "BSC-IT-S1-D", "publishedAt": "2026-05-20T14:10:00+03:00" },
  "message": "Timetable published. Immediately visible on Student Portal and Faculty view."
}
```

### `POST /timetable/import`

Bulk-imports timetable slots from an Excel file (Dean's format). Returns import summary and conflict report.

---

## 10. Domain: Attendance

### `GET /attendance`

Returns attendance records for the authenticated student across all enrolled course units in the current semester.

**Query Parameters:** `semesterNo`, `academicYear`, `courseCode`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "semester": "Semester 2",
    "academicYear": "2025–2026",
    "overallPercentage": 87.4,
    "records": [
      {
        "courseCode": "IT305",
        "courseName": "Operating Systems",
        "totalClasses": 24,
        "attended": 17,
        "absent": 7,
        "percentage": 70.8,
        "isBelow75": true,
        "lastUpdated": "2026-05-18T16:00:00+03:00"
      },
      {
        "courseCode": "IT306",
        "courseName": "Database Management",
        "totalClasses": 22,
        "attended": 21,
        "absent": 1,
        "percentage": 95.5,
        "isBelow75": false,
        "lastUpdated": "2026-05-18T16:00:00+03:00"
      }
    ]
  },
  "message": null
}
```

### `GET /attendance/course/{courseCode}`

Returns session-level attendance register for a given course unit (Lecturer view — shows each student's attendance per session).

**Query Parameters:** `batchId`, `semesterNo`, `fromDate`, `toDate`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "courseCode": "IT305",
    "courseName": "Operating Systems",
    "batchId": "BSC-IT-S3-D",
    "sessions": [
      {
        "sessionId": "sess-001",
        "date": "2026-05-06",
        "day": "Tue",
        "startTime": "10:00",
        "endTime": "12:00",
        "attendanceEntries": [
          { "studentNo": "ISB/2024/0028", "studentName": "Sarah Nakato", "status": "Present" },
          { "studentNo": "ISB/2024/0031", "studentName": "James Okello",  "status": "Absent"  }
        ]
      }
    ]
  },
  "message": null
}
```

### `POST /attendance/mark`

Records attendance for a session. Supports both biometric scan and manual entry. Lecturer / Admin only.

**Request Body:**

```json
{
  "courseCode": "IT305",
  "batchId": "BSC-IT-S3-D",
  "sessionDate": "2026-05-20",
  "startTime": "10:00",
  "endTime": "12:00",
  "source": "manual",
  "entries": [
    { "studentNo": "ISB/2024/0028", "status": "Present" },
    { "studentNo": "ISB/2024/0031", "status": "Absent" }
  ]
}
```

**Response `201 Created`:**

```json
{
  "isSuccess": true,
  "data": {
    "sessionId": "sess-088",
    "markedCount": 2,
    "presentCount": 1,
    "absentCount": 1
  },
  "message": "Attendance marked successfully."
}
```

---

## 11. Domain: Coursework (CW) Management

### `GET /coursework`

Returns all scheduled coursework tasks for the active semester. Students see their own assignments with submission deadlines and marks. Lecturers see all tasks they own.

**Query Parameters:** `courseCode`, `batchId`, `semesterNo`, `status` (`scheduled`, `submitted`, `marked`, `published`)

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "cwId": "cw-001",
      "courseCode": "IT305",
      "courseName": "Operating Systems",
      "batchId": "BSC-IT-S3-D",
      "title": "Coursework — Term 1 · Spring 2026",
      "rawMarkOutOf": 25,
      "scaledMarkOutOf": 15,
      "dueDate": "2026-04-15T23:59:00+03:00",
      "status": "marked",
      "submissionCount": 42,
      "markedCount": 42,
      "isPublished": false
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 6, "totalPages": 1 }
}
```

### `POST /coursework`

Schedules a new Coursework task. Lecturer / Dean / Admin only.

**Request Body:**

```json
{
  "courseCode": "IT305",
  "batchId": "BSC-IT-S3-D",
  "title": "Coursework — Term 1 · Spring 2026",
  "rawMarkOutOf": 25,
  "dueDate": "2026-04-15T23:59:00+03:00",
  "instructions": "Submit a 5-page research paper on process scheduling algorithms."
}
```

### `GET /coursework/{cwId}/submissions`

Returns all student submissions for a CW task. Includes marks where entered.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "studentNo": "ISB/2024/0028",
      "studentName": "Sarah Nakato",
      "submittedAt": "2026-04-14T21:33:00+03:00",
      "rawMark": 22,
      "scaledMark": 13.2,
      "feedback": "Well structured. Missing conclusion.",
      "isLate": false
    }
  ],
  "message": null
}
```

### `PUT /coursework/{cwId}/marks`

Batch-updates marks for all students in a CW task. Triggers automatic scaling (`rawMark / rawMarkOutOf × scaledMarkOutOf`).

**Request Body:**

```json
{
  "entries": [
    { "studentNo": "ISB/2024/0028", "rawMark": 22, "feedback": "Well structured." },
    { "studentNo": "ISB/2024/0031", "rawMark": 18, "feedback": "Good effort." }
  ]
}
```

---

## 12. Domain: Class-Based Test (CBT) Management

### `GET /cbt`

Returns all scheduled CBT (Class-Based Test) entries. Query and response structure mirror the `/coursework` domain but represent computer-lab-based assessments.

**Query Parameters:** `courseCode`, `batchId`, `semesterNo`, `status`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "cbtId": "cbt-001",
      "courseCode": "IT305",
      "courseName": "Operating Systems",
      "batchId": "BSC-IT-S3-D",
      "title": "Scheduled Class Test — Term 1",
      "venue": "Lab-A",
      "scheduledDate": "2026-05-10",
      "startTime": "10:00",
      "endTime": "12:00",
      "durationMinutes": 120,
      "rawMarkOutOf": 50,
      "scaledMarkOutOf": 15,
      "status": "completed",
      "questionPaperAvailable": true,
      "isPublished": false
    }
  ],
  "message": null
}
```

### `POST /cbt`

Schedules a new CBT session.

**Request Body:**

```json
{
  "courseCode": "IT305",
  "batchId": "BSC-IT-S3-D",
  "title": "Scheduled Class Test — Term 1",
  "venue": "Lab-A",
  "scheduledDate": "2026-05-10",
  "startTime": "10:00",
  "endTime": "12:00",
  "rawMarkOutOf": 50
}
```

### `GET /cbt/{cbtId}/question-paper`

Returns the question paper metadata (not the file itself — returns a pre-signed download URL).

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "cbtId": "cbt-001",
    "downloadUrl": "https://storage.isbat.ac.ug/qp/cbt-001.pdf?token=...",
    "expiresAt": "2026-05-10T13:00:00+03:00"
  },
  "message": null
}
```

### `PUT /cbt/{cbtId}/marks`

Batch-updates CBT marks. Same structure as `PUT /coursework/{cwId}/marks`.

---

## 13. Domain: Examination Schedule

### `GET /exams`

Returns the University Exam (UE) schedule table for a semester.

**Query Parameters:** `programmeCode`, `semesterNo`, `academicYear`, `batchId`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "examId": "ue-001",
      "courseCode": "IT305",
      "courseName": "Operating Systems",
      "programmeCode": "BSCS",
      "semesterNo": 3,
      "examDate": "2026-06-20",
      "examDay": "Sat",
      "startTime": "09:00",
      "endTime": "12:00",
      "venue": "Main Hall",
      "invigilator": "Prof. Mukasa",
      "rawMarkOutOf": 100,
      "scaledMarkOutOf": 70,
      "status": "scheduled"
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 8, "totalPages": 1 }
}
```

### `POST /exams`

Creates a new exam schedule entry. Registrar / Admin only.

**Request Body:**

```json
{
  "courseCode": "IT305",
  "programmeCode": "BSCS",
  "semesterNo": 3,
  "examDate": "2026-06-20",
  "startTime": "09:00",
  "endTime": "12:00",
  "venue": "Main Hall",
  "invigilator": "Prof. Mukasa"
}
```

---

## 14. Domain: Results & Grade Records

> **Important:** The Academic Module consumes CW/CBT/UE submission data from the Assessment Module (Service 4). Results are aggregated here and stored upon `POST /results/publish`.

### `GET /results`

Returns the full grade record for the authenticated student.

**Query Parameters:** `semesterNo`, `academicYear`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "fullName": "Sarah Nakato",
    "programme": "BSc. Computer Science",
    "semester": "Semester 5",
    "academicYear": "2025–2026",
    "gpa": 3.72,
    "creditsAttempted": 18,
    "creditsEarned": 18,
    "grades": [
      {
        "courseCode": "IT301",
        "courseName": "Computer Networks",
        "credits": 3,
        "cwMark": 13.5,
        "cbtMark": 12.0,
        "examMark": 61.0,
        "practicalMark": null,
        "totalMark": 86.5,
        "grade": "A",
        "gradePoints": 4.0,
        "status": "Pass",
        "semester": "Semester 5",
        "isPublished": true
      }
    ]
  },
  "message": null
}
```

### `GET /results/batch/{batchId}`

Returns marks sheet for all students in a batch. Dean / Registrar / Admin only. Used for result generation before publication.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "batchId": "BSC-IT-S3-D",
    "batchLabel": "BSc. IT · Semester 3 · Day",
    "semester": "Semester 3",
    "academicYear": "2025–2026",
    "isPublished": false,
    "summary": {
      "totalStudents": 47,
      "passed": 40,
      "failed": 5,
      "pending": 2,
      "passRate": 85.1
    },
    "records": [
      {
        "studentNo": "ISB/2024/0028",
        "fullName": "Sarah Nakato",
        "grades": [
          {
            "courseCode": "IT301",
            "totalMark": 86.5,
            "grade": "A",
            "gradePoints": 4.0,
            "status": "Pass"
          }
        ],
        "semesterGPA": 3.72,
        "outcome": "Promoted"
      }
    ]
  },
  "message": null
}
```

### `GET /results/student/{studentNo}/transcript`

Returns the full academic transcript for a student across all semesters. Used by the Registrar to generate official transcripts.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "fullName": "Sarah Nakato",
    "programme": "BSc. Computer Science",
    "campus": "Kampala Main",
    "studyMode": "Day",
    "cgpa": 3.65,
    "totalCreditsEarned": 96,
    "semesters": [
      {
        "semesterNo": 1,
        "academicYear": "2024–2025",
        "gpa": 3.55,
        "creditsAttempted": 18,
        "creditsEarned": 18,
        "grades": [ /* same grade array as above */ ]
      }
    ]
  },
  "message": null
}
```

### `POST /results/publish`

Publishes results for a batch, making them visible on the Student Portal and Lecturer view immediately. Triggers the `Session Movement` eligibility check. Registrar / Admin only.

**Request Body:**

```json
{
  "batchId": "BSC-IT-S3-D",
  "semesterNo": 3,
  "academicYear": "2025–2026"
}
```

**Business rule validation (422):** If any CW, CBT, or UE marks are still pending for enrolled students, the API returns `422` with a list of incomplete entries.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "batchId": "BSC-IT-S3-D",
    "publishedAt": "2026-07-01T09:00:00+03:00",
    "studentsNotified": 47
  },
  "message": "Results published. Immediately visible on Student Portal and Faculty view."
}
```

### Grading Scale

| Mark Range | Grade | Grade Points |
|---|---|---|
| 80–100 | A | 4.0 |
| 70–79 | B+ | 3.5 |
| 60–69 | B | 3.0 |
| 50–59 | C | 2.0 |
| 40–49 | D | 1.0 |
| 0–39 | F | 0.0 |

---

## 15. Domain: Session Movement

Session Movement is the end-of-semester process that promotes, repeats, defers, or marks students as Dropout based on their academic results.

**Eligibility Rule:** A student must pass ≥ 50% of subjects from the current semester to be promoted to the next.

### `GET /session-movement/preview/{batchId}`

Dry-run preview of session movement outcomes for a batch without committing any changes.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "batchId": "BSC-IT-S3-D",
    "academicYear": "2025–2026",
    "semesterNo": 3,
    "totalStudents": 47,
    "outcomes": [
      {
        "studentNo": "ISB/2024/0028",
        "fullName": "Sarah Nakato",
        "subjectsPassed": 6,
        "subjectsFailed": 0,
        "passRate": 100.0,
        "proposedOutcome": "Promoted",
        "nextSemesterNo": 4
      },
      {
        "studentNo": "ISB/2024/0044",
        "fullName": "James Okello",
        "subjectsPassed": 2,
        "subjectsFailed": 4,
        "passRate": 33.3,
        "proposedOutcome": "Repeat",
        "nextSemesterNo": 3
      }
    ],
    "summary": {
      "promoted": 40,
      "repeat": 5,
      "dropout": 2,
      "deferred": 0
    }
  },
  "message": null
}
```

### `POST /session-movement/execute`

Commits session movement for a batch. Registrar / Admin only. Locks the results for editing and updates student semester records. Triggers notifications to affected students.

**Request Body:**

```json
{
  "batchId": "BSC-IT-S3-D",
  "semesterNo": 3,
  "academicYear": "2025–2026",
  "overrides": [
    {
      "studentNo": "ISB/2024/0044",
      "outcome": "Deferment",
      "reason": "Medical certificate submitted and approved."
    }
  ]
}
```

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "executedAt": "2026-07-05T10:00:00+03:00",
    "promoted": 40,
    "repeated": 4,
    "deferred": 1,
    "dropout": 2,
    "totalProcessed": 47
  },
  "message": "Session Movement Complete. 40 students promoted. 2 marked Dropout."
}
```

---

## 16. Domain: Student Lookup & Profile

### `GET /students/search`

Search for students by Student Number, name, or email. Returns a lightweight preview list.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `q` | `string` | Student No., full name, or email address |
| `campus` | `string` | Campus code filter |
| `programme` | `string` | Programme code filter |
| `semesterNo` | `int` | Current semester filter |

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "studentNo": "ISB/2024/0028",
      "fullName": "Sarah Nakato",
      "programme": "BSc. Computer Science",
      "semester": "Semester 5",
      "campus": "Kampala Main",
      "studyMode": "Day",
      "status": "Active",
      "profilePhotoUrl": "https://storage.isbat.ac.ug/photos/ISB-2024-0028.jpg"
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 3, "totalPages": 1 }
}
```

### `GET /students/{studentNo}`

Returns a full student academic profile. Staff and admin see the complete record; students see their own record only.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "fullName": "Sarah Nakato",
    "email": "s.nakato@students.isbat.ac.ug",
    "phone": "+256 771 234 567",
    "programme": "BSc. Computer Science",
    "programmeCode": "BSCS",
    "campus": "Kampala Main",
    "studyMode": "Day",
    "admissionType": "Regular",
    "currentSemesterNo": 5,
    "academicYear": "2025–2026",
    "status": "Active",
    "feeClearanceStatus": "Cleared",
    "cgpa": 3.65,
    "creditsEarned": 96,
    "profilePhotoUrl": "https://storage.isbat.ac.ug/photos/ISB-2024-0028.jpg",
    "enrolledCourses": [
      { "courseCode": "IT301", "courseName": "Computer Networks", "credits": 3 }
    ]
  },
  "message": null
}
```

---

## 17. Domain: Finance Clearance (Read-Only Proxy)

> This endpoint is a **read-only proxy** to the Finance Service (Service 3). The Academic Module calls it internally to gate CW/CBT submission access and attendance tracking. It is exposed here for completeness; direct clients should call Service 3 directly.

### `GET /clearance/{studentNo}`

Returns the finance clearance status for a student for the current semester.

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": {
    "studentNo": "ISB/2024/0028",
    "semester": "Semester 5",
    "academicYear": "2025–2026",
    "clearancePercentage": 100,
    "status": "Cleared",
    "assessmentSubmissionAllowed": true,
    "attendanceAccessAllowed": true,
    "outstandingBalance": 0.00,
    "currency": "UGX",
    "checkedAt": "2026-05-20T08:00:00+03:00"
  },
  "message": null
}
```

| `clearancePercentage` | `status` | Submission Access |
|---|---|---|
| 100% | `Cleared` | ✅ Allowed |
| 50–99% | `Partial` | ✅ Allowed (view access only for Assessment) |
| < 50% | `Blocked` | ❌ Blocked |

---

## 18. Domain: Notifications

### `GET /notifications`

Returns in-app notifications for the authenticated user (student or staff).

**Query Parameters:** `isRead` (bool), `type` (`Info`, `Warning`, `Error`, `Success`)

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "notificationId": "notif-001",
      "type": "Warning",
      "title": "Low Attendance",
      "message": "Your attendance in IT305 is 70.8% — below the required 75%.",
      "relatedCourseCode": "IT305",
      "isRead": false,
      "createdAt": "2026-05-18T09:00:00+03:00"
    }
  ],
  "message": null,
  "meta": { "page": 1, "pageSize": 20, "totalCount": 3, "totalPages": 1 }
}
```

### `POST /notifications/send`

Sends a targeted notification to one or more students or staff. Registrar / Dean / Admin only.

**Request Body:**

```json
{
  "recipientStudentNos": ["ISB/2024/0028", "ISB/2024/0031"],
  "type": "Warning",
  "title": "Timetable Update",
  "message": "IT305 lecture on Mon 20 May has been rescheduled to Wed 22 May, 14:00–16:00.",
  "relatedCourseCode": "IT305"
}
```

### `PATCH /notifications/{notificationId}/read`

Marks a notification as read for the authenticated user.

---

## 19. Domain: Faculty Master

Manages academic faculties (Schools / Colleges). Used by the **Faculty Master** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/faculties` | Any staff | List all faculties |
| `GET` | `/faculties/{id}` | Any staff | Get single faculty |
| `POST` | `/faculties` | Dean, Registrar, Admin | Create faculty |
| `PUT` | `/faculties/{id}` | Dean, Registrar, Admin | Update faculty |
| `DELETE` | `/faculties/{id}` | Admin | Soft-delete faculty |

### `GET /faculties`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "fac-001",
      "code": "FCT",
      "name": "Faculty of Computing and Technology",
      "shortName": "FCT",
      "headOfFaculty": "Prof. John Ssemakula",
      "headStaffId": "STF-0042",
      "location": "Block A, Main Campus",
      "email": "fct@isbat.ac.ug",
      "phone": "+256-414-000100",
      "programmeCount": 6,
      "lecturerCount": 24,
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 5, "totalPages": 1 }
}
```

### `POST /faculties`

**Request Body:**

```json
{
  "code": "FBM",
  "name": "Faculty of Business and Management",
  "shortName": "FBM",
  "headStaffId": "STF-0015",
  "location": "Block B, Main Campus",
  "email": "fbm@isbat.ac.ug",
  "phone": "+256-414-000200"
}
```

**Response `201 Created`:** Returns created faculty object.

---

## 20. Domain: Lecturer Master

Manages lecturer/staff profiles and faculty assignments. Used by the **Lecturer Master** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/lecturers` | Any staff | List lecturers |
| `GET` | `/lecturers/{staffId}` | Any staff | Get single lecturer |
| `POST` | `/lecturers` | Registrar, Admin | Create lecturer profile |
| `PUT` | `/lecturers/{staffId}` | Registrar, Admin | Update lecturer |
| `PATCH` | `/lecturers/{staffId}/skills` | Registrar, Admin | Assign skills |
| `DELETE` | `/lecturers/{staffId}` | Admin | Soft-delete |

### `GET /lecturers`

**Query Parameters:** `?facultyId=fac-001&skillId=sk-005&search=john`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "staffId": "STF-0042",
      "title": "Prof.",
      "firstName": "John",
      "lastName": "Ssemakula",
      "email": "j.ssemakula@isbat.ac.ug",
      "phone": "+256-772-000001",
      "facultyId": "fac-001",
      "facultyName": "Faculty of Computing and Technology",
      "designation": "Senior Lecturer",
      "employmentType": "FullTime",
      "skills": ["Python", "Data Structures", "Algorithms"],
      "allocatedUnitsCount": 3,
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 24, "totalPages": 2 }
}
```

### `POST /lecturers`

**Request Body:**

```json
{
  "title": "Dr.",
  "firstName": "Alice",
  "lastName": "Namukasa",
  "email": "a.namukasa@isbat.ac.ug",
  "phone": "+256-772-000002",
  "facultyId": "fac-001",
  "designation": "Lecturer",
  "employmentType": "FullTime",
  "skillIds": ["sk-001", "sk-003"]
}
```

**Response `201 Created`:** Returns created lecturer profile.

### `PATCH /lecturers/{staffId}/skills`

```json
{ "skillIds": ["sk-001", "sk-003", "sk-007"] }
```

**Response `200 OK`:** Returns updated skills list.

---

## 21. Domain: Skill Management

Manages a catalog of teaching/subject skills assignable to lecturers and course units. Used by the **Skill Management** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/skills` | Any staff | List all skills |
| `GET` | `/skills/{id}` | Any staff | Get single skill |
| `POST` | `/skills` | Dean, Registrar, Admin | Create skill |
| `PUT` | `/skills/{id}` | Dean, Registrar, Admin | Update skill |
| `DELETE` | `/skills/{id}` | Admin | Soft-delete skill |

### `GET /skills`

**Query Parameters:** `?category=Programming&search=python`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "sk-001",
      "name": "Python Programming",
      "category": "Programming",
      "description": "Proficiency in Python including data science libraries",
      "lecturerCount": 8,
      "courseUnitCount": 3,
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
}
```

### `POST /skills`

**Request Body:**

```json
{
  "name": "Machine Learning",
  "category": "Artificial Intelligence",
  "description": "Supervised and unsupervised ML model development"
}
```

**Response `201 Created`:** Returns created skill.

---

## 22. Domain: Programme Level

Manages National Qualifications Framework (NQF) levels and academic levels. Used by the **Programme Level** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/programme-levels` | Any staff | List all levels |
| `GET` | `/programme-levels/{id}` | Any staff | Get single level |
| `POST` | `/programme-levels` | Registrar, Admin | Create level |
| `PUT` | `/programme-levels/{id}` | Registrar, Admin | Update level |
| `DELETE` | `/programme-levels/{id}` | Admin | Soft-delete |

### `GET /programme-levels`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "pl-001",
      "code": "NQF5",
      "name": "Diploma",
      "nqfLevel": 5,
      "durationYears": 2,
      "creditRequirement": 120,
      "programmeCount": 4,
      "isActive": true
    },
    {
      "id": "pl-002",
      "code": "NQF7",
      "name": "Bachelor's Degree",
      "nqfLevel": 7,
      "durationYears": 3,
      "creditRequirement": 360,
      "programmeCount": 12,
      "isActive": true
    }
  ]
}
```

### `POST /programme-levels`

```json
{
  "code": "NQF8",
  "name": "Postgraduate Diploma",
  "nqfLevel": 8,
  "durationYears": 1,
  "creditRequirement": 60
}
```

**Response `201 Created`:** Returns created level.

---

## 23. Domain: Programme Group

Manages grouping/categorisation of academic programmes. Used by the **Programme Group** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/programme-groups` | Any staff | List all groups |
| `GET` | `/programme-groups/{id}` | Any staff | Get single group |
| `POST` | `/programme-groups` | Registrar, Admin | Create group |
| `PUT` | `/programme-groups/{id}` | Registrar, Admin | Update group |
| `DELETE` | `/programme-groups/{id}` | Admin | Soft-delete |

### `GET /programme-groups`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "pg-001",
      "code": "ICT",
      "name": "Information and Communication Technology",
      "facultyId": "fac-001",
      "facultyName": "Faculty of Computing and Technology",
      "programmeCount": 6,
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 8, "totalPages": 1 }
}
```

### `POST /programme-groups`

```json
{
  "code": "BUS",
  "name": "Business Studies",
  "facultyId": "fac-002"
}
```

**Response `201 Created`:** Returns created group.

---

## 24. Domain: Programme Master

Manages the full catalogue of academic programmes offered. Used by the **Programme Master** admin page. Supports specialisations and elective sets.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/programmes` | Any staff | List all programmes |
| `GET` | `/programmes/{code}` | Any staff | Get programme detail |
| `POST` | `/programmes` | Registrar, Admin | Create programme |
| `PUT` | `/programmes/{code}` | Registrar, Admin | Update programme |
| `DELETE` | `/programmes/{code}` | Admin | Soft-delete |
| `GET` | `/programmes/{code}/specialisations` | Any staff | List specialisations |
| `POST` | `/programmes/{code}/specialisations` | Registrar, Admin | Add specialisation |
| `DELETE` | `/programmes/{code}/specialisations/{specId}` | Admin | Remove specialisation |
| `GET` | `/programmes/{code}/elective-sets` | Any staff | List elective sets |
| `POST` | `/programmes/{code}/elective-sets` | Registrar, Admin | Create elective set |

### `GET /programmes`

**Query Parameters:** `?groupId=pg-001&levelId=pl-002&studyMode=Day&search=computer`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "code": "BSCS",
      "name": "BSc. Computer Science",
      "levelId": "pl-002",
      "levelName": "Bachelor's Degree",
      "groupId": "pg-001",
      "groupName": "ICT",
      "facultyId": "fac-001",
      "facultyName": "Faculty of Computing and Technology",
      "studyModes": ["Day", "Evening"],
      "durationSemesters": 6,
      "totalCredits": 360,
      "hasSpecialisations": true,
      "specialisationCount": 3,
      "activeEnrolmentCount": 284,
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 18, "totalPages": 1 }
}
```

### `POST /programmes`

**Request Body:**

```json
{
  "code": "BSIT",
  "name": "BSc. Information Technology",
  "levelId": "pl-002",
  "groupId": "pg-001",
  "studyModes": ["Day", "Evening"],
  "durationSemesters": 6,
  "totalCredits": 360
}
```

### `POST /programmes/{code}/specialisations`

```json
{
  "name": "Cybersecurity",
  "code": "BSCS-SEC",
  "description": "Specialisation in network and information security"
}
```

---

## 25. Domain: Batch Management

Manages student cohort batches per programme and intake. Used by the **Batch Management** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/batches` | Any staff | List all batches |
| `GET` | `/batches/{id}` | Any staff | Get single batch |
| `POST` | `/batches` | Registrar, Admin | Create batch |
| `PUT` | `/batches/{id}` | Registrar, Admin | Update batch |
| `PATCH` | `/batches/{id}/status` | Registrar, Admin | Activate / deactivate |
| `DELETE` | `/batches/{id}` | Admin | Soft-delete |
| `GET` | `/batches/{id}/students` | Registrar, Admin | List students in batch |

### `GET /batches`

**Query Parameters:** `?intakeCode=20261&programmeCode=BSCS&studyMode=Day&status=Active`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "bat-001",
      "code": "BSCS-2026-A",
      "intakeCode": "20261",
      "intakeLabel": "Spring 2026",
      "programmeCode": "BSCS",
      "programmeName": "BSc. Computer Science",
      "studyMode": "Day",
      "campus": "Main Campus",
      "capacity": 60,
      "enrolledCount": 48,
      "semesterNo": 2,
      "status": "Active",
      "classRepStaffId": null
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 22, "totalPages": 2 }
}
```

### `POST /batches`

**Request Body:**

```json
{
  "code": "BSCS-2026-B",
  "intakeCode": "20261",
  "programmeCode": "BSCS",
  "studyMode": "Evening",
  "campus": "Main Campus",
  "capacity": 50,
  "semesterNo": 2
}
```

**Response `201 Created`:** Returns created batch.

---

## 26. Domain: Fee Structure

Manages tuition and fees payable per programme and semester. Used by the **Fee Structure** admin page. Admin-only write access.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/fee-structures` | Any staff | List all fee structures |
| `GET` | `/fee-structures/{id}` | Any staff | Get single structure |
| `POST` | `/fee-structures` | Admin | Create fee structure |
| `PUT` | `/fee-structures/{id}` | Admin | Update fee structure |
| `DELETE` | `/fee-structures/{id}` | Admin | Soft-delete |
| `GET` | `/fee-structures/{id}/items` | Any staff | List fee line items |
| `POST` | `/fee-structures/{id}/items` | Admin | Add fee line item |
| `DELETE` | `/fee-structures/{id}/items/{itemId}` | Admin | Remove line item |

### `GET /fee-structures`

**Query Parameters:** `?programmeCode=BSCS&academicYear=2025-2026&studyMode=Day`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "fs-001",
      "programmeCode": "BSCS",
      "programmeName": "BSc. Computer Science",
      "academicYear": "2025–2026",
      "semesterNo": 2,
      "studyMode": "Day",
      "currency": "UGX",
      "totalFees": 2850000,
      "items": [
        { "id": "fsi-001", "description": "Tuition Fee", "amount": 2400000, "isMandatory": true },
        { "id": "fsi-002", "description": "Registration Fee", "amount": 150000, "isMandatory": true },
        { "id": "fsi-003", "description": "Library Fee", "amount": 50000, "isMandatory": true },
        { "id": "fsi-004", "description": "Medical Fee", "amount": 100000, "isMandatory": true },
        { "id": "fsi-005", "description": "Activity Fee", "amount": 150000, "isMandatory": false }
      ],
      "isActive": true
    }
  ]
}
```

### `POST /fee-structures`

```json
{
  "programmeCode": "BSIT",
  "academicYear": "2025–2026",
  "semesterNo": 2,
  "studyMode": "Day",
  "currency": "UGX"
}
```

**Response `201 Created`:** Returns created fee structure (no items yet — add via `/items`).

### `POST /fee-structures/{id}/items`

```json
{
  "description": "Examination Fee",
  "amount": 100000,
  "isMandatory": true
}
```

---

## 27. Domain: ODL Applications

Manages Open/Distance Learning (ODL) applications for new student enrolment online. Used by the **ODL Applications** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/odl/applications` | Registrar, Admin | List all ODL applications |
| `GET` | `/odl/applications/{id}` | Registrar, Admin | Get full application detail |
| `PATCH` | `/odl/applications/{id}/status` | Registrar, Admin | Approve / reject / defer |
| `POST` | `/odl/applications/{id}/notes` | Registrar, Admin | Add processing note |
| `GET` | `/odl/applications/{id}/documents` | Registrar, Admin | List uploaded documents |

### `GET /odl/applications`

**Query Parameters:** `?intakeCode=20261&status=Pending&programmeCode=BSCS&search=james`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "odl-app-001",
      "referenceNo": "20261-ODL-0112",
      "intakeCode": "20261",
      "applicantName": "James Opio",
      "email": "james.opio@gmail.com",
      "phone": "+256-772-001122",
      "programmeCode": "BSCS",
      "programmeName": "BSc. Computer Science",
      "studyMode": "Distance",
      "status": "Pending",
      "paymentStatus": "Paid",
      "paymentReference": "MTN-20261-0112",
      "submittedAt": "2026-05-20T10:30:00+03:00",
      "documentsUploaded": 4,
      "documentsRequired": 5
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 7, "totalPages": 1 }
}
```

### `GET /odl/applications/{id}`

Returns the full application with personal details, qualifications, emergency contact, and document list.

**Response `200 OK` (abbreviated):**

```json
{
  "isSuccess": true,
  "data": {
    "id": "odl-app-001",
    "referenceNo": "20261-ODL-0112",
    "personal": {
      "firstName": "James", "lastName": "Opio",
      "gender": "Male", "dateOfBirth": "2000-04-12",
      "nationality": "Ugandan", "idType": "NIN",
      "idNumber": "CM12345678UGUG"
    },
    "contact": {
      "email": "james.opio@gmail.com", "phone": "+256-772-001122",
      "address": "Gulu City, Uganda"
    },
    "qualifications": [
      { "level": "UCE", "year": 2016, "school": "St. Mary's College Gulu", "aggregate": "U1", "grade": "Division 1" }
    ],
    "emergencyContact": {
      "name": "Mary Opio", "relationship": "Mother", "phone": "+256-782-001122"
    },
    "programme": { "code": "BSCS", "name": "BSc. Computer Science", "studyMode": "Distance" },
    "documents": [
      { "id": "doc-001", "type": "UCE_CERT", "fileName": "uce_cert.pdf", "uploadedAt": "2026-05-20T10:20:00+03:00", "status": "Verified" }
    ],
    "status": "Pending",
    "paymentStatus": "Paid",
    "processingNotes": []
  }
}
```

### `PATCH /odl/applications/{id}/status`

```json
{
  "status": "Approved",
  "note": "All documents verified. Enrolment confirmed for Spring 2026."
}
```

> **`status` enum:** `"Pending"` | `"UnderReview"` | `"Approved"` | `"Rejected"` | `"Deferred"` | `"Enrolled"`

---

## 28. Domain: ODL Payment Reconciliation

Matches incoming ODL application payments (mobile money / bank transfer) to pending applications. Used by the **Payment Reconciliation** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/odl/reconciliation` | Registrar, Admin | List reconciliation items |
| `GET` | `/odl/reconciliation/{id}` | Registrar, Admin | Get single item |
| `PATCH` | `/odl/reconciliation/{id}/match` | Registrar, Admin | Match payment to application |
| `PATCH` | `/odl/reconciliation/{id}/flag` | Registrar, Admin | Flag as suspicious/duplicate |
| `GET` | `/odl/reconciliation/summary` | Registrar, Admin | Reconciliation summary stats |

### `GET /odl/reconciliation`

**Query Parameters:** `?intakeCode=20261&status=Unmatched&paymentMethod=MobileMoney`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "recon-001",
      "paymentReference": "MTN-20261-0089",
      "payerName": "Alice Nakato",
      "payerPhone": "+256-772-008899",
      "amount": 250000,
      "currency": "UGX",
      "paymentMethod": "MobileMoney",
      "paidAt": "2026-05-18T09:15:00+03:00",
      "status": "Unmatched",
      "matchedApplicationId": null,
      "flagged": false
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 4, "totalPages": 1 }
}
```

### `PATCH /odl/reconciliation/{id}/match`

Links a payment record to an ODL application.

```json
{
  "applicationId": "odl-app-005",
  "note": "Confirmed MTN reference matches applicant phone."
}
```

**Response `200 OK`:** Returns updated reconciliation record with `status: "Matched"`.

### `GET /odl/reconciliation/summary`

```json
{
  "isSuccess": true,
  "data": {
    "intakeCode": "20261",
    "totalPayments": 18,
    "matched": 14,
    "unmatched": 3,
    "flagged": 1,
    "totalAmountReceived": 4500000,
    "currency": "UGX"
  }
}
```

---

## 29. Domain: Qualification Equating

Manages prior learning recognition and transfer credit assessment. Used by the **Qualification Equating** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/qual-equating` | Registrar, Admin | List all equating requests |
| `GET` | `/qual-equating/{id}` | Registrar, Admin | Get single request |
| `POST` | `/qual-equating` | Registrar, Admin | Create equating request |
| `PATCH` | `/qual-equating/{id}/decision` | Registrar, Admin | Approve / reject course equivalence |
| `DELETE` | `/qual-equating/{id}` | Admin | Delete request |

### `GET /qual-equating`

**Query Parameters:** `?studentNo=ISB/2024/0028&status=Pending`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "qe-001",
      "studentNo": "ISB/2024/0028",
      "studentName": "Sarah Nakato",
      "programmeCode": "BSCS",
      "priorInstitution": "Makerere University",
      "priorCourseCode": "CSC1100",
      "priorCourseName": "Introduction to Computing",
      "priorCredits": 3,
      "equivalentCourseCode": "IT101",
      "equivalentCourseName": "Introduction to Programming",
      "status": "Pending",
      "submittedAt": "2026-05-10T09:00:00+03:00",
      "reviewedBy": null,
      "decision": null,
      "decisionNote": null
    }
  ]
}
```

### `PATCH /qual-equating/{id}/decision`

```json
{
  "decision": "Approved",
  "creditsAwarded": 3,
  "note": "Syllabus content aligns at 85%. Approved for full credit transfer."
}
```

> **`decision` enum:** `"Approved"` | `"PartialCredit"` | `"Rejected"`

---

## 30. Domain: Grievance Management

Tracks formal student grievance submissions and resolution workflow. Used by the **Grievance** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/grievances` | Dean, Registrar, Admin | List all grievances |
| `GET` | `/grievances/{id}` | Dean, Registrar, Admin | Get grievance detail |
| `POST` | `/grievances` | Student (self-service) | Submit grievance |
| `PATCH` | `/grievances/{id}/status` | Dean, Registrar, Admin | Update status |
| `POST` | `/grievances/{id}/responses` | Dean, Registrar, Admin | Add resolution response |

### `GET /grievances`

**Query Parameters:** `?status=Open&category=Results&intakeCode=20261&search=nakato`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "grv-001",
      "ticketNo": "GRV-2026-0042",
      "studentNo": "ISB/2024/0028",
      "studentName": "Sarah Nakato",
      "programmeCode": "BSCS",
      "category": "Results",
      "subCategory": "Mark Correction",
      "subject": "Incorrect CW mark for IT305",
      "status": "Open",
      "priority": "Medium",
      "submittedAt": "2026-05-15T11:00:00+03:00",
      "lastUpdatedAt": "2026-05-15T11:00:00+03:00",
      "assignedTo": null,
      "resolutionDeadline": "2026-05-22T00:00:00+03:00"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 11, "totalPages": 1 }
}
```

### `PATCH /grievances/{id}/status`

```json
{
  "status": "InProgress",
  "assignedTo": "STF-0042",
  "note": "Forwarded to IT305 lecturer for mark verification."
}
```

> **`status` enum:** `"Open"` | `"InProgress"` | `"Resolved"` | `"Closed"` | `"Escalated"`

### `POST /grievances/{id}/responses`

```json
{
  "responseText": "After review, the coursework mark has been corrected from 18/25 to 21/25.",
  "attachmentUrl": null,
  "isPublicToStudent": true
}
```

---

## 31. Domain: Access Gate

Controls student system access based on clearance, suspension, or administrative flags. Used by the **Access Gate** admin page.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/access-gate` | Dean, Registrar, Admin | List access gate entries |
| `GET` | `/access-gate/{studentNo}` | Dean, Registrar, Admin | Get student access status |
| `PATCH` | `/access-gate/{studentNo}/restrict` | Dean, Registrar, Admin | Restrict access |
| `PATCH` | `/access-gate/{studentNo}/restore` | Dean, Registrar, Admin | Restore full access |
| `GET` | `/access-gate/log` | Admin | Audit log of all access changes |

### `GET /access-gate`

**Query Parameters:** `?status=Restricted&reason=Finance&programmeCode=BSCS`

**Response `200 OK`:**

```json
{
  "isSuccess": true,
  "data": [
    {
      "studentNo": "ISB/2024/0028",
      "studentName": "Sarah Nakato",
      "programmeCode": "BSCS",
      "accessStatus": "Restricted",
      "restrictionReason": "Finance",
      "restrictionNote": "Unpaid fees for Semester 2.",
      "restrictedAt": "2026-05-01T00:00:00+03:00",
      "restrictedBy": "STF-0001",
      "canViewResults": false,
      "canSubmitAssessments": false,
      "canAccessTimetable": true,
      "clearedBy": null,
      "clearedAt": null
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 17, "totalPages": 1 }
}
```

### `PATCH /access-gate/{studentNo}/restrict`

```json
{
  "reason": "Disciplinary",
  "note": "Suspended pending disciplinary hearing — Student Affairs ref DA-2026-0011.",
  "restrictionLevel": "Full",
  "reviewDate": "2026-06-01"
}
```

> **`reason` enum:** `"Finance"` | `"Disciplinary"` | `"Medical"` | `"Administrative"` | `"Other"`
>
> **`restrictionLevel` enum:** `"Full"` | `"ResultsOnly"` | `"AssessmentsOnly"`

### `PATCH /access-gate/{studentNo}/restore`

```json
{
  "note": "Fees cleared. Full access restored.",
  "clearedBy": "STF-0001"
}
```

**Response `200 OK`:** Returns updated access gate entry with `accessStatus: "Active"`.

---

## 32. C# DTO Definitions

> All DTOs use `record` for immutability. Response DTOs are annotated with `System.Text.Json` serialization attributes. Request DTOs carry `System.ComponentModel.DataAnnotations` for model validation.

### Namespace

```csharp
namespace Isbat.Academic.Application.DTOs;
```

---

### Response Envelope

```csharp
/// <summary>Standard API response wrapper used across all Academic Service endpoints.</summary>
public record ApiResponse<T>
{
    public bool IsSuccess { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IEnumerable<FieldError>? Errors { get; init; }
    public PaginationMeta? Meta { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { IsSuccess = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, IEnumerable<FieldError>? errors = null) =>
        new() { IsSuccess = false, Message = message, Errors = errors };
}

public record FieldError(string Field, string Message);

public record PaginationMeta(int Page, int PageSize, int TotalCount, int TotalPages);
```

---

### Dashboard

```csharp
public record DashboardSummaryDto
{
    public required string StudentNo { get; init; }
    public required string FullName { get; init; }
    public required string Programme { get; init; }
    public required string Campus { get; init; }
    public required string Semester { get; init; }
    public required string AcademicYear { get; init; }
    public required string StudyMode { get; init; }
    public decimal Gpa { get; init; }
    public decimal Cgpa { get; init; }
    public int CreditsEarned { get; init; }
    public int CreditLoad { get; init; }
    public decimal AttendanceRate { get; init; }
    public required string FeeClearanceStatus { get; init; }
    public required string RegistrationStatus { get; init; }
    public IEnumerable<NotificationPreviewDto> Notifications { get; init; } = [];
}

public record NotificationPreviewDto
{
    public required string Id { get; init; }
    public required string Type { get; init; }
    public required string Message { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public bool IsRead { get; init; }
}
```

---

### Course Units (Curriculum)

```csharp
public record CourseUnitDto
{
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public int Credits { get; init; }
    public int SemesterNo { get; init; }
    public required string ProgrammeCode { get; init; }
    public required string UnitType { get; init; }
    public AssessmentWeightageDto AssessmentWeightage { get; init; } = new();
    public int PassMarkPercent { get; init; }
    public bool HasOutline { get; init; }
    public int OutlineChapterCount { get; init; }
    public bool IsActive { get; init; }
}

public record AssessmentWeightageDto
{
    public MarkComponentDto? Coursework { get; init; }
    public MarkComponentDto? Cbt { get; init; }
    public MarkComponentDto? UniversityExam { get; init; }
    public MarkComponentDto? Practical { get; init; }
}

public record MarkComponentDto(decimal RawMark, decimal ScaledMark);

public record CreateCourseUnitRequest
{
    [Required, StringLength(10, MinimumLength = 3)]
    public required string CourseCode { get; init; }

    [Required, StringLength(120, MinimumLength = 3)]
    public required string CourseName { get; init; }

    [Range(1, 6)]
    public int Credits { get; init; }

    [Range(1, 8)]
    public int SemesterNo { get; init; }

    [Required, StringLength(20)]
    public required string ProgrammeCode { get; init; }

    [Required, RegularExpression("^(theory|practical|cbt|project)$",
        ErrorMessage = "UnitType must be one of: theory, practical, cbt, project")]
    public required string UnitType { get; init; }

    [Required]
    public AssessmentWeightageDto AssessmentWeightage { get; init; } = new();

    [Range(0, 100)]
    public int PassMarkPercent { get; init; } = 50;
}

public record UpdateCourseOutlineRequest
{
    [Required, MinLength(1)]
    public required IEnumerable<OutlineChapterDto> Chapters { get; init; }
}

public record OutlineChapterDto
{
    [Range(1, 50)]
    public int ChapterNo { get; init; }

    [Required, StringLength(200, MinimumLength = 3)]
    public required string Title { get; init; }

    [Required, MinLength(1)]
    public required IEnumerable<string> Topics { get; init; }
}
```

---

### Timetable

```csharp
public record TimetableDto
{
    public required string BatchId { get; init; }
    public required string BatchLabel { get; init; }
    public bool IsPublished { get; init; }
    public DateTimeOffset? PublishedAt { get; init; }
    public IEnumerable<TimetableSlotDto> Slots { get; init; } = [];
    public IEnumerable<TimetableConflictDto> Conflicts { get; init; } = [];
}

public record TimetableSlotDto
{
    public required string SlotId { get; init; }
    public required string Day { get; init; }
    public required string StartTime { get; init; }
    public required string EndTime { get; init; }
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public required string Type { get; init; }
    public required string Venue { get; init; }
    public required string LecturerStaffId { get; init; }
    public required string LecturerName { get; init; }
    public string? ColorToken { get; init; }
    public bool HasConflict { get; init; }
}

public record TimetableConflictDto(
    string SlotId,
    string ConflictingSlotId,
    string ConflictType,  // "venue" | "lecturer"
    string Description
);

public record CreateTimetableSlotRequest
{
    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Required, RegularExpression("^(Mon|Tue|Wed|Thu|Fri|Sat)$")]
    public required string Day { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$",
        ErrorMessage = "StartTime must be in HH:mm format")]
    public required string StartTime { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$",
        ErrorMessage = "EndTime must be in HH:mm format")]
    public required string EndTime { get; init; }

    [Required, StringLength(10)]
    public required string CourseCode { get; init; }

    [Required, RegularExpression("^(Lecture|Lab|Tutorial|Seminar)$")]
    public required string Type { get; init; }

    [Required, StringLength(30)]
    public required string Venue { get; init; }

    [Required, StringLength(30)]
    public required string LecturerStaffId { get; init; }
}
```

---

### Attendance

```csharp
public record StudentAttendanceSummaryDto
{
    public required string StudentNo { get; init; }
    public required string Semester { get; init; }
    public required string AcademicYear { get; init; }
    public decimal OverallPercentage { get; init; }
    public IEnumerable<AttendanceRecordDto> Records { get; init; } = [];
}

public record AttendanceRecordDto
{
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public int TotalClasses { get; init; }
    public int Attended { get; init; }
    public int Absent { get; init; }
    public decimal Percentage { get; init; }
    public bool IsBelow75 { get; init; }
    public DateTimeOffset? LastUpdated { get; init; }
}

public record MarkAttendanceRequest
{
    [Required, StringLength(10)]
    public required string CourseCode { get; init; }

    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Required]
    public DateOnly SessionDate { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public required string StartTime { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public required string EndTime { get; init; }

    [Required, RegularExpression("^(manual|biometric)$")]
    public required string Source { get; init; }

    [Required, MinLength(1)]
    public required IEnumerable<AttendanceEntryRequest> Entries { get; init; }
}

public record AttendanceEntryRequest
{
    [Required, StringLength(25)]
    public required string StudentNo { get; init; }

    [Required, RegularExpression("^(Present|Absent|Excused)$")]
    public required string Status { get; init; }
}
```

---

### Coursework & CBT Marks

```csharp
public record CourseworkDto
{
    public required string CwId { get; init; }
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public required string BatchId { get; init; }
    public required string Title { get; init; }
    public decimal RawMarkOutOf { get; init; }
    public decimal ScaledMarkOutOf { get; init; }
    public DateTimeOffset DueDate { get; init; }
    public required string Status { get; init; }
    public int SubmissionCount { get; init; }
    public int MarkedCount { get; init; }
    public bool IsPublished { get; init; }
}

public record CreateCourseworkRequest
{
    [Required, StringLength(10)]
    public required string CourseCode { get; init; }

    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Required, StringLength(200, MinimumLength = 5)]
    public required string Title { get; init; }

    [Range(1, 100)]
    public decimal RawMarkOutOf { get; init; }

    [Required]
    public DateTimeOffset DueDate { get; init; }

    [StringLength(2000)]
    public string? Instructions { get; init; }
}

public record UpdateMarksRequest
{
    [Required, MinLength(1)]
    public required IEnumerable<StudentMarkEntry> Entries { get; init; }
}

public record StudentMarkEntry
{
    [Required, StringLength(25)]
    public required string StudentNo { get; init; }

    [Range(0, 100)]
    public decimal RawMark { get; init; }

    [StringLength(500)]
    public string? Feedback { get; init; }
}

public record CbtDto
{
    public required string CbtId { get; init; }
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public required string BatchId { get; init; }
    public required string Title { get; init; }
    public required string Venue { get; init; }
    public DateOnly ScheduledDate { get; init; }
    public required string StartTime { get; init; }
    public required string EndTime { get; init; }
    public int DurationMinutes { get; init; }
    public decimal RawMarkOutOf { get; init; }
    public decimal ScaledMarkOutOf { get; init; }
    public required string Status { get; init; }
    public bool QuestionPaperAvailable { get; init; }
    public bool IsPublished { get; init; }
}

public record CreateCbtRequest
{
    [Required, StringLength(10)]
    public required string CourseCode { get; init; }

    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Required, StringLength(200, MinimumLength = 5)]
    public required string Title { get; init; }

    [Required, StringLength(30)]
    public required string Venue { get; init; }

    [Required]
    public DateOnly ScheduledDate { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public required string StartTime { get; init; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public required string EndTime { get; init; }

    [Range(1, 100)]
    public decimal RawMarkOutOf { get; init; }
}
```

---

### Results & Grades

```csharp
public record StudentResultsDto
{
    public required string StudentNo { get; init; }
    public required string FullName { get; init; }
    public required string Programme { get; init; }
    public required string Semester { get; init; }
    public required string AcademicYear { get; init; }
    public decimal Gpa { get; init; }
    public int CreditsAttempted { get; init; }
    public int CreditsEarned { get; init; }
    public IEnumerable<GradeRecordDto> Grades { get; init; } = [];
}

public record GradeRecordDto
{
    public required string CourseCode { get; init; }
    public required string CourseName { get; init; }
    public int Credits { get; init; }
    public decimal? CwMark { get; init; }
    public decimal? CbtMark { get; init; }
    public decimal? ExamMark { get; init; }
    public decimal? PracticalMark { get; init; }
    public decimal TotalMark { get; init; }
    public required string Grade { get; init; }
    public decimal GradePoints { get; init; }

    /// <summary>"Pass" | "Fail" | "Pending"</summary>
    public required string Status { get; init; }
    public required string Semester { get; init; }
    public bool IsPublished { get; init; }
}

public record PublishResultsRequest
{
    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Range(1, 8)]
    public int SemesterNo { get; init; }

    [Required, StringLength(20)]
    public required string AcademicYear { get; init; }
}

public record AcademicTranscriptDto
{
    public required string StudentNo { get; init; }
    public required string FullName { get; init; }
    public required string Programme { get; init; }
    public required string Campus { get; init; }
    public required string StudyMode { get; init; }
    public decimal Cgpa { get; init; }
    public int TotalCreditsEarned { get; init; }
    public IEnumerable<SemesterResultDto> Semesters { get; init; } = [];
}

public record SemesterResultDto
{
    public int SemesterNo { get; init; }
    public required string AcademicYear { get; init; }
    public decimal Gpa { get; init; }
    public int CreditsAttempted { get; init; }
    public int CreditsEarned { get; init; }
    public IEnumerable<GradeRecordDto> Grades { get; init; } = [];
}
```

---

### Session Movement

```csharp
public record SessionMovementPreviewDto
{
    public required string BatchId { get; init; }
    public required string AcademicYear { get; init; }
    public int SemesterNo { get; init; }
    public int TotalStudents { get; init; }
    public IEnumerable<StudentOutcomeDto> Outcomes { get; init; } = [];
    public SessionMovementSummaryDto Summary { get; init; } = new();
}

public record StudentOutcomeDto
{
    public required string StudentNo { get; init; }
    public required string FullName { get; init; }
    public int SubjectsPassed { get; init; }
    public int SubjectsFailed { get; init; }
    public decimal PassRate { get; init; }

    /// <summary>"Promoted" | "Repeat" | "Dropout" | "Deferment"</summary>
    public required string ProposedOutcome { get; init; }
    public int? NextSemesterNo { get; init; }
}

public record SessionMovementSummaryDto
{
    public int Promoted { get; init; }
    public int Repeat { get; init; }
    public int Dropout { get; init; }
    public int Deferred { get; init; }
}

public record ExecuteSessionMovementRequest
{
    [Required, StringLength(30)]
    public required string BatchId { get; init; }

    [Range(1, 8)]
    public int SemesterNo { get; init; }

    [Required, StringLength(20)]
    public required string AcademicYear { get; init; }

    /// <summary>Optional overrides for individual students (e.g. approved Deferment).</summary>
    public IEnumerable<SessionMovementOverrideRequest> Overrides { get; init; } = [];
}

public record SessionMovementOverrideRequest
{
    [Required, StringLength(25)]
    public required string StudentNo { get; init; }

    [Required, RegularExpression("^(Promoted|Repeat|Dropout|Deferment)$")]
    public required string Outcome { get; init; }

    [StringLength(500)]
    public string? Reason { get; init; }
}
```

---

### Notifications

```csharp
public record NotificationDto
{
    public required string NotificationId { get; init; }

    /// <summary>"Info" | "Warning" | "Error" | "Success"</summary>
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Message { get; init; }
    public string? RelatedCourseCode { get; init; }
    public bool IsRead { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}

public record SendNotificationRequest
{
    [Required, MinLength(1)]
    public required IEnumerable<string> RecipientStudentNos { get; init; }

    [Required, RegularExpression("^(Info|Warning|Error|Success)$")]
    public required string Type { get; init; }

    [Required, StringLength(100, MinimumLength = 3)]
    public required string Title { get; init; }

    [Required, StringLength(1000, MinimumLength = 5)]
    public required string Message { get; init; }

    [StringLength(10)]
    public string? RelatedCourseCode { get; init; }
}
```

---

### Finance Clearance (Proxy Response)

```csharp
public record ClearanceStatusDto
{
    public required string StudentNo { get; init; }
    public required string Semester { get; init; }
    public required string AcademicYear { get; init; }
    public decimal ClearancePercentage { get; init; }

    /// <summary>"Cleared" | "Partial" | "Blocked"</summary>
    public required string Status { get; init; }
    public bool AssessmentSubmissionAllowed { get; init; }
    public bool AttendanceAccessAllowed { get; init; }
    public decimal OutstandingBalance { get; init; }
    public required string Currency { get; init; }
    public DateTimeOffset CheckedAt { get; init; }
}
```

---

*End of Academic Service API Specification*

*Document version: 2.0 · Updated: 2026-05-25 · Maintained by: ISBAT University ERP Backend Team*

> **v2.0 changes:** Added 13 new domain sections (Sections 19–31) covering Faculty Master, Lecturer Master, Skill Management, Programme Level, Programme Group, Programme Master, Batch Management, Fee Structure, ODL Applications, ODL Payment Reconciliation, Qualification Equating, Grievance Management, and Access Gate. Updated Section 5 with admin dashboard endpoint. Updated Section 6 with Intake Master CRUD. Updated Section 7 with `unitCategory` field and enum notes. Updated Section 2 role permission matrix. Section 19 (C# DTOs) renumbered to Section 32.
