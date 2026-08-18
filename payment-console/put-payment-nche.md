# PUT /api/v1/finance/payment-console/payment-nche/{paymentNcheGuid}

**API ID:** `finance-service.payment-console.update-payment-nche`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects an NCHE fee payment: amount, date, PNR number or remarks. The same rate rules as [the create endpoint](./post-payment-nche.md) apply — the new amount must still be a whole multiple of the configured per-semester NCHE rate and must fit within the outstanding balance, which is recomputed **excluding this payment** so raising or lowering it is possible either way.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentNcheGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "amount": 60000,
  "payDate": "2026-08-17T00:00:00",
  "pnrNumber": "PNR-88213",
  "remarks": null
}
```

## Validation
`UpdatePaymentNcheCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `paymentNcheGuid` (path) | must not be empty | |
| `amount` | must be > 0 | The multiple-of-rate rule is handler-level |
| `payDate` | required | |
| `pnrNumber` | none | Nullable free text; no length or format check |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Payment must exist | 404 — `"NCHE payment not found."` |
| Application must exist | 404 — `"Application not found."` |
| Application must have a program | 400 — `"Program not assigned to this application."` |
| Program must have a semester count configured | 400 — `"Program semester count is not configured."` |
| NCHE rate must be configured | 400 — `"NCHE rate is not configured."` |
| Amount must not exceed the outstanding NCHE balance | 400 — `"Amount exceeds the outstanding NCHE balance."` |
| Amount must be a whole multiple of the rate | 400 — `"Amount must be a multiple of {rate}."` |

Note the intake check present on create is **not** repeated here.

## Response 200
Returns a `PaymentNcheResultDto` as the `data` payload, with `message: "NCHE payment updated successfully."`.

```json
{
  "success": true,
  "data": {
    "paymentNcheGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 60000,
    "remainingBalance": 40000
  },
  "message": "NCHE payment updated successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above that maps to 400 |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | NCHE payment or application not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
