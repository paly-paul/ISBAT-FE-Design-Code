# GET /api/v1/finance/refund/by-application/{applicationGuid}

**API ID:** `finance-service.payment-console.refunds-by-payment`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns every refund issued against one **application**, across every ledger it was ever refunded on. A refund is scoped by `(applicationGuid, ledgerGuid)`, not by an individual payment — see [POST /refund/applications/{applicationGuid}](./post-refund.md).

Any ledger with a refund here is **locked for editing** — [PUT /payment-console/payments/{paymentGuid}](../payment-console/put-payment.md) rejects an edit on any payment whose own ledger lines include a ledger that has a matching `(applicationGuid, ledger)` refund.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | The application, not a payment |

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

Each row is one `(applicationGuid, ledgerGuid)` refund. An application can have at most one refund per ledger, ever (see [POST /refund/applications/{applicationGuid}](./post-refund.md)), so this list has at most one row per distinct `ledgerGuid`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No refunds found for this application."` — the usual case for an application with no refunds. Treat it as "no refunds", not an error. |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
| 2026-09-05 | Nebu Salim | **Moved** from `payment-console/get-refunds-by-payment.md` to `refund/get-refunds-by-application.md` (API ID unchanged, per contributing rule 5). Route changed from `GET /payment-console/refunds/{paymentGuid}` to `GET /refund/by-application/{applicationGuid}` — refunds are no longer scoped to a single payment. Previously: path param was `paymentGuid`; a payment could be refunded more than once (each partial refund its own row); 404 message was `"No refunds found for this payment."`. Now: scoped to `(applicationGuid, ledgerGuid)` instead — at most one refund per ledger per application, ever. |
