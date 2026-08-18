# POST /api/v1/finance/payment-console/advance-deposit

**API ID:** `finance-service.payment-console.create-advance-deposit`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Takes money from a student **ahead of any specific fee** and holds it as a credit. A receipt is issued at deposit time; the balance is later drawn down by [other payments](./post-payment-other.md) passing this deposit's `paymentAdvanceGuid`, which issue no further receipt.

Deposits are also created automatically: when a [tuition payment](./post-payment.md) overpays what is outstanding, the surplus becomes an advance and is reported in that call's `advanceMessage`.

**Not idempotent** — every call claims a receipt number permanently.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "amount": 2000000,
  "currencyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptBookGuid": "…",
  "payDate": "2026-08-17T00:00:00",
  "payType": 1,
  "procBankGuid": null,
  "remarks": null
}
```

The payload is identical to [POST /payment-console/payments](./post-payment.md) — the difference is only that `amount` must be strictly positive here.

## Validation
`CreateAdvanceDepositCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `studentGuid` | none | Nullable |
| `amount` | must be > 0 | Stricter than the tuition endpoint, which allows `0` |
| `currencyGuid` | required, must not be empty | The deposit is held in this currency; drawdowns convert against it |
| `receiptBookGuid` | required, must not be empty | A number is claimed from this book |
| `payDate` | required | Fixes the exchange rate used for the deposit's base-currency value |
| `payType` | must be a defined `EnumPaymentType` value | Byte. Message: `"Invalid payment type."` |
| `procBankGuid` | required when `payType != 1` (Cash) | Message: `"Bank account is required for non-cash payments."` |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Receipt book must exist | 404 — `"Receipt book not found."` |
| Book category must match `payType` | 400 — `"Receipt book category does not match the selected payment type."` |
| Book must be active | 400 — `"Receipt book is not active."` |
| Claim must succeed | 400 — `"Receipt book is exhausted or no longer active."` |
| Currency must exist | 404 — `"Currency not found."` |
| `procBankGuid`, when supplied, must exist | 400 — `"Bank not found."` |
| Application must exist | 404 — `"Application not found."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |

Note there is **no fee-structure requirement** — a deposit can be taken from an application with no `feeHdGuid`, unlike a tuition payment.

## Response 201
Returns an `AdvanceDepositResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "paymentAdvanceGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "advPaymentCode": "ADV-2026-000317",
    "receipt": "CSH140091",
    "balance": 2000000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`balance` equals `amount` on creation and falls as the deposit is drawn down. Once it drops below `amount`, the deposit's amount can no longer be edited — see [PUT /payment-console/advance-deposit/{guid}](./put-advance-deposit.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above that maps to 400 |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Receipt book, currency or application not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
