# GET /api/v1/finance/exchange-rates/exists

**API ID:** `finance-service.exchange-rates.exists`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Answers "does a rate already exist for this currency on this date?" — the pre-check the rate-entry form runs before [POST /exchange-rates](./post-exchange-rate.md), which rejects duplicates outright. When a rate does exist it also returns the existing GUID and value, so the form can switch from create to [update](./put-exchange-rate.md) without a second call.

**Absence is not an error here.** No rate returns a 200 with `exists: false`, not a 404 — unlike [GET /exchange-rates](./get-exchange-rates-by-date.md).

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `currencyGuid` | Guid | **Yes** | Non-optional binding — omitting it fails binding with a 400 before the handler runs |
| `date` | DateTime | **Yes** | Non-optional; matched against `exDate` |

## Request body
None.

## Validation
None beyond query-parameter binding.

## Response 200
Returns an `ExchangeRateExistsDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

Rate found:

```json
{
  "success": true,
  "data": {
    "exists": true,
    "exchangeRateGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "exRate": 3750.0
  },
  "message": null,
  "code": null,
  "errors": null
}
```

No rate for that currency/date — still a success:

```json
{
  "success": true,
  "data": { "exists": false, "exchangeRateGuid": null, "exRate": null },
  "message": null,
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (binding) | `currencyGuid` or `date` missing or unparseable |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | **The currency** doesn't exist — this 404 is about `currencyGuid`, never about the rate |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
