# GET /api/v1/finance/payment-console/payment-history/{applicationGuid}

**API ID:** `finance-service.payment-console.payment-history`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns **one student's** complete payment history — tuition, other, NCHE, guild and advance deposits merged into a single chronological list, each row tagged with its `category`. This is the history panel on the payment console.

Note the route collision to watch for: this path with an `{applicationGuid}` is the per-student history, while the **same path without one** ([GET /payment-console/payment-history](./get-payment-receipts.md)) is the institution-wide, searchable receipt register. Different endpoints, different response shapes.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |

## Query params
None — unpaged and unfiltered; the full history comes back in one call.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<PaymentHistoryDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "paymentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "category": 1,
      "paymentCode": "PAY-2026-004182",
      "payDate": "2026-08-17T00:00:00",
      "amount": 1200000,
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "receipt": "CSH140086",
      "receiptBookGuid": "…",
      "bookCode": "RB-CASH-01",
      "payType": { "value": 1, "name": "Cash" }
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `category` | `PaymentHistoryCategory`: `1` Tuition, `2` Other, `3` Nche, `4` Guild, `5` Advance. Note this has **five** members — one more than `PaymentGroupCategory` used elsewhere, because advance deposits appear in history but are not a payable category. |
| `paymentGuid` | The identifier **within that category's table** — pass it to [paid-ledgers](./get-paid-ledgers-by-payment.md) or [refunds](./get-refunds-by-payment.md) only for tuition rows (`category: 1`) |
| `payType` | An object (`{ value, name }`), not a bare number. **Null for NCHE and guild rows**, whose tables have no pay-type column. |
| `currencyGuid` / `currencyName` | Likewise null for NCHE and guild rows |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No payment history found."` — the student has never paid. A normal state; don't present it as a failure. |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
