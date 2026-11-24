# Configuration Module: Dropdown APIs and 403 Risk

Configuration is a menu of master pages, some of which belong to other modules. This lists the dropdowns on those pages, the endpoint that fills each one, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET`. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### General, Academic and Admission masters (`/config` pages)
| Page → Dropdown | API | Dropdown API? |
|---|---|---|
| Department Master form → Head of Department | `/api/v1/users/employees/dropdown` | Yes |
| Designation Master form → Min. Qualification | `/api/v1/users/course-levels/dropdown` | Yes |
| Faculty Master form → Campus | `/api/v1/academic/campus/dropdown` | Yes |
| Faculty Master form → Dean | `/api/v1/users/employees/dropdown` | Yes |
| Campus Master → Campus Name and Location column filters | `/api/v1/academic/campus?…` (the page's own list) | No |
| Country Master → Nationality column filter | `/api/v1/users/countries?…` (the page's own list) | No |
| Faculty Master → Faculty Name column filter | `/api/v1/academic/faculties?…` (the page's own list) | No |

The other `/config` pages have no dropdowns: Batch Times, Course Level, Enquiry Source, Enquiry Status, Followup Mode, Followup Status, Interest Level, Permission Master, Service Category, Skill Master, Specialization, Student Category, Unit Category, Unit Type and Weekdays.

### Student pages in this menu
| Page → Dropdown | API | Dropdown API? |
|---|---|---|
| Specialization Management → Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Specialization Management → Batch ↳ intake | `/api/v1/students/specialization/batches?intakeGuid=` | No |
| Specialization Management → Stream ↳ batch | `/api/v1/students/specialization/batches/{batchGuid}/context` | No |
| Feedback Master → Intake | `/api/v1/academic/intakes/dropdown` | Yes |
| Feedback Master → Feedback Type | `/api/v1/students/feedback-master/assessment-types/dropdown` | Yes |
| Feedback Master → Question Type | Static | – |

Termination Reason Master has no dropdowns.

### Finance pages in this menu
| Page → Dropdown | API | Dropdown API? |
|---|---|---|
| Exchange Rates → Currency | `/api/v1/finance/currencies?…` | **No** |
| Proc Banks form → Currency | `/api/v1/finance/currencies?…` | **No** |
| Bank Branches form → Bank | `/api/v1/finance/banks/dropdown` | Yes |
| Ledgers and Other Ledgers forms → GL Account | `/api/v1/finance/proc-gl-accounts/dropdown` | Yes |
| Status, type and category options on the other forms | Static | – |

### Academic pages in this menu
| Page → Dropdown | API | Dropdown API? |
|---|---|---|
| Skill Management form → Faculty Member | `/api/v1/users/employees/dropdown` | Yes |
| Skill Management form → Skills | `/api/v1/users/skill-catalog?…` | No |
| Skill Management form → Proficiency | Static | – |
| Room Management → Type filter; form → Room Type | `/api/v1/academic/rooms/types` | No (option list) |
| Programme Level form → Currency | `/api/v1/finance/currencies/dropdown` | Yes |
| Programme Group form → Programme Level | `/api/v1/academic/program-levels/dropdown` | Yes |

### Assessment pages in this menu
| Page → Dropdown | API | Dropdown API? |
|---|---|---|
| Exam Rules Master form → Question Type | Static | – |

Fee Clearance Master and Question FAQs have no dropdowns.

### GUID-based calls
Most masters load their own record by GUID when View or Edit opens, for example `/api/v1/academic/unit-types/{guid}`. Two others matter for dropdowns:

| API | Used in |
|---|---|
| `/api/v1/students/specialization/batches/{batchGuid}/context` | Specialization Management → Stream options |
| `/api/v1/users/employees/{id}` | Skill Management form → Faculty Member, whenever one is set |

---

## 2. Which endpoints may return 403

> **Source:** one live test, on **Application Filing** with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. The Configuration pages themselves have not been tested. **The docs are not reliable for list and by-GUID endpoints:** some documented as needing no specific permission returned 403 in that test.

None of the endpoints refused in that test fills a Configuration dropdown.

### Documented as requiring a permission (not tested)
| Endpoint | Used in | Permission |
|---|---|---|
| `/api/v1/users/employees/{id}` | Skill Management → Faculty Member | `users.employee.get` **or** `users.employeeapproval.get` |

### At risk (not tested)
| Endpoint | Used in | Dropdown endpoint available |
|---|---|---|
| `/api/v1/finance/currencies` | Exchange Rates, Proc Banks → Currency | `/api/v1/finance/currencies/dropdown` |
| `/api/v1/users/skill-catalog` | Skill Management → Skills | None documented |

### Permission groups: open now, may change
`/api/v1/users/admin/permission-groups` and `/api/v1/users/admin/permission-groups/permissions` fill Permission Master and the Employee Permissions popup. They aren't dropdowns. The docs say no permission is enforced today, and that the check exists in the backend code but is switched off. If it is switched on, users without that permission will get 403.

### Lower risk
- The `/dropdown` endpoints.
- **A page's own endpoints:** the Campus, Country and Faculty column filters, `students/specialization/*`, `rooms/types`, and a master's own by-GUID call.

### Suggested follow-ups
1. **Frontend:** load Currency on Exchange Rates and Proc Banks from `/api/v1/finance/currencies/dropdown`.
2. **Backend:** add a dropdown endpoint for `skill-catalog`.
3. **Backend:** say whether the permission-groups check will be switched on, and who should keep access.

### How to verify
Filter the Network tab by status `403` and test with limited users:
1. **Exchange Rates or Proc Banks without Currency Master:** open Currency.
2. **Skill Management without employee permissions:** open Edit and check that Faculty Member and Skills load.
