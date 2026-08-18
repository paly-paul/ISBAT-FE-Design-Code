# PUT /api/v1/finance/payment-console/payment-other/{paymentOtherGuid}

**API ID:** `finance-service.payment-console.update-payment-other`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects an "other fee" payment: amount, date, bank or remarks. The fee type (`ledgerOthersGuid`) and currency are **not** on the request and cannot be changed — to move a payment to a different fee type, reverse it and re-enter.

A payment funded from an [advance deposit](./post-advance-deposit.md) cannot be edited here (`advance: 1` on [GET /payment-others](../payments/get-payment-others.md)); adjust the deposit instead.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentOtherGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "amount": 60000,
  "payDate": "2026-08-17T00:00:00",
  "bankGuid": null,
  "remarks": "Corrected amount"
}
```

`bankGuid` is the proc-bank identifier, named `procBankGuid` on [the create endpoint](./post-payment-other.md).

## Validation
`UpdatePaymentOtherCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `paymentOtherGuid` (path) | must not be empty | |
| `amount` | must be > 0 | |
| `payDate` | required | |
| `bankGuid` | none | Nullable; existence checked in the handler |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Payment must exist | 404 — `"Other payment not found."` |
| Must not be advance-funded | 400 — `"This payment is funded from an advance deposit and cannot be edited directly. Adjust the advance deposit instead."` |
| `bankGuid`, when supplied, must exist | 400 — `"Bank not found."` |
| Receipt book must still exist, match the pay type and be active | 404 `"Receipt book not found."`, or 400 `"Receipt book category does not match the payment type."` / `"Receipt book is not active."` |

## Response 200
Returns a `PaymentOtherResultDto` as the `data` payload — same shape as [the create endpoint](./post-payment-other.md), with `message: "Other payment updated successfully."`.

```json
{
  "success": true,
  "data": {
    "paymentOtherGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentCode": "OTH-2026-000914",
    "receipt": "CSH140093",
    "amount": 60000
  },
  "message": "Other payment updated successfully.",
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
| 404 | `not_found` | Payment or receipt book not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
