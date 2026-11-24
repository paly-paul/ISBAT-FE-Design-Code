# Attendance Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Attendance module, the endpoint that fills it, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET`. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Record Attendance and Pending Outlines
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Term | Static | – |
| Lecturer ↳ intake and term | `/api/v1/academic/timetables/lecturers?…` | No |
| Timetable ↳ lecturer | `/api/v1/academic/timetables/by-lecturer?…` | No |
| Skip Reason (Record Attendance) | Static | – |

### Sessions
| Dropdown | API | Dropdown API? |
|---|---|---|
| Batch | `/api/v1/academic/batches/dropdown` | Yes |
| Course Unit | `/api/v1/academic/courseunits` (full list, first 1,000) | **No** |
| Rows per page | Static | – |

### Reports → Attendance by Date
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Term | Static | – |
| Lecturer ↳ intake and term | `/api/v1/academic/timetables/lecturers?…` | No |
| Timetable ↳ lecturer | `/api/v1/academic/timetables/by-lecturer?…` | No |
| Rows per page | Static | – |

### Reports → Faculty %
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Term | Static | – |
| Lecturer ↳ intake and term | `/api/v1/academic/timetables/lecturers?…` | No |
| Rows per page | Static | – |

### Reports → Student %
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Term | Static | – |
| Lecturer ↳ intake and term | `/api/v1/academic/timetables/lecturers?…` | No |
| Course Unit ↳ lecturer | `/api/v1/academic/timetables/course-units?…` | No |
| Rows per page | Static | – |

### GUID-based calls
None of these fills a dropdown. If one returns 403, a name or prefilled value may be missing.

| API | Used in |
|---|---|
| `/api/v1/academic/timetables/{guid}` | Record Attendance, when opened for a specific timetable; Sessions → timetable details |
| `/api/v1/students/{guid}` | Student % report → student details |

---

## 2. Which endpoints may return 403

> **Source:** one live test, on **Application Filing** with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. The Attendance pages themselves have not been tested. **The docs are not reliable for list and by-GUID endpoints:** some documented as needing no specific permission returned 403 in that test.

### Refused in the live test
None of the endpoints used here was part of that test's refusals.

### At risk (not tested)
The docs say these need no specific permission. All of them belong to another module, so the user to test is one with Attendance access only.

| Endpoint | Used in | Dropdown endpoint available |
|---|---|---|
| `/api/v1/academic/courseunits` | Sessions → Course Unit | `/api/v1/academic/courseunits/dropdown` |
| `/api/v1/academic/timetables/lecturers` | Lecturer on every page except Sessions | None documented |
| `/api/v1/academic/timetables/by-lecturer` | Record Attendance, Pending Outlines, Attendance by Date → Timetable | None documented |
| `/api/v1/academic/timetables/course-units` | Student % → Course Unit | None documented |
| `/api/v1/academic/timetables/{guid}` | Record Attendance, Sessions | – |
| `/api/v1/students/{guid}` | Student % report | – |

### Lower risk
`/api/v1/academic/intakes/dropdown` and `/api/v1/academic/batches/dropdown`. Every `/dropdown` call in the live test worked, though only a few were exercised.

### Suggested follow-ups
1. **Frontend:** load Sessions → Course Unit from `/api/v1/academic/courseunits/dropdown`. It returns the GUID, code and name the dropdown shows.
2. **Backend:** confirm that a user with Attendance access only can read the three `timetables` endpoints that fill dropdowns, or provide dropdown versions.

### How to verify
Sign in as a user with Attendance access but no Timetable or Course Unit access, filter the Network tab by status `403`, and:
1. **Sessions:** open Course Unit.
2. **Record Attendance:** choose an intake and term, then open Lecturer and Timetable.
3. **Student % report:** choose a lecturer, then open Course Unit and run the report.
