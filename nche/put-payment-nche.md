# PUT /api/v1/finance/nche/payment-nche/{paymentNcheGuid}

**API ID:** `erp-finance-service.nche.payment-nche.update`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Updates an existing NCHE payment record. Validates that the updated amount does not exceed the outstanding balance and is a multiple of the configured NCHE rate.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| paymentNcheGuid | Guid | Yes | The payment record GUID to update (must exist in database) |

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|

## Request body
```json
{
  "amount": 1000.00,
  "payDate": "2026-08-31T00:00:00Z",
  "pnrNumber": "string",
  "remarks": "string"
}
```

## Validation
Rules enforced by the FluentValidation validator in `Application/` (via `ValidationBehavior`). List every rule here, not just the "interesting" ones — this is what a frontend dev checks before wiring up client-side validation.

| Field | Rule | Notes |
|---|---|---|
| Amount | required, greater than 0 | Must be positive decimal and multiple of configured NCHE rate |
| PayDate | required | Must be a valid DateTime |
| PnrNumber | optional | Nullable string |
| Remarks | optional | Nullable string |
| Amount vs Balance | business validation | Updated amount must not exceed outstanding NCHE balance (excluding current payment) |

## Response 200
```json
{
  "paymentNcheGuid": "guid",
  "amount": 1000.00,
  "remainingBalance": 5000.00
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | ValidationError | One or more fields failed validation (see table above) |
| 404 | NotFound | Payment record not found |
| 400 | BusinessError | Amount exceeds outstanding NCHE balance or is not a multiple of the configured rate |

## Used by pages
| Page | Route |
|---|---|
| [NCHE Payment Page](../../../pages/finance/nche-payment-page.md) | /finance/nche/payment |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
