# DELETE /api/v1/finance/exchange-rates/{guid}

**API ID:** `finance-service.exchange-rates.delete`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Soft-deletes an exchange rate (`isDeleted = true`). Unlike the other Finance deletes, this one distinguishes "already deleted" from "not found" and returns 400 rather than 404 for a repeat call.

No date restriction applies here — any rate, of any age, can be deleted. That is the only route to correcting a historical rate, since [PUT](./put-exchange-rate.md) refuses anything but today's row. Deleting a rate that payments were converted with does **not** restate those payments; their converted amounts are already persisted.

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

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Rate must exist | 404 `not_found` — `"Exchange rate not found."` |
| Rate must not already be soft-deleted | 400 — `"Exchange rate is already deleted."` |

## Response 200
Returns `true` as the `data` payload, with `message: "Exchange rate deleted successfully."`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | `"Exchange rate is already deleted."` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No exchange rate with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
