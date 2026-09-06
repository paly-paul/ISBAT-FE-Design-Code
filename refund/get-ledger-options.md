# GET /api/v1/finance/refund/ledger-options/{applicationGuid}

**API ID:** `finance-service.refund.ledger-options.list`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Lists the ledgers a given application has actually paid into — the picker a frontend uses before calling [POST /refund/applications/{applicationGuid}](./post-refund.md) with a `ledgerGuid`. Built from distinct, non-deleted `T_PAYMENT_LEDGER` rows for the application, resolved to each ledger's name/guid.

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
Returns a `List<LedgerOptionDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    { "ledgerGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "ledgerName": "Admission Fee" },
    { "ledgerGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "ledgerName": "Tuition Fee" }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No paid ledgers found for this application."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-05 | Nebu Salim | Initial version created |
