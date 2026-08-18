# POST /api/v1/finance/payment-console/payment-guild

**API ID:** `finance-service.payment-console.create-payment-guild`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records a guild fee payment — the per-semester student guild levy. Structurally identical to [POST /payment-console/payment-nche](./post-payment-nche.md): no currency, no receipt book, no bank, no receipt claimed, and the amount must be a whole multiple of the per-semester guild rate configured in [GenSets](../gen-sets/get-gen-sets.md).

The only difference in the payload is `bankDeposit` (a deposit-slip reference) where NCHE has `pnrNumber`.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "amount": 20000,
  "payDate": "2026-08-17T00:00:00",
  "bankDeposit": "DEP-556102"
}
```

## Validation
`CreatePaymentGuildCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `amount` | must be > 0 | The multiple-of-rate rule is handler-level |
| `payDate` | required | |
| `studentGuid` | none | Nullable |
| `bankDeposit` | none | Nullable free text — the bank deposit slip reference. **No length or format check.** |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Application must exist | 404 — `"Application not found."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |
| Application must have a program | 400 — `"Program not assigned to this application."` |
| Program must have a semester count configured | 400 — `"Program semester count is not configured."` |
| Guild rate must be configured | 400 — `"Guild rate is not configured."` |
| Amount must not exceed the outstanding guild balance | 400 — `"Amount exceeds the outstanding Guild fee balance."` Total due is rate × semester count. |
| Amount must be a whole multiple of the rate | 400 — `"Amount must be a multiple of {rate}."` |

## Response 201
Returns a `PaymentGuildResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "paymentGuildGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 20000,
    "remainingBalance": 40000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`remainingBalance` is what is still owed on guild fees after this payment. No `receipt` field — none is issued.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
