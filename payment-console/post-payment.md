# POST /api/v1/finance/payment-console/payments

**API ID:** `finance-service.payment-console.create-payment`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records a **tuition** payment. The handler claims a receipt number from the given book, runs the allocation engine to spread the amount across the student's outstanding ledgers oldest-first (applying any [discount](./get-discount-info.md) and rounding lines), and writes the payment header plus its allocation lines in one transaction.

Preview the allocation with [GET /payment-console/payable-ledgers](./get-payable-ledgers.md) using the identical `amount`, `currencyGuid` and `payDate` before posting — allocation is recomputed here, so a concurrent payment can change the outcome.

**Not idempotent.** Every call consumes a receipt number permanently. On a timeout, check [the payment history](./get-payment-history.md) before retrying.

If the amount exceeds what is outstanding, the surplus is turned into an advance deposit and reported back in `advanceMessage` rather than being rejected.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "amount": 1200000,
  "currencyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptBookGuid": "…",
  "payDate": "2026-08-17T00:00:00",
  "payType": 1,
  "procBankGuid": null,
  "remarks": null
}
```

## Validation
`CreatePaymentCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `studentGuid` | none | Nullable — omit for an applicant who is not yet a student |
| `amount` | must be ≥ 0 | **Zero is allowed** here (unlike every other create in this module, which requires > 0) — it exists to book a pure-discount settlement that moves no cash |
| `currencyGuid` | required, must not be empty | |
| `receiptBookGuid` | required, must not be empty | A number is claimed from this book |
| `payDate` | required | Determines which day's exchange rates apply |
| `payType` | must be a defined `EnumPaymentType` value | Sent as a **byte**: `1` Cash, `2` Cheque, `3` Bank, `4` DemandDraft, `5` Online. Message: `"Invalid payment type."` |
| `procBankGuid` | required when `payType != 1` (Cash) | Message: `"Bank account is required for non-cash payments."` |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Application must exist | 404 — `"Application not found."` |
| Application must have a fee structure | 400 — `"Fee structure not assigned to this application."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |
| Currency must exist | 404 — `"Currency not found."` |
| `procBankGuid`, when supplied, must exist | 400 — `"Bank not found."` |
| Receipt book must exist | 404 — `"Receipt book not found."` |
| Receipt book category must match `payType` | 400 — `"Receipt book category does not match the selected payment type."` Use a Cash book (`category: 0`) for `payType: 1`, a Bank book (`category: 1`) otherwise. |
| Receipt book must be active | 400 — `"Receipt book is not active."` |
| Receipt claim must succeed | 400 — `"Receipt book is exhausted or no longer active."` (re-checked atomically at claim time) |
| Fee structure must have lines | 404 — `"No fee structure lines found."` |
| Something must be outstanding | 404 — `"No outstanding ledgers found."` |
| Allocation must produce lines | 400 — `"No ledgers could be allocated for this payment."` |

## Response 201
Returns a `PaymentResultDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "paymentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentCode": "PAY-2026-004182",
    "receipt": "CSH140086",
    "balance": 0,
    "advanceMessage": null
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `receipt` | The receipt number consumed from the book — print this |
| `balance` | Amount left unallocated after settling outstanding ledgers |
| `advanceMessage` | Set when `balance > 0` and the surplus was booked as an advance deposit. Show it to the cashier; a non-null value here is not an error. |

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above that maps to 400 — read `errors` for which |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Application, currency, receipt book, fee lines or outstanding ledgers not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
