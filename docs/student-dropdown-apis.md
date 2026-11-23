# Student Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Student module, the endpoint that fills it, and which of those endpoints are likely to return **403 Forbidden** for users who lack certain permissions.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Shared: student search (`StudentLookup`)
Used by Profile, Batch Transfer, Programme Transfer, Fee Structure Transfer, Learning Mode and Intake Transfer.

- `POST /api/v1/students/search/search`

### Student Master
| Dropdown | API |
|---|---|
| Search box suggestions | `/api/v1/students?searchTerm=&page=&pageSize=15` (loads more on scroll) |
| Programme (column filter) | `/api/v1/academic/program-master/dropdown` |
| Semester (column filter) | `/api/v1/academic/semesters/filter/by-semcode/{1..10}` (10 calls, one per possible code, because no endpoint lists the codes that exist) |
| Batch (column filter) | `/api/v1/academic/batches/dropdown?intakeGuid=` (one call per selected intake) |
| Academic Intake (column filter) | `/api/v1/academic/intakes/dropdown` |
| Status (column filter) | Static |

**Modals opened from Student Master**
| Modal → Dropdown | API |
|---|---|
| Learning Mode → Mode | `/api/v1/students/learning-mode/options` |
| Refugee Status → Country | `/api/v1/users/countries/dropdown` |
| Sponsor → Sponsor Category | `/api/v1/students/sponsor-categories` |

### Batch Transfer
| Dropdown | API |
|---|---|
| Target Batch | `/api/v1/students/{studentGuid}/batch-transfer/eligible-batches` |
| Reason | Static (currently commented out) |

### Programme Transfer
| Dropdown | API |
|---|---|
| New Programme | `/api/v1/academic/program-master/dropdown` (falls back to a static list if empty) |
| New Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| New Batch ↳ semester | `/api/v1/students/program-transfer/batches` (programme + semester) |
| New Fee Structure ↳ programme | `/api/v1/students/program-transfer/fee-structures` (programme) |

### Fee Structure Transfer
| Dropdown | API |
|---|---|
| New Fee Structure | `/api/v1/students/program-transfer/fee-structures` for the student's current programme (the current fee structure is removed from the list) |

### Intake Transfer
**Dropout rejoin**
| Dropdown | API |
|---|---|
| Target Semester | `/api/v1/students/dropout-rejoin/{studentGuid}/candidate` |
| Fee Head | Same call as Target Semester |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Target Batch ↳ semester + batch time | `/api/v1/students/dropout-rejoin/{studentGuid}/batches` |

**Intake transfer**
| Dropdown | API |
|---|---|
| Target Intake Period | Static (not connected to an API yet) |
| Assign to Batch | Static (not connected to an API yet) |

### Learning Mode
| Dropdown | API |
|---|---|
| Mode | `/api/v1/students/learning-mode/options` |

### Learning Mode Report
| Dropdown | API |
|---|---|
| Campus | `/api/v1/academic/campus/dropdown` |
| Mode | `/api/v1/students/learning-mode/options` |
| Intake | `/api/v1/academic/intakes/dropdown` |

### Specialization
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Batch ↳ intake | `/api/v1/students/specialization/batches?intakeGuid=` |
| Stream ↳ batch | `/api/v1/students/specialization/batches/{batchGuid}/context` |

### Feedback Master
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Feedback Type (edit and create) | `/api/v1/students/feedback-master/assessment-types/dropdown` |
| Question Type | Static |

### Terminate Student
| Dropdown | API |
|---|---|
| Reason | `/api/v1/students/termination-reasons/dropdown` |

### Service Tickets
| Dropdown | API |
|---|---|
| Status (filter and edit) | `/api/v1/students/enums/ticket-statuses` |
| Category (filter and edit) | `/api/v1/students/service-categories` |

### Reports → Students in Programme
| Dropdown | API |
|---|---|
| Programme | `/api/v1/academic/program-master/dropdown` |
| Semester (multi) ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Intake (multi) | `/api/v1/academic/intakes/dropdown` |
| Student status | Static |

### Communications (Bulk Email)
**Compose**
| Dropdown | API |
|---|---|
| Campus | `/api/v1/academic/campus/dropdown?search=` |
| School | `/api/v1/academic/faculties/dropdown` (campus) |
| Programme, school picked | `/api/v1/academic/program-master/dropdown` (filtered by school) |
| Programme, only campus picked | `/api/v1/academic/program-master/by-campus/{campusGuid}?page=&pageSize=&search=` |
| Programme, neither picked | `/api/v1/academic/program-master?page=&pageSize=&search=` |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Batch ↳ semester | `/api/v1/academic/batches/dropdown?programGuid=&semesterGuid=` |
| Intake | `/api/v1/academic/intakes/dropdown?search=` |
| Sponsor Category | `/api/v1/students/sponsor-categories?page=&pageSize=20` |
| Nationality | `/api/v1/users/countries/dropdown?search=` |
| Gender, Refugee | Static |

**Mail list**
| Dropdown | API |
|---|---|
| Status filter | Static |

### Announcement Management
| Dropdown | API |
|---|---|
| Programme (form) | `/api/v1/academic/program-master/dropdown` |

### Pages with no API-backed dropdowns
- **Services:** all dropdowns are static. It looks like an older mock version of Service Tickets.
- **Passout Confirmation:** the Programme Group dropdown is static (PCSE / PCIM).
- **Profile, Refugee Approval:** they call the intakes and countries dropdown endpoints only to display names, not to fill a dropdown.
- **Event Management, Termination Reasons, Learning Mode Approval:** no dropdowns.

---

## 2. Which endpoints may return 403

> **Caveat:** the backend's permission rules were not available when this was written, so this section is inferred. It follows the convention noted in `src/lib/api/academic/intake.ts`: `/dropdown` endpoints are meant to be readable by **any logged-in user**, while plain list and filter endpoints are tied to the matching master page's **View** permission. Confirm with the backend team or by testing.

### Most likely: list or filter endpoints used as dropdown sources
| Endpoint | Used in | Permission it probably needs |
|---|---|---|
| `/api/v1/students/sponsor-categories` | Student Master → Sponsor modal; Bulk Email → Sponsor Category | Sponsor Category master |
| `/api/v1/students/service-categories` | Service Tickets → Category (filter and edit) | Service Category master |
| `/api/v1/academic/program-master?page=…` | Bulk Email → Programme (no campus or school picked) | Programme Master |
| `/api/v1/academic/program-master/by-campus/{guid}` | Bulk Email → Programme (only campus picked) | Probably Programme Master |
| `/api/v1/academic/semesters/filter/by-semcode/{n}` | Student Master → Semester column filter | Semester master. If refused, all 10 calls fail |

### Possible: feature endpoints used outside their own page
| Endpoint | Used in | Why it might fail |
|---|---|---|
| `/api/v1/students/learning-mode/options` | Student Master → Learning Mode modal | The user may have Student Master but not Learning Mode permission |
| `/api/v1/students/enums/ticket-statuses` | Service Tickets → Status | Enum lists are usually open, but this one sits under the students service |

### Unlikely
- Every `/dropdown` endpoint: intakes, campus, faculties, batches, batch times, program-master, countries, termination reasons, feedback types.
- `/api/v1/academic/semesters/dropdownforprogram`.
- Endpoints that only run on their own page (batch-transfer eligible batches, program-transfer, dropout-rejoin, specialization): anyone who can open the page should already have that permission.

### Suggested follow-ups for the backend team
1. Confirm the required permission for each endpoint in the "most likely" and "possible" tables.
2. Consider adding `/dropdown` versions of `sponsor-categories` and `service-categories` so that pages which only need the list don't require master-page permissions.
3. Add one endpoint that lists the existing semester codes. That would replace the 10 `by-semcode` calls on Student Master and remove a 10× 403 risk.

### How to verify
Sign in as a staff member with limited permissions, open each page above with the browser's Network tab filtered to status `403`, and open each dropdown.
