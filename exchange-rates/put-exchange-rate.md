# PUT /api/v1/finance/exchange-rates/{guid}

**API ID:** `finance-service.exchange-rates.update`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects the rate value on an exchange-rate row — but **only today's row**. Any row whose stored `exDate` is not the current UTC date is rejected, which is what stops yesterday's already-used rates from being rewritten under settled payments.

Two things the body suggests but the handler does not do: the currency **cannot** be changed (there is no `currencyGuid` field), and **`exDate` is ignored** — it is part of the request record and the audit summary, but the handler never writes it. `exRate` is the only field this endpoint changes.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `exchangeRateGuid` |

## Query params
None.

## Request body
```json
{
  "exRate": 3765.0,
  "exDate": "2026-08-17T00:00:00"
}
```

## Validation
`UpdateExchangeRateCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `exRate` | must be > 0 | Message: `"Exchange rate must be greater than zero."` |
| `exDate` | **no rule** | Required by the JSON shape, but unvalidated and unused by the handler |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Rate must exist | 404 `not_found` — `"Exchange rate not found."` |
| Stored `exDate` must be today (UTC) | 400 — `"Only today's exchange rates can be updated."` To fix an older rate, [delete](./delete-exchange-rate.md) and re-create it. |

## Response 200
Returns the updated `ExchangeRateDto` as the `data` payload, with `message: "Exchange rate updated successfully."`. The audit trail records `"Exchange rate changed from {old} to {new}"`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `exRate` is not greater than zero |
| 400 | (generic failure) | `"Only today's exchange rates can be updated."` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No exchange rate with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
