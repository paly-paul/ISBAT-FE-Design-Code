# GET /api/v1/finance/exchange-rates/{guid}

**API ID:** `finance-service.exchange-rates.get`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a single exchange rate by its GUID, with the currency denormalised onto the response.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `exchangeRateGuid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns an `ExchangeRateDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "exchangeRateGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "currencyGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currencyCode": "USD",
    "currencyName": "US Dollar",
    "exRate": 3750.0,
    "exDate": "2026-08-17T00:00:00"
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
| 404 | `not_found` | No exchange rate with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
