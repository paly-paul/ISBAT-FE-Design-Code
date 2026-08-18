# GET /api/v1/finance/exchange-rates

**API ID:** `finance-service.exchange-rates.list-by-date`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns **all** currencies' exchange rates for a single date — the "today's rates" board. Despite sitting on the collection root, this is a per-date lookup, not a paged list; use [GET /exchange-rates/history](./get-exchange-rate-history.md) for paging and ranges.

Rates are the pivot the payment console runs on: `CreatePaymentOther` and `CreateRefund` refuse to proceed when the payment date has no rate for the currencies involved.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `date` | DateTime | No | Defaults to **`DateTime.UtcNow`** when omitted — note that's the current UTC instant, not the server's local date |

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<ExchangeRateDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "exchangeRateGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "currencyGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "currencyCode": "USD",
      "currencyName": "US Dollar",
      "exRate": 3750.0,
      "exDate": "2026-08-17T00:00:00"
    }
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
| 404 | `not_found` | **No rates exist for that date.** An empty day is a 404, not a 200 with an empty array — handle it as "rates not entered yet", not as an error. |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
