# POST /api/v1/finance/nche/payment-nche

**API ID:** `erp-finance-service.nche.payment-nche.create`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Creates a new NCHE payment record for an application. Validates that the payment amount does not exceed the outstanding balance and is a multiple of the configured NCHE rate.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|

## Request body
```json
{
  "applicationGuid": "guid",
  "studentGuid": "guid",
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
| ApplicationGuid | required | Must be a valid GUID |
| Amount | required, greater than 0 | Must be positive decimal and multiple of configured NCHE rate |
| PayDate | required | Must be a valid DateTime |
| StudentGuid | optional | Nullable GUID |
| PnrNumber | optional | Nullable string |
| Remarks | optional | Nullable string |
| Amount vs Balance | business validation | Amount must not exceed outstanding NCHE balance (calculated as rate × program semester count - paid amount) |

## Response 201
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
| 404 | NotFound | Application not found or program/intake not assigned |
| 400 | BusinessError | Amount exceeds outstanding NCHE balance or is not a multiple of the configured rate |

## Used by pages
| Page | Route |
|---|---|
| [NCHE Payment Page](../../../pages/finance/nche-payment-page.md) | /finance/nche/payment |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
