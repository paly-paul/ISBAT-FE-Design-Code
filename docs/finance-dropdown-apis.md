# Finance Module: Dropdown APIs and 403 Risk

This lists every dropdown in the Finance module, the endpoint that fills it, and which of those endpoints are likely to return **403 Forbidden** for users who lack certain permissions.

All endpoints are `GET` unless marked otherwise. **Static** means the options are hard-coded in the frontend and no API is called. **↳** means the dropdown waits until an earlier dropdown has a value.

---

## 1. Dropdown → API map

### Shared dropdowns used across Finance
| Dropdown | API | Used in |
|---|---|---|
| Student search | `/api/v1/admissions/application-filling/payment-console/search?searchTerm=&pageNumber=&pageSize=` | Payment Console, Discount Allocation, NCHE / Guild Payment, New Advance Deposit modal |
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
| Student search | `/api/v1/admissions/application-filling/payment-console/search` |
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

---

## 2. Which endpoints may return 403

> **Caveat:** the backend's permission rules were not available when this was written, so this section is inferred. It follows the convention the frontend has relied on so far: `/dropdown` endpoints are meant to be readable by **any logged-in user**, while plain list and filter endpoints are tied to the matching master page's **View** permission. Confirm with the backend team or by testing.

### Most likely: list endpoints used as dropdown sources
| Endpoint | Used in | Permission it probably needs |
|---|---|---|
| `/api/v1/finance/currencies?page=1&pageSize=…` | Exchange Rates; Payment Refund form; Edit Payment modal; New Advance Deposit modal; Processing Bank form | Currency master. A `/currencies/dropdown` endpoint already exists, and Payment Console and NCHE / Guild already use it |
| `/api/v1/finance/proc-banks?page=&pageSize=` | Processing bank picker in Payment Console, Edit Payment, Edit Other Payment, New Advance Deposit | Processing Bank master. **This is the highest-impact item: a cashier without that permission can't pick a bank when taking a payment** |
| `/api/v1/finance/cooperates?page=1&pageSize=…` | Discount Allocation → Cooperate | Cooperate master |
| `/api/v1/finance/ledgers?page=1&pageSize=…` | Transaction report → fee ledgers | Ledger master |
| `/api/v1/students/sponsor-categories` | Outstanding report, Transaction report, Dashboard student list → Sponsor | Sponsor Category master (Student module) |
| `/api/v1/academic/batches?…` | Payment Refund → Passout Library Deposit → Batch | Batch master (Academic module) |
| `/api/v1/academic/program-master?page=…` | Payment Refund → Passout Library Deposit → Programme (no campus) | Programme Master (Academic module) |
| `/api/v1/academic/program-master/by-campus/{guid}` | Report scope filters; Passout Library Deposit → Programme | Probably Programme Master |

### Possible: feature endpoints from another module or page
| Endpoint | Used in | Why it might fail |
|---|---|---|
| `/api/v1/admissions/application-filling/payment-console/search` | Discount Allocation, NCHE / Guild, New Advance Deposit | An Admissions endpoint named for the Payment Console. A user with those pages but not Payment Console could be refused |
| `/api/v1/admissions/application-filling/vetted-registered-search` | Transaction report → Student | Admissions endpoint used from Finance |
| `/api/v1/students/studentstatement/search` | Student Statements → Student search | Student module endpoint used from Finance |
| `POST /api/v1/students/search/search` | Refugee Status → Student search | Student module endpoint used from Finance |
| `/api/v1/finance/proc-banks/{guid}` | Processing bank picker (only when the saved bank isn't in the loaded list) | Single-record read on the Processing Bank master |

### Unlikely
- Every `/dropdown` endpoint: finance currencies, receipt books, discounts, banks, proc GL accounts and ledger others; academic intakes, campus, program-master and batches; countries.
- `/api/v1/academic/semesters/dropdownforprogram`.
- `/api/v1/finance/payment-console/ledger-others`, which only runs on Payment Console itself.
- `/api/v1/finance/enums/payment-types`: enum lists are usually open.

### Suggested follow-ups
1. **Backend:** confirm the required permission for each endpoint in the "most likely" and "possible" tables.
2. **Backend:** add `/dropdown` versions of `proc-banks`, `cooperates` and `ledgers` (and `sponsor-categories`, also flagged in the Student module write-up) so pages that only need a list don't require master-page permissions.
3. **Frontend:** switch the five places that read the full `/finance/currencies` list to the existing `/finance/currencies/dropdown`. This is the only fix that doesn't need backend work.

### How to verify
Sign in as a staff member with limited permissions (for example, a cashier role), open each page above with the browser's Network tab filtered to status `403`, and open each dropdown. Payment Console is the most important page to test.
