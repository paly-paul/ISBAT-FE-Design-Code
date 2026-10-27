# Dropdown API Standardisation: Backend Requirements

**Standard:** every dropdown/selector API ends in `/dropdown` and returns an unpaged, lightweight list containing a GUID, a display name and a code.

Field names prefixed with the entity (for example `countryGuid`, `countryName`) are acceptable.

Source: the API docs in `erp-docs/api` (branch `develop`), checked against the endpoints the frontend calls. These findings come from the docs, not from calls to the live API.

---

## 1. Endpoints to build (6)

These have no `/dropdown` endpoint documented yet.

| # | Dropdown | Current | Required |
|---|---|---|---|
| 1 | Learning Mode | `GET /api/v1/students/learning-mode/options` (fixed list, returns `value`, `label`) | `GET /api/v1/students/learning-mode/dropdown` (rename of `/options`) |
| 2 | Currency | `GET /api/v1/finance/currencies` | `GET /api/v1/finance/currencies/dropdown` |
| 3 | Bank | `GET /api/v1/finance/banks` | `GET /api/v1/finance/banks/dropdown` |
| 4 | Bank Branch | `GET /api/v1/finance/bank-branches` | `GET /api/v1/finance/bank-branches/dropdown` |
| 5 | GL Accounts | `GET /api/v1/finance/proc-gl-accounts` | `GET /api/v1/finance/proc-gl-accounts/dropdown` |
| 6 | Question Bank Category | `GET /api/v1/assessment/question-bank/categories` (fixed list of 3, returns `value`, `name`) | `GET /api/v1/assessment/question-bank/categories/dropdown` |

Items 1 and 6 are fixed lists with no GUID behind them. The backend team needs to decide what identifies each item in these two (for example, keep `value`).

---

## 2. Documentation cleanup

`get-batch-dropdown.md` and `get-batches-dropdown.md` (in `erp-docs/api/academic-service/academic/batches/`) both describe `GET /api/v1/academic/batches/dropdown`. Keep one and remove the other.

---

## 3. Optional: name or code missing

These existing `/dropdown` endpoints return a GUID but no name or no code field. They work as they are; adding the missing field would complete the standard.

| Endpoint | Missing |
|---|---|
| `/api/v1/users/countries/dropdown` | code |
| `/api/v1/academic/campus/dropdown` | code |
| `/api/v1/users/employees/dropdown` | code (employee ID) |
| `/api/v1/academic/batches/dropdown` | name |
| `/api/v1/finance/receipt-books/dropdown` | name |
| `/api/v1/admissions/enquiry-sources/dropdown` | code |
| `/api/v1/admissions/followup-modes/dropdown` | code |
| `/api/v1/admissions/interest-levels/dropdown` | code |

---

## Already in place (no action needed)

intakes, countries, batchtimes, campus, employees, batches, program-master, departments, proc-banks, receipt-books, discounts, enquiry-sources, follow-up-statuses, followup-modes and interest-levels all have a documented `/dropdown` endpoint.
