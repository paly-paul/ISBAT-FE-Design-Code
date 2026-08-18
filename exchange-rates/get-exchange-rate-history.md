# GET /api/v1/finance/exchange-rates/history

**API ID:** `finance-service.exchange-rates.history`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Paged, filterable history of exchange rates across dates and currencies. This is the endpoint behind the rate-history grid; [GET /exchange-rates](./get-exchange-rates-by-date.md) is the single-day board.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `currencyGuid` | Guid | No | Filter to one currency. Omit for all currencies. |
| `fromDate` | DateTime | No | Inclusive lower bound on `exDate` |
| `toDate` | DateTime | No | Inclusive upper bound on `exDate` |
| `page` | int | No | 1-based page index. Defaults to `1`. |
| `pageSize` | int | No | Items per page. Defaults to `10`. No upper bound enforced. |

## Request body
None.

## Validation
None — no validator is registered, so an inverted `fromDate`/`toDate` range is accepted and simply returns no rows.

## Response 200
Returns a `PagedResult<ExchangeRateDto>` as the `data` payload. Unlike [GET /exchange-rates](./get-exchange-rates-by-date.md), an empty result here is a normal 200 with `items: []`, not a 404.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "exchangeRateGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "currencyGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "currencyCode": "USD",
        "currencyName": "US Dollar",
        "exRate": 3750.0,
        "exDate": "2026-08-17T00:00:00"
      }
    ],
    "totalCount": 412,
    "pageNumber": 1,
    "pageSize": 10
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

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
