# POST /api/v1/finance/payment-console/payment-nche

**API ID:** `finance-service.payment-console.create-payment-nche`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records an NCHE fee payment — the statutory per-semester levy remitted to the National Council for Higher Education.

Unlike tuition and other payments, this one takes **no currency, no receipt book and no bank**: NCHE rows have none of those columns, and no receipt number is claimed. The amount is charged at a fixed per-semester rate from [GenSets](../gen-sets/get-gen-sets.md), and must be an exact multiple of that rate — the endpoint is designed for paying whole semesters, not arbitrary sums.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "amount": 40000,
  "payDate": "2026-08-17T00:00:00",
  "pnrNumber": "PNR-88213",
  "remarks": null
}
```

## Validation
`CreatePaymentNcheCommandValidator` — only three rules; everything else is enforced by the handler:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `amount` | must be > 0 | The multiple-of-rate rule is handler-level, not here |
| `payDate` | required | |
| `studentGuid` | none | Nullable |
| `pnrNumber` | none | Nullable free text — the NCHE portal reference. **No length or format check.** |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Application must exist | 404 — `"Application not found."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |
| Application must have a program | 400 — `"Program not assigned to this application."` |
| Program must have a semester count configured | 400 — `"Program semester count is not configured."` |
| NCHE rate must be configured | 400 — `"NCHE rate is not configured."` — a missing GenSet; see [GET /gen-sets](../gen-sets/get-gen-sets.md) |
| Amount must not exceed the outstanding NCHE balance | 400 — `"Amount exceeds the outstanding NCHE balance."` The total due is rate × semester count. |
| Amount must be a whole multiple of the rate | 400 — `"Amount must be a multiple of {rate}."` So paying two semesters at once is fine; paying half a semester is not. |

## Response 201
Returns a `PaymentNcheResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "paymentNcheGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 40000,
    "remainingBalance": 60000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`remainingBalance` is what is still owed on NCHE after this payment. There is no `receipt` field — none is issued.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above — read `errors` for which |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
