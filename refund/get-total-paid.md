# GET /api/v1/finance/refund/total-paid

**API ID:** `finance-service.refund.total-paid.get`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the total already paid into one ledger for one application — shown once a ledger is picked from [GET /refund/ledger-options/{applicationGuid}](./get-ledger-options.md), before submitting [POST /refund/applications/{applicationGuid}](./post-refund.md). Backed by the exact same calculation the refund itself validates against, so this number can never drift from what a refund attempt will actually enforce.

Sums `T_PAYMENT_LEDGER.AMTDEF` across every payment and every semester for the given application + ledger — **not filtered for soft-deleted payments or ledger lines**, matching the calculation [POST /refund/applications/{applicationGuid}](./post-refund.md) uses.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |
| `ledgerGuid` | Guid | Yes | |

## Request body
None.

## Validation
None.

## Response 200
Returns a `TotalPaidDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "amount": 200,
    "currencyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "currencyName": "US Dollars"
  },
  "message": null,
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Ledger not found."`, or `"No payments found for this application and ledger."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-05 | Nebu Salim | Initial version created |
