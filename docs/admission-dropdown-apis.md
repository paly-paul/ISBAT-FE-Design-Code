# Admission Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Admission module, the endpoint that fills it, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Online Enquiry, Kiosk Enquiry and On-Desk Enquiry
The three forms share these dropdowns, except where noted.

| Dropdown | API |
|---|---|
| Gender | `/api/v1/admissions/enums/genders` |
| Phone code, Country | `/api/v1/users/countries/dropdown` |
| Campus | `/api/v1/academic/campus/dropdown` |
| Programme Interest ↳ campus | `/api/v1/academic/program-master/dropdown?campusGuid=&search=` |
| Enquiry Source (Online and Kiosk) | `/api/v1/admissions/enquiry-sources/dropdown` |
| ISBAT Source | `/api/v1/admissions/isbat-enquiry-sources/dropdown` |
| Preferred Study Mode (On-Desk) | Static |

- Preferred Intake is a read-only field, filled from `/api/v1/academic/intakes/dropdown`.
- On-Desk's Enquiry Source is a read-only field, set to "Direct" from `/api/v1/admissions/enquiry-sources/dropdown`.

### Enquiry Form (`/admission/enquiry-form`)
All four dropdowns are static.

### Enquiry List
| Dropdown | API |
|---|---|
| Channel | `/api/v1/admissions/enquiry-sources/dropdown` |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Status | `/api/v1/admissions/enquiry-statuses/dropdown` |
| Search suggestions | `/api/v1/admissions/enquiries` (the page's own list) |

### Edit / Assign Enquiry popup
Opened from Enquiry List, Enquiry Follow-up and Enquiry Follow-up Master.

| Dropdown | API |
|---|---|
| Advisor | `/api/v1/users/employees?…` (paged employee list) |
| Programme | `/api/v1/academic/program-master?page=&pageSize=&search=` |
| Campus | `/api/v1/academic/campus/dropdown` |

### New Follow-up Log popup
Opened from Enquiry Follow-up and Enquiry Follow-up Master.

| Dropdown | API |
|---|---|
| Follow-up Status | `/api/v1/admissions/follow-up-statuses/dropdown` |
| Follow-up Mode | `/api/v1/admissions/followup-modes/dropdown` |
| Enquiry Status | `/api/v1/admissions/enquiry-statuses/dropdown` |
| Interest Level | `/api/v1/admissions/interest-levels/dropdown` |

The popup also looks up the signed-in user in `/api/v1/users/employees?…` when the session has no employee ID. This isn't a dropdown, but it has the same 403 risk as Advisor.

### Application Payment
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` (only the current and admission intakes) |
| Enquiry ↳ intake | `/api/v1/admissions/application-payments/unconverted-enquiries?intakeGuid=&page=&pageSize=` |
| Phone code, Country | `/api/v1/users/countries/dropdown` |
| Campus | `/api/v1/academic/campus/dropdown` |
| Interested Programme ↳ campus | `/api/v1/academic/program-master/by-campus/{campusGuid}?page=&pageSize=&search=` |
| Fee Structure ↳ programme | `/api/v1/academic/Programfee-structure?…` (paged list) |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Batch ↳ programme, semester and batch time | `/api/v1/academic/batches?…` (paged list) |
| Exemption Type | `/api/v1/admissions/application-payments/dropdowns/exemption-types` |
| Payment Method | `/api/v1/admissions/application-payments/dropdowns/payment-types` |
| Receipt Book | `/api/v1/finance/receipt-books/dropdown` |
| Currency | `/api/v1/finance/currencies/dropdown` |
| Bank | `/api/v1/finance/proc-banks?page=&pageSize=`, plus `/api/v1/finance/proc-banks/{guid}` when the selected bank isn't loaded |

**Today's Exchange Rate popup:** its Currency dropdown reuses the page's currencies.

### Application Filing
| Dropdown | API |
|---|---|
| Applicant search | `/api/v1/admissions/application-payments/current-intake?page=&pageSize=…` |
| Gender, Phone code | Static |
| Nationality, Sponsor Country | `/api/v1/users/countries/dropdown` |
| Campus (locked) | `/api/v1/academic/campus/dropdown` |
| Programme (locked) | `/api/v1/academic/program-master?page=&pageSize=`, plus `/api/v1/academic/program-master/{programGuid}` when it isn't loaded |
| Fee Structure ↳ programme | `/api/v1/academic/Programfee-structure?…` (paged list) |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |
| Batch ↳ programme, semester and batch time | `/api/v1/academic/batches?…` (paged list), plus `/api/v1/academic/batches/{guid}` when it isn't loaded |

### ODeL Application
| Dropdown | API |
|---|---|
| Gender | Static |
| Country, Phone code, Sponsor phone country | `/api/v1/users/countries/dropdown` |
| Programme | `/api/v1/academic/program-master/by-campus/{campusGuid}?page=&pageSize=&search=` |
| Semester ↳ programme | `/api/v1/academic/semesters/dropdownforprogram?programGuid=` |
| Batch Time | `/api/v1/academic/batchtimes/dropdown` |

Campus is a read-only field, filled from `/api/v1/academic/campus/dropdown`.

### Vetting
| Dropdown | API |
|---|---|
| Programme filter (vetting queue) | None. Built from the rows on the current page |
| Intake (waiting list and rejections) | `/api/v1/academic/intakes/dropdown?search=` |
| Campus (waiting list and rejections) | `/api/v1/academic/campus/dropdown?search=` |
| Programme (waiting list and rejections) | `/api/v1/academic/program-master?page=&pageSize=&search=` |
| Reject popup → Rejection Reason | Static |

### Registration
| Dropdown | API |
|---|---|
| Complete Registration popup → Registration Type | `/api/v1/admissions/registrar-desk/applications/{applicationGuid}/registration-detail` |

### Paid Students
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Payment kind, Stage | Static |

### Reports → Application Status
| Dropdown | API |
|---|---|
| Intakes | `/api/v1/academic/intakes/dropdown` |
| Stages | Static |
| Campuses | `/api/v1/academic/campus/dropdown` |
| Programmes | `/api/v1/academic/program-master/dropdown` |

### Reports → Enquiry
| Dropdown | API |
|---|---|
| Intakes | `/api/v1/academic/intakes/dropdown` |
| Enquiry statuses | `/api/v1/admissions/enquiry-statuses/dropdown` |
| Follow-up statuses | `/api/v1/admissions/follow-up-statuses/dropdown` |
| Staff | `/api/v1/users/employees/dropdown` |

### GUID-based calls behind the dropdowns
A dropdown can need a second call when the record holds only a GUID. If that call returns 403, the dropdown can still open, but the selected value may show blank or the prefill may not happen.

**Show the selected value when it isn't in the loaded list**
| API | Dropdown | When it is called |
|---|---|---|
| `/api/v1/academic/program-master/{programGuid}` | Filing → Programme | The applicant's programme isn't in the loaded list |
| `/api/v1/academic/batches/{guid}` | Filing → Batch | The applicant's batch isn't in the loaded list |
| `/api/v1/academic/intakes/{guid}` | Application Payment → Intake | Every time an intake is set, even if it is already in the list |
| `/api/v1/finance/proc-banks/{guid}` | Application Payment → Bank | The selected bank isn't in the loaded list |

**Prefill the form, including its dropdowns**
| API | Used in | When it is called |
|---|---|---|
| `/api/v1/admissions/enquiries/{guid}` | Application Payment | An enquiry is selected, or the page is opened from an enquiry |
| `/api/v1/admissions/enquiries/{guid}` | Edit / Assign Enquiry popup | The popup opens |
| `/api/v1/admissions/application-filling/by-payment/{paymentGuid}` | Filing | An applicant is selected |

**Load the options for a parent GUID**
| API | Dropdown |
|---|---|
| `/api/v1/academic/program-master/by-campus/{campusGuid}` | Application Payment, ODeL → Programme |
| `/api/v1/admissions/registrar-desk/applications/{applicationGuid}/registration-detail` | Registration → Registration Type |

**Show names only (not a dropdown)**
| API | Used in |
|---|---|
| `POST /api/v1/users/countries/by-guids` | Enquiry List and Edit / Assign Enquiry popup → phone code |
| `/api/v1/academic/intakes/{guid}` | Edit / Assign Enquiry popup → Intake |

### Pages with no API-backed dropdowns of their own
- **Dashboard, Applicant Profile:** no dropdowns.
- **Applicants, Registration, Vetting, Enquiry Follow-up, Enquiry Follow-up Master:** the search suggestions reuse the page's own list, with no separate dropdown call.

---

## 2. Which endpoints return 403

> **Source:** a live test on Application Filing with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. **The two disagree:** several endpoints documented as needing no specific permission returned 403. Treat the docs as unreliable for list and by-GUID endpoints until the backend confirms them.

### Confirmed 403 (Application Filing)
| Endpoint | Dropdown affected | What the docs say |
|---|---|---|
| `/api/v1/academic/program-master?page=…` | Programme | Sign-in required; permission not stated |
| `/api/v1/academic/program-master/{programGuid}` (failed twice) | Programme | Sign-in required; permission not stated |
| `/api/v1/academic/batches?programGuids=…` | Batch | No specific permission |
| `/api/v1/academic/batches/{guid}` (*) | Batch | No specific permission |
| `/api/v1/academic/Programfee-structure?…` | Fee Structure | No specific permission |

(*) The Network tab showed only the GUID. This is the only other by-GUID call Filing makes for a dropdown.

The same endpoints are used elsewhere, so the same user should be refused there too:
- **Application Payment:** Batch, Fee Structure
- **Edit / Assign Enquiry popup:** Programme
- **Vetting (waiting list and rejections):** Programme

### Confirmed working for the same user
- `/api/v1/academic/semesters/dropdownforprogram`
- both `/dropdown` calls made on the page
- `/api/v1/admissions/application-payments/current-intake` and `/api/v1/admissions/enquiries`

### Documented as requiring a permission (not tested)
| Endpoint | Used in | Permission |
|---|---|---|
| `/api/v1/users/employees` | Edit / Assign Enquiry → Advisor; New Follow-up Log (advisor lookup) | `users.employee.get` **or** `users.employeeapproval.get` |

### At risk (not tested)
These are the same kind of list or by-GUID endpoint as the ones that failed. The docs say they are open, but they said that about batches and fee structures too.

| Endpoint | Used in |
|---|---|
| `/api/v1/academic/intakes/{guid}` | Application Payment → Intake; Edit / Assign Enquiry → Intake name |
| `/api/v1/academic/program-master/by-campus/{campusGuid}` | Application Payment, ODeL → Programme |
| `/api/v1/finance/proc-banks`, `/api/v1/finance/proc-banks/{guid}` | Application Payment → Bank |
| `POST /api/v1/users/countries/by-guids` | Enquiry List, Edit / Assign Enquiry → phone code |
| `/api/v1/admissions/application-payments/unconverted-enquiries` | Application Payment → Enquiry |
| `/api/v1/admissions/enquiries/{guid}` | Application Payment prefill; Edit / Assign Enquiry |
| `/api/v1/admissions/application-filling/by-payment/{paymentGuid}` | Filing prefill |
| `/api/v1/admissions/registrar-desk/applications/{applicationGuid}/registration-detail` | Registration → Registration Type |

### Not expected
The remaining `/dropdown` endpoints, `/enums/genders`, and the `exemption-types` and `payment-types` dropdowns.

### Suggested follow-ups
1. **Backend:** confirm the permission for each confirmed endpoint and correct the docs, or let admissions users read them.
2. **Frontend:** move to endpoints documented as open, after testing them with the same user:
   - Programme: `/api/v1/academic/program-master/dropdown`
   - Batch: `/api/v1/academic/batches/dropdown` or `/api/v1/admissions/application-payments/dropdowns/batches`
   - Fee Structure: `/api/v1/admissions/application-payments/dropdowns/fees`
   - Advisor: `/api/v1/users/employees/dropdown`

   The frontend moved off the two `application-payments/dropdowns` endpoints earlier because they returned empty results, so the backend needs to confirm they work now.

### How to verify
Sign in as an admissions user with limited permissions, filter the Network tab by status `403`, and open each dropdown under "At risk" and "Documented as requiring a permission".
