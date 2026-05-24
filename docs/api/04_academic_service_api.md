# ISBAT University ERP — Academic Service API
### REST API Specification · Backend: .NET Core 8 · Version: v1

---

## Table of Contents

1. [Base Architecture](#1-base-architecture)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Standard Response Envelope](#3-standard-response-envelope)
4. [Error Codes](#4-error-codes)
5. [Domain: Dashboard](#5-domain-dashboard)
6. [Domain: Academic Calendar & Sessions](#6-domain-academic-calendar--sessions)
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
19. [C# DTO Definitions](#19-c-dto-definitions)

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
| Dashboard (own data) | ✅ | ✅ | ✅ | ✅ | ✅ |
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

---

## 6. Domain: Academic Calendar & Sessions

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
  "assessmentWeightage": {
    "coursework":     { "rawMark": 25, "scaledMark": 15 },
    "cbt":            { "rawMark": 50, "scaledMark": 15 },
    "universityExam": { "rawMark": 100, "scaledMark": 70 },
    "practical":      null
  },
  "passMarkPercent": 50
}
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

## 19. C# DTO Definitions

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

*Document version: 1.0 · Generated: 2026-05-24 · Maintained by: ISBAT University ERP Backend Team*
