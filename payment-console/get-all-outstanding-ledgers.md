# GET /api/v1/finance/payment-console/outstanding-all/{applicationGuid}

**API ID:** `finance-service.payment-console.outstanding-all`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns everything the student owes across **all four fee categories** — tuition, other, NCHE and guild — in one flat list, each row tagged with its `category`. This is what feeds the [unified payment](./post-unified-payment.md) screen, where the cashier settles several categories in a single transaction.

[GET /payment-console/outstanding-ledgers/{applicationGuid}](./get-outstanding-ledgers.md) is the tuition-only, semester-scoped view; this one is the whole picture.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |

## Query params
None — unlike the tuition-only endpoint, this one takes no `studentGuid`.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<AllOutstandingItemDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "category": 1,
      "ledgerGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "semesterGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "description": "Tuition Fee",
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "outstanding": 900000
    },
    {
      "category": 3,
      "ledgerGuid": null,
      "semesterGuid": null,
      "description": "NCHE Fee",
      "currencyGuid": null,
      "currencyName": null,
      "outstanding": 20000
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `category` | `PaymentGroupCategory`: `1` Tuition, `2` Other, `3` Nche, `4` Guild |
| `ledgerGuid` / `semesterGuid` | Populated for tuition rows; **null for NCHE and guild**, which are not ledger-based |
| `currencyGuid` / `currencyName` | Likewise null for NCHE and guild, whose source tables hold no currency |

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | `"Fee structure not assigned to this application."` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."` or `"No outstanding fees found."` — the latter meaning nothing is owed at all |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
