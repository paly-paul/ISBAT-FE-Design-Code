# Academic Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Academic module, the endpoint that fills it, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Batch Management
| Dropdown | API |
|---|---|
| Campus | `/api/v1/academic/campus/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Column filters (Batch Code, Programme, Semester, Specialization, Batch Time, In-Charge, Programme Head, Status) | `/api/v1/academic/batches/filter-options?…` |

**Add / Edit Batch**
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Specialization | `/api/v1/academic/specializations/dropdown` |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Batch In-Charge, Programme Head | `/api/v1/users/employees/dropdown` |

### Course Allocation
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| School / Faculty | `/api/v1/academic/faculties/dropdown` |
| Lecturer Name, Lecturer filter | `/api/v1/users/employees/dropdown` |
| Course Units ↳ lecturer and session | `/api/v1/academic/program-plannings/course-unit-dropdown?…` |
| Term | Static |

### Course Units
| Dropdown | API |
|---|---|
| Add / Edit → Repetition Tag | `/api/v1/academic/course-unit-repetitions/dropdown` |

The Programme, Semester and Type filters on this page are currently hidden.

### Fee Structure (Add / Edit)
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` |
| Base Currency, fee line Currency | `/api/v1/finance/currencies/dropdown` |
| Copy Fee Code | `/api/v1/academic/Programfee-structure?…` (paged list) |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Ledger | `/api/v1/finance/ledgers?page=&pageSize=` (paged list) |
| Student Type, Lumpsum Discount Type | Static |

### Programme Master
| Dropdown | API |
|---|---|
| Programme Level filter | `/api/v1/academic/program-levels/dropdown` |
| Group and Admission Status column filters | Static |

**Add / Edit Programme**
| Dropdown | API |
|---|---|
| Programme Group | `/api/v1/academic/program-groups?…` (paged list) |
| Programme Level | `/api/v1/academic/program-levels/dropdown` |
| Faculty | `/api/v1/academic/faculties/dropdown` |
| Currency, fee line Currency | `/api/v1/finance/currencies/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Specialization(s) | `/api/v1/academic/specializations?…` (paged list) |
| Course unit picker | `/api/v1/academic/courseunits?…` (paged list) |
| Unit Type | `/api/v1/academic/unit-types/dropdown` |
| Unit Category | `/api/v1/academic/unit-categories/dropdown` |
| Specialization (per unit) | None. Uses the specializations already chosen |
| Copy Fee Code | `/api/v1/academic/Programfee-structure?…` (paged list) |
| Ledger | `/api/v1/finance/ledgers?page=&pageSize=` (paged list) |
| Base Currency, Lumpsum Discount Type and other options | Static |

### Programme Approval
| Dropdown | API |
|---|---|
| Programme Level filter | `/api/v1/academic/program-levels/dropdown` |

### Programme Group, Programme Level, Repetition Tag, Rooms, Skills and Intakes
| Page → Dropdown | API |
|---|---|
| Programme Group form → Programme Level | `/api/v1/academic/program-levels/dropdown` |
| Programme Level form → Currency | `/api/v1/finance/currencies/dropdown` |
| Repetition Tag form → Programme Level | `/api/v1/academic/program-levels/dropdown` |
| Room Management → Type filter; form → Room Type | `/api/v1/academic/rooms/types` |
| Skill Master form → Faculty Member | `/api/v1/users/employees/dropdown` |
| Skill Master form → Skills | `/api/v1/users/skill-catalog?…` (paged list) |
| Skill Master form → Proficiency | Static |
| Intake Master form → Financial Year, Intake, Exam Year, Exam Month | Static |

### Session Movement
| Dropdown | API |
|---|---|
| Academic Session | `/api/v1/academic/intakes/dropdown` |
| Campus | `/api/v1/academic/campus/dropdown` |

### Timetable
| Dropdown | API |
|---|---|
| Session | `/api/v1/academic/timetables/intakes`, with labels from `/api/v1/academic/intakes/dropdown` |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Lecturer ↳ session and term | `/api/v1/academic/timetables/lecturers?…` |
| Course Unit ↳ lecturer | `/api/v1/academic/timetables/course-units?…` |
| Room Type | `/api/v1/academic/rooms/types` |
| Room | `/api/v1/academic/rooms/dropdown` |
| Term, records per page | Static |

**Timetable slot popup**
| Dropdown | API |
|---|---|
| Weekday | `/api/v1/academic/weekdays` (full list) |
| Time Slot | `/api/v1/academic/timeslots/dropdown` |
| Room Type | `/api/v1/academic/rooms/types` |
| Classroom / Lab ↳ weekday and time slot | `/api/v1/academic/rooms/available?…` |

### Timetable views
| Page → Dropdown | API |
|---|---|
| Session (all three) | `/api/v1/academic/intakes/dropdown` |
| By Batch → Batch ↳ session | `/api/v1/academic/batches/dropdown?intakeGuid=` |
| By Lecturer → Lecturer ↳ session and term | `/api/v1/academic/timetables/lecturers?…` |
| Slot Audit → Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Slot Audit → Day ↳ batch time | `/api/v1/academic/weekdays` (full list) |
| Slot Audit → Time Slot ↳ batch time | `/api/v1/academic/timeslots/dropdown` |
| Term (all three) | Static |

### GUID-based calls behind the dropdowns
If one of these returns 403, the dropdown can still open, but the selected value may show blank or the form may not prefill.

**Look up the selected value**
| API | Dropdown | When it is called |
|---|---|---|
| `/api/v1/academic/program-master/{programGuid}` | Batch form → Programme | Whenever a programme is set |
| `/api/v1/academic/intakes/{intakeGuid}` | Batch form → Intake | Whenever an intake is set |
| `/api/v1/academic/intakes/{intakeGuid}` | Fee Structure and Programme forms → Intake | For each intake used |
| `/api/v1/academic/specializations/{guid}` | Batch form → Specialization; Programme form → Specialization(s) | Whenever one is set |
| `/api/v1/users/employees/{id}` | Batch form → In-Charge, Programme Head; Skill form → Faculty Member | Whenever an employee is set |
| `/api/v1/academic/program-levels/{guid}` | Programme form → Programme Level | Whenever a level is set |
| `/api/v1/academic/faculties/{guid}` | Programme form → Faculty | The faculty's name or campus isn't known |
| `/api/v1/academic/courseunits/{guid}` | Programme form → course units | For units whose details aren't loaded |

**Prefill the form, including its dropdowns**
| API | Form |
|---|---|
| `/api/v1/academic/batches/{guid}` | Edit Batch |
| `/api/v1/academic/courseunits/{guid}/details` | Edit Course Unit |
| `/api/v1/academic/program-master/{programGuid}/full-details` | Edit Programme |
| `/api/v1/academic/program-course-units/{programGuid}` | Edit Programme |
| `/api/v1/academic/Programfee-structure/fee-lines/{feeHdGuid}` | Edit Fee Structure; Copy Fee Code (also in the Programme form) |
| `/api/v1/academic/program-groups/{guid}` | Edit Programme Group |
| `/api/v1/academic/program-levels/{guid}` | Edit Programme Level |
| `/api/v1/academic/course-unit-repetitions/{guid}` | Edit Repetition Tag |
| `/api/v1/academic/rooms/{guid}` | Edit Room |
| `/api/v1/users/skills/{guid}` | Edit Skill |
| `/api/v1/academic/intakes/{intakeGuid}` | Edit Intake |

### Pages whose dropdowns are all static or built from loaded rows
Academic Dashboard, Class Test, Coursework, University Exam, Student Lookup, ODL Applications, ODeL Student Preview and Qualification Equating. The column filters on Intake Master, Programme Group, Programme Level, Programme Approval, Repetition Tag and Skill Master also make no extra call.

---

## 2. Which endpoints may return 403

> **Source:** one live test, on **Application Filing** with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. The Academic pages themselves have not been tested. **The docs are not reliable for list and by-GUID endpoints:** some documented as needing no specific permission returned 403 in that test.

Whether a user is refused depends on their own permissions. Someone who can open a master page should be able to read that master. The risk is a user on one page whose dropdown reads **another page's** master.

### Refused in the live test (admissions user)
| Endpoint | Where Academic dropdowns use it |
|---|---|
| `/api/v1/academic/program-master/{programGuid}` | Batch form → Programme |
| `/api/v1/academic/Programfee-structure` | Fee Structure and Programme forms → Copy Fee Code |
| `/api/v1/academic/batches/{guid}` (*) | Edit Batch |

(*) The Network tab showed only the GUID, so this one is inferred. `/api/v1/academic/batches` and `/api/v1/academic/program-master` were also refused, but here they fill page tables rather than dropdowns.

### Documented as requiring a permission (not tested)
| Endpoint | Used in | Permission |
|---|---|---|
| `/api/v1/users/employees/{id}` | Batch form → In-Charge, Programme Head; Skill form → Faculty Member | `users.employee.get` **or** `users.employeeapproval.get` |
| `/api/v1/academic/program-plannings/course-unit-dropdown` | Course Allocation → Course Units | `academic.program.get` |
| `/api/v1/academic/batches/filter-options` | Batch Management column filters | Same as `/academic/batches` |

`course-unit-dropdown` is an exception to the rule that dropdown endpoints are open.

### At risk (not tested): another page's list or by-GUID endpoint
The docs say these need no specific permission, except the two marked †, which require sign-in but don't say.

| Endpoint | Used in | Dropdown endpoint available |
|---|---|---|
| `/api/v1/finance/ledgers` | Fee Structure and Programme forms → Ledger | None documented |
| `/api/v1/academic/program-groups` | Programme form → Programme Group | Not checked |
| `/api/v1/academic/specializations` | Programme form → Specialization(s) | `/api/v1/academic/specializations/dropdown` |
| `/api/v1/academic/courseunits` | Programme form → course unit picker | `/api/v1/academic/courseunits/dropdown` |
| `/api/v1/users/skill-catalog` | Skill form → Skills | None documented |
| `/api/v1/academic/weekdays` | Timetable slot popup, Slot Audit → Day | `/api/v1/academic/weekdays/dropdown` |
| `/api/v1/academic/intakes/{guid}` | Batch, Fee Structure and Programme forms | `/api/v1/academic/intakes/dropdown` |
| `/api/v1/academic/specializations/{guid}` | Batch and Programme forms | `/api/v1/academic/specializations/dropdown` |
| `/api/v1/academic/program-levels/{guid}` | Programme form | `/api/v1/academic/program-levels/dropdown` |
| `/api/v1/academic/faculties/{guid}` | Programme form | `/api/v1/academic/faculties/dropdown` |
| `/api/v1/academic/courseunits/{guid}` | Programme form | – |
| `/api/v1/academic/Programfee-structure/fee-lines/{feeHdGuid}` | Programme form → Copy Fee Code | – |
| `/api/v1/academic/program-master/{programGuid}/full-details` † | Edit Programme | – |
| `/api/v1/academic/program-course-units/{programGuid}` † | Edit Programme | – |
| `/api/v1/academic/rooms/types`, `/api/v1/academic/rooms/available` | Timetable and slot popup | `/api/v1/academic/rooms/dropdown` for rooms only |

### Lower risk
- **The other `/dropdown` endpoints and `semesters/dropdownforprogram`.** Every `/dropdown` call in the live test worked, though only a few were exercised.
- **A page's own endpoints:** `timetables/*` on the Timetable pages, and a master's own by-GUID call on its own edit form.

### Suggested follow-ups
1. **Backend:** confirm the permission for each endpoint above and correct the docs.
2. **Frontend:** the Batch form loads Programme, Intake, Specialization and Employee by GUID even though it also loads a dropdown for each. Use the dropdown row where it has the fields needed, and look up by GUID only when it is missing.
3. **Frontend:** use `weekdays/dropdown` where it returns the fields needed, such as the day code.

### How to verify
Filter the Network tab by status `403` and test with limited users:
1. **Batch Management only:** open Edit Batch (programme, intake, specialization and employee by GUID).
2. **Course Allocation without programme permission:** open the Course Units dropdown.
3. **Fee Structure without finance permission:** open Ledger and Copy Fee Code.
4. **Programme Master only:** open the Add Programme form's Group, Specialization and course unit pickers.
5. **Timetable only:** open the slot popup's Weekday and Room Type.
