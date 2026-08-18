# POST /api/v1/finance/payment-console/payment-other

**API ID:** `finance-service.payment-console.create-payment-other`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records a payment for a non-tuition fee — ID replacement, transcript, lateral-entry fee and so on — against one entry from the [ledger-others catalogue](./get-ledger-others.md).

This endpoint has **two funding modes**, and which one you are in changes what the request must contain:

| Mode | Trigger | Behavior |
|---|---|---|
| **Cash/bank** | `paymentAdvanceGuid` omitted | A receipt number is claimed; `receiptBookGuid` is required, and `procBankGuid` too unless paying cash |
| **From advance** | `paymentAdvanceGuid` supplied | Draws down an existing [advance deposit](./post-advance-deposit.md). **No receipt is issued** and no book or bank is needed — the money was already receipted when deposited. |

In advance mode the amount is converted between the payment currency and the advance's currency, so both must have an exchange rate on `payDate` or the call is rejected.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "ledgerOthersGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 50000,
  "currencyGuid": "…",
  "payDate": "2026-08-17T00:00:00",
  "payType": 1,
  "remarks": "Replacement ID card",
  "receiptBookGuid": "…",
  "procBankGuid": null,
  "paymentAdvanceGuid": null
}
```

## Validation
`CreatePaymentOtherCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `studentGuid` | none | Nullable |
| `ledgerOthersGuid` | required, must not be empty | From [GET /payment-console/ledger-others](./get-ledger-others.md) — **not** a tuition `ledgerGuid` |
| `amount` | must be > 0 | Zero is rejected here, unlike on [tuition payments](./post-payment.md) |
| `currencyGuid` | required, must not be empty | |
| `payDate` | required | |
| `payType` | must be a defined `EnumPaymentType` value | Byte. Message: `"Invalid payment type."` |
| `receiptBookGuid` | required **only when** `paymentAdvanceGuid` is null | Message: `"Receipt book is required unless the payment is funded from an advance."` |
| `procBankGuid` | required **only when** `paymentAdvanceGuid` is null **and** `payType != 1` (Cash) | Message: `"Bank account is required for non-cash payments."` |
| `paymentAdvanceGuid` | none | Nullable; presence switches the endpoint into advance mode |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| `ledgerOthersGuid` must exist | 404 — `"Ledger not found."` |
| Currency must exist | 404 — `"Currency not found."` |
| Application must exist | 404 — `"Application not found."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |
| **Advance mode:** deposit must exist | 404 — `"Advance deposit not found."` |
| **Advance mode:** deposit must have balance | 400 — `"Advance balance is exhausted."` |
| **Advance mode:** amount must fit the balance | 400 — `"Amount exceeds the available advance balance."` |
| **Advance mode:** base currency must be configured | 400 — `"Base currency is not configured."` (no currency flagged `isDefault`) |
| **Advance mode:** rate needed for the payment currency | 400 — `"Today's exchange rate has not been entered for the payment currency on {date}. Please add it before proceeding."` Enter it via [POST /exchange-rates](../exchange-rates/post-exchange-rate.md). |
| **Advance mode:** rate needed for the advance currency | 400 — same message, `"…for the advance currency on {date}…"` |
| **Cash mode:** receipt book must exist | 404 — `"Receipt book not found."` |
| **Cash mode:** book category must match `payType` | 400 — `"Receipt book category does not match the selected payment type."` |
| **Cash mode:** book must be active | 400 — `"Receipt book is not active."` |
| **Cash mode:** claim must succeed | 400 — `"Receipt book is exhausted or no longer active."` |
| **Cash mode:** `procBankGuid`, when supplied, must exist | 400 — `"Bank not found."` |

## Response 201
Returns a `PaymentOtherResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "paymentOtherGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentCode": "OTH-2026-000914",
    "receipt": "CSH140093",
    "amount": 50000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`receipt` is **null in advance mode** — no number is claimed. Don't offer a receipt print in that case.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any business rule above that maps to 400 |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Ledger, currency, application, advance deposit or receipt book not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
