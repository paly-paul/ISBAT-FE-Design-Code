# PUT /api/v1/finance/payment-console/advance-deposit/{paymentAdvanceGuid}

**API ID:** `finance-service.payment-console.update-advance-deposit`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects an [advance deposit](./post-advance-deposit.md): amount, date, bank or remarks.

**The amount is frozen once any of the deposit has been drawn down.** If `balance < amount` — that is, an [other payment](./post-payment-other.md) has already been funded from it — the handler rejects an amount change and tells you to adjust the date, remarks or bank instead. To correct the amount on a drawn-down deposit, the drawdown payments have to be dealt with first.

Currency cannot be changed at all; it is not on the request.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentAdvanceGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "amount": 2500000,
  "payDate": "2026-08-17T00:00:00",
  "bankGuid": null,
  "remarks": "Corrected deposit amount"
}
```

`bankGuid` is the proc-bank identifier, named `procBankGuid` on [the create endpoint](./post-advance-deposit.md).

## Validation
`UpdateAdvanceDepositCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `paymentAdvanceGuid` (path) | must not be empty | |
| `amount` | must be > 0 | |
| `payDate` | required | |
| `bankGuid` | none | Nullable; existence checked in the handler |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Deposit must exist | 404 — `"Advance deposit not found."` |
| Amount is immutable once drawn against | 400 — `"This advance deposit has funds already drawn against it; its amount cannot be changed. Adjust the date/remarks/bank instead."` Fires only when `amount` differs from the stored value. |
| `bankGuid`, when supplied, must exist | 400 — `"Bank not found."` |
| Receipt book must still exist, match the pay type and be active | 404 `"Receipt book not found."`, or 400 `"Receipt book category does not match the payment type."` / `"Receipt book is not active."` |

## Response 200
Returns an `AdvanceDepositResultDto` as the `data` payload, with `message: "Advance deposit updated successfully."`.

```json
{
  "success": true,
  "data": {
    "paymentAdvanceGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "advPaymentCode": "ADV-2026-000317",
    "receipt": "CSH140091",
    "balance": 2500000
  },
  "message": "Advance deposit updated successfully.",
  "code": null,
  "errors": null
}
```

The original `receipt` stands — no new number is claimed.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above that maps to 400 |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Advance deposit or receipt book not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
