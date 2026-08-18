# GET /api/v1/finance/payment-console/advance-balance/{applicationGuid}

**API ID:** `finance-service.payment-console.advance-balance`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the student's undrawn advance-deposit balance, **broken down by currency** — a student who deposited in two currencies gets two rows. Use it to decide whether to offer "pay from advance" on an [other payment](./post-payment-other.md), and to show the cashier how much is available.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<AdvanceBalanceDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "currencyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "currencyName": "Uganda Shilling",
      "balance": 750000
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

`balance` is the sum of what is still undrawn across that currency's deposits. It is **not** tied to a single deposit — to draw from a specific one, pass that deposit's `paymentAdvanceGuid` on [POST /payment-console/payment-other](./post-payment-other.md), which enforces the per-deposit balance separately.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No advance balance found."` — the student has no advances, or all are fully drawn. The common case; treat it as "zero available", not an error. |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
