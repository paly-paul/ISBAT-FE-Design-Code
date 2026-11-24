# Analytics Module: Dropdown APIs and 403 Risk

Analytics is a menu of report pages that belong to other modules. This lists every dropdown on those pages, the endpoint that fills it, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET`. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Student → Students in Programme Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` | Yes |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` | Yes |
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Student status | Static | – |

### Finance → Payment History
| Dropdown | API | Dropdown API? |
|---|---|---|
| Fee type | Static | – |

The Edit Payment popup on this page is covered in `finance-dropdown-apis.md`.

### Finance → Discount Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Discount | `/api/v1/finance/discounts/dropdown` | Yes |
| Programme | `/api/v1/academic/program-master/dropdown` | Yes |

### Finance → Transaction Report and Outstanding Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Campus | `/api/v1/academic/campus/dropdown` | Yes |
| Programme ↳ campus | `/api/v1/academic/program-master/by-campus/{campusGuid}` | **No** |
| Semesters ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` | Yes |
| Batches ↳ semesters | `/api/v1/academic/batches/dropdown?…` | Yes |
| Sponsor | `/api/v1/students/sponsor-categories?page=1&pageSize=100` | **No** |
| Status (Outstanding) | Static | – |
| Student (Transaction) | `/api/v1/admissions/application-filling/vetted-registered-search?…` | **No** (search) |
| Payment types (Transaction) | `/api/v1/finance/enums/payment-types` | Enum list |
| Receipt books (Transaction) | `/api/v1/finance/receipt-books/dropdown` | Yes |
| Ledgers, fee ledgers (Transaction) | `/api/v1/finance/ledgers?…` | **No** |
| Ledgers, other ledgers (Transaction) | `/api/v1/finance/ledger-others/dropdown` | Yes |

### Admission → Enquiry Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intakes | `/api/v1/academic/intakes/dropdown` | Yes |
| Enquiry statuses | `/api/v1/admissions/enquiry-statuses/dropdown` | Yes |
| Follow-up statuses | `/api/v1/admissions/follow-up-statuses/dropdown` | Yes |
| Staff | `/api/v1/users/employees/dropdown` | Yes |

### Admission → Application Status Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intakes | `/api/v1/academic/intakes/dropdown` | Yes |
| Campuses | `/api/v1/academic/campus/dropdown` | Yes |
| Programmes | `/api/v1/academic/program-master/dropdown` | Yes |
| Stages | Static | – |

### Attendance → Attendance by Date, Student % and Faculty %
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Term, rows per page | Static | – |
| Lecturer ↳ intake and term | `/api/v1/academic/timetables/lecturers?…` | **No** |
| Timetable ↳ lecturer (by Date) | `/api/v1/academic/timetables/by-lecturer?…` | **No** |
| Course Unit ↳ lecturer (Student %) | `/api/v1/academic/timetables/course-units?…` | **No** |

### Assessment → Exam Schedule Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Programme | `/api/v1/academic/program-master/dropdown` | Yes |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` (one call per programme) | Yes |
| Course unit, no programme chosen | `/api/v1/academic/courseunits/dropdown?search=` | Yes |
| Course unit, programme chosen | `/api/v1/academic/program-course-units/{programGuid}/dropdown` (one call per programme) | Yes |
| Schedule type, Status, Mode, Theory / Practical, Scheduling | Static | – |

### Assessment → IA Evaluation Report
| Dropdown | API | Dropdown API? |
|---|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Campus | `/api/v1/academic/campus/dropdown` | Yes |
| Programme ↳ campus | `/api/v1/academic/program-master/by-campus/{campusGuid}` (one call per campus) | **No** |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` (one call per programme) | Yes |
| Batch ↳ semester | `/api/v1/academic/batches/dropdown?…` | Yes |
| Sponsor | `/api/v1/students/sponsor-categories?page=1&pageSize=100` | **No** |
| Unit | `/api/v1/academic/courseunits/dropdown?search=` | Yes |
| Assessment, Status | Static | – |

### Employee → Activity Log
| Dropdown | API | Dropdown API? |
|---|---|---|
| Employee (User) | `/api/v1/users/employees/dropdown` | Yes |
| Module Entity | `/api/v1/users/admin/audit/sources` | **No** |

### GUID-based calls
- `/api/v1/academic/program-master/by-campus/{campusGuid}`: loads Programme options, as listed above.
- `/api/v1/academic/program-course-units/{programGuid}/dropdown`: loads Course unit options, as listed above.
- `/api/v1/students/{guid}`: Student % report → student details (not a dropdown).

---

## 2. Which endpoints may return 403

> **Source:** one live test, on **Application Filing** with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. The Analytics pages themselves have not been tested. **The docs are not reliable for list and by-GUID endpoints:** some documented as needing no specific permission returned 403 in that test.

None of the endpoints refused in that test fills an Analytics dropdown.

### Documented as requiring a permission (not tested)
| Endpoint | Used in | Permission |
|---|---|---|
| `/api/v1/users/admin/audit/sources` | Activity Log → Module Entity | The audit `get` permission |

The Activity Log's own list needs the same permission, so a user who can use the page should have it.

### At risk (not tested)
The docs say these need no specific permission, except the enum list, which isn't documented.

| Endpoint | Used in | Dropdown endpoint available |
|---|---|---|
| `/api/v1/academic/program-master/by-campus/{campusGuid}` | Transaction, Outstanding and IA Evaluation reports → Programme | `/api/v1/academic/program-master/dropdown?campusGuid=` |
| `/api/v1/students/sponsor-categories` | Transaction, Outstanding and IA Evaluation reports → Sponsor | None documented |
| `/api/v1/finance/ledgers` | Transaction report → fee ledgers | None documented |
| `/api/v1/admissions/application-filling/vetted-registered-search` | Transaction report → Student | – |
| `/api/v1/finance/enums/payment-types` | Transaction report → Payment types | – |
| `/api/v1/academic/timetables/lecturers`, `/by-lecturer`, `/course-units` | Attendance reports | None documented |
| `/api/v1/students/{guid}` | Student % report | – |

### Lower risk
The `/dropdown` endpoints and `semesters/dropdownforprogram`. Every `/dropdown` call in the live test worked, though only a few were exercised.

### Suggested follow-ups
1. **Frontend:** load Programme on the Transaction, Outstanding and IA Evaluation reports from `/api/v1/academic/program-master/dropdown?campusGuid=`, after checking that it returns the same programmes as `by-campus`.
2. **Backend:** add dropdown endpoints for `sponsor-categories` and `ledgers`; none is documented today.
3. **Backend:** confirm that users with the Attendance reports but no Timetable access can read the three `timetables` endpoints.

### How to verify
Filter the Network tab by status `403` and test with a user who has Analytics reports only:
1. **Transaction report:** open Programme, Sponsor, Student and Ledgers.
2. **IA Evaluation report:** choose a campus, then open Programme and Sponsor.
3. **Student % report:** choose an intake and term, then open Lecturer and Course Unit.
