# POST /api/v1/finance/other-payment

**API ID:** `finance-service.payment-console.create-payment-other`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records a payment for a non-tuition fee — ID replacement, transcript, lateral-entry fee and so on — against **one or more** entries from the [ledger-others catalogue](../payment-console/get-ledger-others.md) via `lines`. A single receipt/advance draw covers the whole request, however many lines it has — e.g. one payment can pay a hostel fee and a library fine together under one receipt number.

This endpoint has **two funding modes**, and which one you are in changes what the request must contain:

| Mode | Trigger | Behavior |
|---|---|---|
| **Cash/bank** | `paymentAdvanceGuid` omitted | A receipt number is claimed; `receiptBookGuid` is required, and `procBankGuid` too unless paying cash |
| **From advance** | `paymentAdvanceGuid` supplied | Draws down an existing [advance deposit](../advance-payment/post-advance-deposit.md). **No receipt is issued** and no book or bank is needed — the money was already receipted when deposited. |

In advance mode the **total** across all `lines` is converted between the payment currency and the advance's currency, so both must have an exchange rate on `payDate` or the call is rejected.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "lines": [
    { "ledgerOthersGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "amount": 50000 }
  ],
  "currencyGuid": "…",
  "payDate": "2026-08-17T00:00:00",
  "payType": 1,
  "remarks": "Replacement ID card",
  "receiptBookGuid": "…",
  "procBankGuid": null,
  "paymentAdvanceGuid": null
}
```

Multiple ledgers under one payment/receipt — `lines` just carries more entries:

```json
{
  "lines": [
    { "ledgerOthersGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "amount": 30000 },
    { "ledgerOthersGuid": "6f8e2c1d-9b4a-4e7f-8c3d-1a2b3c4d5e6f", "amount": 20000 }
  ]
}
```

## Validation
`CreatePaymentOtherCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `studentGuid` | none | Nullable |
| `lines` | must not be empty | Message: `"At least one ledger line is required."` |
| `lines` | no duplicate `ledgerOthersGuid` within the list | Message: `"Duplicate ledgers are not allowed within the same payment."` |
| `lines[].ledgerOthersGuid` | required, must not be empty | From [GET /payment-console/ledger-others](../payment-console/get-ledger-others.md) — **not** a tuition `ledgerGuid` |
| `lines[].amount` | must be > 0 | Zero is rejected here, unlike on [tuition payments](../payment-console/post-payment.md) |
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
| Every `lines[].ledgerOthersGuid` must exist | 404 — `"Ledger not found."` (checked as one batch lookup, not per line) |
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
Returns a `PaymentOtherResultDto` as the `data` payload. `amount` is the **sum of all `lines`**, not any single line — to see the per-ledger breakdown, look up the payment via [GET /other-payment](./get-payment-others.md) (its `ledgers` array).

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
| 2026-09-05 | Nebu Salim | **Moved** from `payment-console/post-payment-other.md` to `other-payment/post-payment-other.md` and route changed from `POST /api/v1/finance/payment-console/payment-other` to `POST /api/v1/finance/other-payment` (API ID unchanged, per contributing rule 5). Other-payment is now a standalone feature folder. |
| 2026-09-10 | Nebu Salim | A payment can now cover multiple ledgers in one transaction, mirroring how tuition payments already work. Request body's flat `ledgerOthersGuid` + `amount` fields replaced by `lines: [{ ledgerOthersGuid, amount }]` (one or more); response `amount` is now the sum of those lines. Added two new validation rules (`lines` non-empty, no duplicate `ledgerOthersGuid` within `lines`). Backed by a new `T_PAYMENT_OTHERS_LEDGER` line table. |
