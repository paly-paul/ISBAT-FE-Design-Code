# PUT /api/v1/finance/payment-console/payments/{paymentGuid}

**API ID:** `finance-service.payment-console.update-payment`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects a **tuition** payment: its amount, date, bank or remarks. Changing the amount re-runs the allocation engine, so the payment's ledger lines are rewritten.

Two conditions make a payment permanently uneditable, and both are worth checking before offering an edit button:

- it was funded from an [advance deposit](./post-advance-deposit.md) (`advance: 1` on [GET /payments](../payments/get-payments.md)) — edit the deposit instead;
- it has any [refund](./get-refunds-by-payment.md) attached.

**Cascading.** Because allocation is oldest-first, changing an earlier payment's amount invalidates how later payments were allocated. `cascadeToLaterPayments` controls what happens then: `true` re-allocates the student's subsequent payments to stay consistent, `false` leaves them as they are. Send `true` unless you specifically intend to leave later allocations untouched.

The receipt number is **not** reissued — the original stands.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "amount": 1000000,
  "payDate": "2026-08-17T00:00:00",
  "bankGuid": null,
  "remarks": "Corrected amount",
  "cascadeToLaterPayments": true
}
```

Note the field is `bankGuid` here, not `procBankGuid` as on [POST /payment-console/payments](./post-payment.md) — the same proc-bank identifier under a different name.

## Validation
`UpdatePaymentCommandValidator` — much thinner than the create validator; there is no `payType`, `currencyGuid` or `receiptBookGuid` on this request at all, so none of those can be changed:

| Field | Rule | Notes |
|---|---|---|
| `paymentGuid` (path) | must not be empty | |
| `amount` | must be ≥ 0 | Zero allowed, matching create |
| `payDate` | required | |
| `bankGuid` | none | Nullable; existence checked in the handler |
| `remarks` | none | Nullable free text |
| `cascadeToLaterPayments` | none | Non-nullable bool; omission binds to `false` |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Payment must exist | 404 — `"Payment not found."` |
| Must not be advance-funded | 400 — `"This payment is linked to an advance deposit and cannot be edited directly. Adjust the advance deposit instead."` |
| Must have no refund | 400 — `"This payment has an associated refund and cannot be edited."` |
| `bankGuid`, when supplied, must exist | 400 — `"Bank not found."` |
| Receipt book must still exist, match the pay type and be active | 404 `"Receipt book not found."`, or 400 `"Receipt book category does not match the payment type."` / `"Receipt book is not active."` — re-checked even though no new number is claimed |
| Cascade must succeed | 400 carrying the cascade error, when `cascadeToLaterPayments` is `true` and re-allocating later payments fails |

## Response 200
Returns a `PaymentResultDto` as the `data` payload — same shape as [POST /payment-console/payments](./post-payment.md), with `message: "Payment updated successfully."`.

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
  "message": "Payment updated successfully.",
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
