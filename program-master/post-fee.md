# POST /api/v1/academic/Programfee-structure/fee

**API ID:** `academic-service.academic.fee-structure.create-fee-line`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Adds (or edits) a **single fee line** under an existing fee header — one ledger, one semester, one amount. Paired with [POST /Programfee-structure/hd](./post-fee-hd.md) for the incremental build flow; the batch alternative is [POST /Programfee-structure/hd/save-complete](./post-fee-hd-save-complete.md).

Despite being a POST, the `isEdit` flag makes this an upsert: send `true` to overwrite the existing line for that fee-header/ledger/semester combination rather than adding another. There is no separate PUT for a fee line, and no DELETE at all — removing a line requires [PUT /Programfee-structure/hd/{feeHdGuid}/update-complete](./put-fee-hd-update-complete.md) with the line omitted.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
None.

## Query params
None.

## Request body
```json
{
  "feeHdGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ledgerGuid": "…",
  "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "currencyGuid": "…",
  "semesterGuid": "…",
  "ledgerNum": 1,
  "amount": 1500000,
  "isEdit": false
}
```

| Field | Notes |
|---|---|
| `ledgerGuid` | The Finance [ledger](../../../finance-service/ledgers/get-ledgers.md) this line bills to |
| `currencyGuid` | The Finance [currency](../../../finance-service/currencies/get-currencies.md) the amount is in |
| `ledgerNum` | Ordering number — **the sequence Finance settles payments in**, lowest first. Not cosmetic. |
| `amount` | Non-nullable on this request, unlike the nullable `amount` returned by [GET fee-lines](./get-fee-lines-by-fee-hd.md) |
| `isEdit` | `false` adds a new line; `true` overwrites the existing line for the same fee header / ledger / semester |

All five GUIDs are required.

## Validation
No FluentValidation validator is registered for this command. In particular `amount` is **not** range-checked, so zero and negative amounts are accepted.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Fee header must exist | 404 `not_found` |
| Referenced ledger, currency and semester must resolve | 400/404 carrying the offending reference's message |

## Response 201
Returns the created (or updated) fee line as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

Note a **201 is returned even when `isEdit` is `true`** and an existing line was overwritten rather than created.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | A referenced ledger, currency or semester does not resolve |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header matches `feeHdGuid` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
