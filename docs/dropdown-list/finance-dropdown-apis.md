# Finance Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Finance module, the endpoint that fills it, and which of those endpoints may return **403 Forbidden**.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Shared dropdowns used across Finance
| Dropdown | API | Used in |
|---|---|---|
| Student search | `/api/v1/admissions/application-filling/payment-console/search?searchTerm=&pageNumber=&pageSize=` | Payment Console, Discount Allocation, Guild Payment, New Advance Deposit modal |
| Processing bank picker | `/api/v1/finance/proc-banks?page=&pageSize=` (loads more on scroll), plus `/api/v1/finance/proc-banks/{guid}` when the saved bank isn't in the loaded pages | Payment Console, Edit Payment modal, Edit Other Payment modal, New Advance Deposit modal |
| Report scope filters | Campus → `/api/v1/academic/campus/dropdown`<br>Programme ↳ campus → `/api/v1/academic/program-master/by-campus/{campusGuid}`<br>Semesters ↳ programme → `/api/v1/academic/semesters/dropdownforprogram?programGuid=`<br>Batches ↳ semesters → `/api/v1/academic/batches/dropdown?programGuid=&semesterGuid=…`<br>Sponsor → `/api/v1/students/sponsor-categories?page=1&pageSize=100` | Outstanding report, Transaction report, Dashboard student list |

### Dashboard
| Dropdown | API |
|---|---|
| Group by | Static (Day / Month) |
| Breakdown switch | Static |

The current intake is picked automatically from `/api/v1/academic/intakes/dropdown`. There's no intake dropdown on screen.

**Cleared / Blocked students list (modal)**
| Dropdown | API |
|---|---|
| Campus, Programme, Semesters, Batches | Report scope filters (see shared dropdowns) |
| Registration status | Static |

### Payment Console
| Dropdown | API |
|---|---|
| Student search | `/api/v1/admissions/application-filling/payment-console/search` |
| Currency (tuition and other payments) | `/api/v1/finance/currencies/dropdown` |
| Receipt Book (tuition and other payments) | `/api/v1/finance/receipt-books/dropdown`, filtered on screen by payment method |
| Processing Bank (tuition and other payments) | `/api/v1/finance/proc-banks?page=&pageSize=` |
| Ledger (other payments rows) | `/api/v1/finance/payment-console/ledger-others` |

**Modals opened from Payment Console**
| Modal → Dropdown | API |
|---|---|
| Edit Payment → Currency | `/api/v1/finance/currencies?page=1&pageSize=…` (full list) |
| Edit Payment → Payment Type | Static |
| Edit Payment → Receipt Book | `/api/v1/finance/receipt-books/dropdown` |
| Edit Payment → Processing Bank | `/api/v1/finance/proc-banks?page=&pageSize=` |
| Edit Other Payment → Processing Bank | `/api/v1/finance/proc-banks?page=&pageSize=` |
| Today's Exchange Rate → Currency | Same list as the console's Currency dropdown (`/api/v1/finance/currencies/dropdown`) |

### Payment History
| Dropdown | API |
|---|---|
| Fee type filter | Static |
| Search suggestions | No extra call (filters rows already loaded) |
| Edit Payment modal | Same as under Payment Console |

### Advanced Payments
| Dropdown | API |
|---|---|
| Search suggestions | No extra call (filters rows already loaded) |

**New Advance Deposit modal**
| Dropdown | API |
|---|---|
| Student search | `/api/v1/admissions/application-filling/payment-console/search` |
| Currency | `/api/v1/finance/currencies?page=1&pageSize=…` (full list) |
| Payment Type | Static |
| Receipt Book | `/api/v1/finance/receipt-books/dropdown` |
| Processing Bank | `/api/v1/finance/proc-banks?page=&pageSize=` |

### Discount Allocation
| Dropdown | API |
|---|---|
| Student search | `/api/v1/admissions/application-filling/payment-console/search` |
| Discount | `/api/v1/finance/discounts/dropdown` |
| Cooperate (assign and edit) | `/api/v1/finance/cooperates?page=1&pageSize=…` (full list) |

### NCHE / Guild Payment
| Dropdown | API |
|---|---|
| Student search (NCHE) | `/api/v1/students/nche-search?…` |
| Student search (Guild) | `/api/v1/admissions/application-filling/payment-console/search` |
| Currency | `/api/v1/finance/currencies/dropdown` |

### Exchange Rates
| Dropdown | API |
|---|---|
| Currency | `/api/v1/finance/currencies?page=1&pageSize=…` (full list) |

### Payment Refund
**Shared refund form**
| Dropdown | API |
|---|---|
| Currency | `/api/v1/finance/currencies?page=1&pageSize=…` (full list) |

**Passout Library Deposit tab**
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Campus | `/api/v1/academic/campus/dropdown` |
| Programme, campus picked | `/api/v1/academic/program-master/by-campus/{campusGuid}?page=&pageSize=&search=` |
| Programme, no campus | `/api/v1/academic/program-master?page=&pageSize=&search=` |
| Batch | `/api/v1/academic/batches?…` (paged batch list) |

### Refugee Status
| Dropdown | API |
|---|---|
| Student search | `POST /api/v1/students/search/search` |
| Country | `/api/v1/users/countries/dropdown` |

### Student Statements
| Dropdown | API |
|---|---|
| Student search | `/api/v1/students/studentstatement/search?…` (loads more on scroll) |
| Category filter | Static |

### Ledger Adjustments
| Dropdown | API |
|---|---|
| Student search | None. Uses hard-coded demo students; this page isn't connected to an API yet |
| Adjust Ledger modal → Currency | Static (USD / UGX) |

### Reports → Outstanding
| Dropdown | API |
|---|---|
| Campus, Programme, Semesters, Batches, Sponsor | Report scope filters (see shared dropdowns) |
| Intake | `/api/v1/academic/intakes/dropdown` |
| Status | Static |

### Reports → Transaction
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Student | `/api/v1/admissions/application-filling/vetted-registered-search?…` |
| Campus, Programme, Semesters, Batches, Sponsor | Report scope filters (see shared dropdowns) |
| Payment types | `/api/v1/finance/enums/payment-types` |
| Receipt books | `/api/v1/finance/receipt-books/dropdown` (including used-up books) |
| Ledgers, fee ledgers group | `/api/v1/finance/ledgers?page=1&pageSize=…` (full list) |
| Ledgers, other ledgers group | `/api/v1/finance/ledger-others/dropdown` |

### Reports → Discount
| Dropdown | API |
|---|---|
| Intake | `/api/v1/academic/intakes/dropdown` |
| Discount | `/api/v1/finance/discounts/dropdown` |
| Programme | `/api/v1/academic/program-master/dropdown` |

The Student field on this report is a plain text box, not a dropdown.

### Master pages (form modals)
| Page → Dropdown | API |
|---|---|
| Bank Branches → Bank | `/api/v1/finance/banks/dropdown` |
| Bank Branches → Status | Static |
| Banks → Status | Static |
| Discounts → Type (Amount / Percentage) | Static |
| Ledgers → GL Account | `/api/v1/finance/proc-gl-accounts/dropdown` |
| Ledger Others → GL Account | `/api/v1/finance/proc-gl-accounts/dropdown` |
| Processing Banks → Currency | `/api/v1/finance/currencies?page=1&pageSize=…` (full list) |
| Processing Banks → Status | Static |
| Processing GL Accounts → Type, Status | Static |
| Receipt Books → Status, Category, Book Category | Static |

The search boxes on the master pages (Banks, Bank Branches, Cooperates, Currencies, Discounts, General Settings, Ledgers, Ledger Others, Processing Banks, Processing GL Accounts, Receipt Books) only filter rows already on the page and don't make an extra call.

### GUID-based calls behind the dropdowns
If one of these returns 403, the dropdown can still open, but the selected value may show blank or the form may not prefill.

**Look up a selected value or name**
| API | Used in | When it is called |
|---|---|---|
| `/api/v1/finance/proc-banks/{guid}` | Processing bank picker | The selected bank isn't in the loaded list |
| `/api/v1/academic/batches/{guid}` | Discount Allocation → batch name (not a dropdown) | The student's profile has no batch code |

Discount Allocation also calls `/api/v1/academic/program-master?pageSize=1000…` when the profile has no programme name. This isn't a GUID call or a dropdown, but it has the same risk.

**Load the record after a student or parent is picked**
| API | Used in |
|---|---|
| `/api/v1/admissions/application-filling/payment-console/student-profile/{applicationGuid}` | Payment Console, Discount Allocation, NCHE / Guild Payment |
| `/api/v1/students/{studentGuid}/discount` | Discount Allocation → current discount |
| `/api/v1/students/studentstatement/{studentGuid}` | Student Statements |
| `/api/v1/students/refugee/{studentGuid}` | Refugee Status |
| `/api/v1/academic/program-master/by-campus/{campusGuid}` | Report scope filters; Passout Library Deposit → Programme |

**Prefill the edit form, including its dropdowns**
| API | Form |
|---|---|
| `/api/v1/finance/banks/{guid}` | Edit Bank |
| `/api/v1/finance/bank-branches/{guid}` | Edit Bank Branch |
| `/api/v1/finance/cooperates/{guid}` | Edit Cooperate |
| `/api/v1/finance/currencies/{guid}` | Edit Currency |
| `/api/v1/finance/discounts/{guid}` | Edit Discount |
| `/api/v1/finance/gen-sets/{guid}` | Edit General Setting |
| `/api/v1/finance/ledgers/{guid}` | Edit Ledger |
| `/api/v1/finance/ledger-others/{guid}` | Edit Other Ledger |
| `/api/v1/finance/proc-banks/{guid}` | Edit Processing Bank |
| `/api/v1/finance/proc-gl-accounts/{guid}` | Edit Processing GL Account |

---

## 2. Which endpoints may return 403

> **Source:** one live test, on **Application Filing** with a limited admissions user (2026-11-24), then the `Auth` lines in `erp-docs`. The Finance pages themselves have not been tested. **The docs are not reliable for list and by-GUID endpoints:** some documented as needing no specific permission returned 403 in that test.

Whether a user is refused depends on their own permissions. The risk is mainly a user on one page whose dropdown reads **another page's** data.

### Refused in the live test (admissions user)
| Endpoint | Where Finance uses it |
|---|---|
| `/api/v1/academic/program-master?page=…` | Payment Refund → Passout Library Deposit → Programme (no campus); Discount Allocation programme name |
| `/api/v1/academic/batches?…` | Payment Refund → Passout Library Deposit → Batch |
| `/api/v1/academic/batches/{guid}` (*) | Discount Allocation batch name |

(*) The Network tab showed only the GUID, so this one is inferred. A finance user may have different permissions, so these need testing with one.

### Documented as requiring a permission (not tested)
| Endpoint | Used in | Permission |
|---|---|---|
| `/api/v1/students/{studentGuid}/discount` | Discount Allocation | `finance.discountallocation.get` |
| `/api/v1/finance/discounts/{guid}` | Edit Discount | `finance.discounts.get` |

Both belong to the page that uses them, so a user with that page should normally have the permission.

### At risk (not tested)
The docs say these need no specific permission.

| Endpoint | Used in | Dropdown endpoint available |
|---|---|---|
| `/api/v1/finance/proc-banks`, `/api/v1/finance/proc-banks/{guid}` | Processing bank picker. **Highest impact if refused: a cashier couldn't pick a bank when taking a payment** | `/api/v1/finance/proc-banks/dropdown` |
| `/api/v1/finance/currencies` | Exchange Rates; Payment Refund form; Edit Payment; New Advance Deposit; Processing Bank form | `/api/v1/finance/currencies/dropdown` (already used by Payment Console and NCHE / Guild) |
| `/api/v1/finance/cooperates` | Discount Allocation → Cooperate | None documented |
| `/api/v1/finance/ledgers` | Transaction report → fee ledgers | None documented |
| `/api/v1/students/sponsor-categories` | Report scope filters: Outstanding and Transaction reports, Dashboard student list | None documented |
| `/api/v1/academic/program-master/by-campus/{campusGuid}` | Report scope filters; Passout Library Deposit → Programme | `/api/v1/academic/program-master/dropdown?campusGuid=` |
| `/api/v1/admissions/application-filling/payment-console/search` | Payment Console, Discount Allocation, Guild Payment, New Advance Deposit | – |
| `/api/v1/admissions/application-filling/payment-console/student-profile/{applicationGuid}` | Payment Console, Discount Allocation, NCHE / Guild Payment | – |
| `/api/v1/admissions/application-filling/vetted-registered-search` | Transaction report → Student | – |
| `/api/v1/students/nche-search` | NCHE Payment → Student search | – |
| `/api/v1/students/studentstatement/search` | Student Statements → Student search | – |
| `POST /api/v1/students/search/search` | Refugee Status → Student search | – |

### Lower risk
- **The other `/dropdown` endpoints and `semesters/dropdownforprogram`.** Every `/dropdown` call in the live test worked, though only a few were exercised, and not the Finance ones.
- **A page's own endpoints:** `/api/v1/finance/payment-console/ledger-others` on Payment Console, and a master's own by-GUID call on its own edit form.
- `/api/v1/finance/enums/payment-types`: an enum list, but its permission isn't documented.

### Suggested follow-ups
1. **Backend:** confirm the permission for each endpoint above and correct the docs.
2. **Backend:** add dropdown endpoints for `cooperates`, `ledgers` and `sponsor-categories`; none is documented today.
3. **Frontend:** switch the five places that read the full `/finance/currencies` list to `/finance/currencies/dropdown`.
4. **Frontend:** move the processing bank picker to `/finance/proc-banks/dropdown`, after checking how it treats inactive banks and that a saved inactive bank still shows its name.

### How to verify
Filter the Network tab by status `403` and test with limited users:
1. **Cashier on Payment Console:** open Bank and Currency, then Edit Payment.
2. **Discount Allocation only:** pick a student, then open Cooperate.
3. **Finance reports only:** open Sponsor, Programme and Ledgers on the Transaction report.
4. **Payment Refund only:** open Programme and Batch on the Passout Library Deposit tab.
