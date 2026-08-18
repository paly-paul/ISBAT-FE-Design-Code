# GET /api/v1/finance/payment-console/refunds/{paymentGuid}

**API ID:** `finance-service.payment-console.refunds-by-payment`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns every refund issued against one tuition payment. A payment can be refunded more than once (each partial refund is its own row), so sum `amount` across the list to get the total refunded.

Any result here means the payment is **locked for editing** — [PUT /payment-console/payments/{paymentGuid}](./put-payment.md) rejects a payment that has an associated refund.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentGuid` | Guid | Yes | A **tuition** payment GUID |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<RefundDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "refundGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "refundDate": "2026-08-17T00:00:00",
      "amount": 300000,
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "ledgerGuid": "…",
      "ledgerName": "Tuition Fee",
      "remarks": "Withdrawal before census date"
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

`ledgerGuid` is the allocation line the refund reverses — refunds are always issued against a single line, which is why a payment spread across several ledgers cannot be refunded at all (see [POST /payment-console/payments/{paymentGuid}/refund](./post-payment-refund.md)).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No refunds found for this payment."` — the usual case for an untouched payment. Treat it as "no refunds", not an error. |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
