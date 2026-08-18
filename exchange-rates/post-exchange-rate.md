# POST /api/v1/finance/exchange-rates

**API ID:** `finance-service.exchange-rates.create`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Records the exchange rate for one currency on one date. At most one rate may exist per (currency, date) pair. `exDate` is stored **date-only** (the time component is stripped), so two posts on the same calendar day collide regardless of the times sent.

Rates cannot be back-dated *forward*: `exDate` may be today or earlier, never in the future. Combined with [PUT](./put-exchange-rate.md) only accepting today's rows, a historical rate entered with the wrong value can be corrected only by [deleting](./delete-exchange-rate.md) it and re-creating it.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "currencyGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "exRate": 3750.0,
  "exDate": "2026-08-17T00:00:00"
}
```

## Validation
`CreateExchangeRateCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `currencyGuid` | required, must not be empty | Message: `"Currency is required."` Existence checked in the handler. |
| `exRate` | must be > 0 | Message: `"Exchange rate must be greater than zero."` |
| `exDate` | required | |
| `exDate` | must be ≤ today (UTC date) | Message: `"Exchange date cannot be in the future."` |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| `currencyGuid` must resolve to an existing currency | 404 `not_found` — `"Currency not found."` |
| One rate per (currency, date) | 400 — `"An exchange rate for this currency and date already exists."` Pre-check with [GET /exchange-rates/exists](./get-exchange-rate-exists.md). |

## Response 201
Returns the created `ExchangeRateDto` as the `data` payload (same shape as [GET /exchange-rates/{guid}](./get-exchange-rate-by-guid.md)), with `message: "Exchange rate created successfully."`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | A rate already exists for this currency and date |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `currencyGuid` does not match an existing currency |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
