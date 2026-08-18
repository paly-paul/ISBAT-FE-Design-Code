# POST /api/v1/finance/payment-console/payments/{paymentGuid}/refund

**API ID:** `finance-service.payment-console.create-refund`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Issues a refund against a **tuition** payment. The original payment is never amended or deleted — the refund is a separate offsetting row, which is why any refunded payment becomes permanently uneditable via [PUT /payment-console/payments/{paymentGuid}](./put-payment.md).

**Current limitation: only single-ledger payments can be refunded.** Tuition payments are normally spread across several ledgers by the allocation engine, and any such payment is rejected with `"Multi-ledger refunds are not yet supported."` In practice that means only payments that happened to settle exactly one ledger line are refundable today.

Partial refunds are allowed and may be repeated, up to the refundable balance. List what has already been refunded with [GET /payment-console/refunds/{paymentGuid}](./get-refunds-by-payment.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentGuid` | Guid | Yes | A **tuition** payment GUID |

## Query params
None.

## Request body
```json
{
  "amount": 300000,
  "refundDate": "2026-08-17T00:00:00",
  "remarks": "Withdrawal before census date"
}
```

## Validation
`CreateRefundCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `paymentGuid` (path) | must not be empty | |
| `amount` | must be > 0 | The refundable-balance ceiling is handler-level |
| `refundDate` | required | Determines which day's exchange rates apply |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Payment must exist | 404 — `"Payment not found."` |
| Payment must have exactly one allocation line | 400 — `"Multi-ledger refunds are not yet supported."` |
| Base currency must be configured | 400 — `"Base currency is not configured."` |
| Rate must exist for the payment currency on `refundDate` | 400 — `"Today's exchange rate has not been entered for the payment currency on {date}. Please add it before proceeding."` Enter it via [POST /exchange-rates](../exchange-rates/post-exchange-rate.md). |
| Rate must exist for the ledger currency on `refundDate` | 400 — same message, `"…for the ledger currency on {date}…"` |
| A usable rate must resolve | 400 — `"No exchange rate found for the payment currency on or before the refund date."` (or `"…for the ledger currency…"`) |
| Amount must not exceed the refundable balance | 400 — `"Refund amount exceeds the refundable balance."` The balance is the payment less refunds already issued. |
| Concurrent modification | 400 carrying the concurrency error — reload and retry |

## Response 201
Returns a `RefundResultDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "refundGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "paymentCode": "PAY-2026-004182",
    "receipt": "CSH140086",
    "remainingRefundableBalance": 900000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`receipt` echoes the **original payment's** receipt number — no new receipt is claimed for a refund. `remainingRefundableBalance` is what could still be refunded afterwards.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `amount` not greater than zero, or `refundDate` missing |
| 400 | (generic failure) | Any business rule above — read `errors` for which |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Payment not found."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
