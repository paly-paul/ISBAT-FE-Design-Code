# PUT /api/v1/finance/payment-console/payment-guild/{paymentGuildGuid}

**API ID:** `finance-service.payment-console.update-payment-guild`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects a guild fee payment: amount, date or bank deposit reference. As on [the create endpoint](./post-payment-guild.md), the new amount must be a whole multiple of the configured per-semester guild rate and fit the outstanding balance, which is recomputed excluding this payment.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentGuildGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "amount": 30000,
  "payDate": "2026-08-17T00:00:00",
  "bankDeposit": "DEP-556102"
}
```

## Validation
`UpdatePaymentGuildCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `paymentGuildGuid` (path) | must not be empty | |
| `amount` | must be > 0 | The multiple-of-rate rule is handler-level |
| `payDate` | required | |
| `bankDeposit` | none | Nullable free text; no length or format check |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Payment must exist | 404 — `"Guild payment not found."` |
| Application must exist | 404 — `"Application not found."` |
| Application must have a program | 400 — `"Program not assigned to this application."` |
| Program must have a semester count configured | 400 — `"Program semester count is not configured."` |
| Guild rate must be configured | 400 — `"Guild rate is not configured."` |
| Amount must not exceed the outstanding guild balance | 400 — `"Amount exceeds the outstanding Guild fee balance."` |
| Amount must be a whole multiple of the rate | 400 — `"Amount must be a multiple of {rate}."` |

The intake check present on create is not repeated here.

## Response 200
Returns a `PaymentGuildResultDto` as the `data` payload, with `message: "Guild payment updated successfully."`.

```json
{
  "success": true,
  "data": {
    "paymentGuildGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 30000,
    "remainingBalance": 30000
  },
  "message": "Guild payment updated successfully.",
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
| 404 | `not_found` | Guild payment or application not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
