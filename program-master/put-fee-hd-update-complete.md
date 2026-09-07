# PUT /api/v1/academic/Programfee-structure/hd/{feeHdGuid}/update-complete

**API ID:** `academic-service.academic.fee-structure.update-hd-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates a fee header **and its complete set of fee lines** in one transaction — the editing counterpart of [POST /Programfee-structure/hd/save-complete](./post-fee-hd-save-complete.md).

`feeLines` is a **replacement, not a merge**: the saved lines become exactly what you send, so a line you omit is removed. This is the only way to delete a fee line — there is no DELETE endpoint for one. Load the current set from [GET /Programfee-structure/hd/{feeHdGuid}/complete](./get-fee-hd-complete.md) first, edit it, and send the whole thing back.

**The path GUID wins.** The handler overwrites the body's `feeHdGuid` with the one from the route (`request with { FeeHdGuid = feeHdGuid }`), so a mismatched body value is silently ignored rather than rejected.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | Guid | Yes | Route-constrained to `:guid`. Overrides whatever `feeHdGuid` the body carries. |

## Query params
None.

## Request body
```json
{
  "feeHdGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "feeCode": "BSCCS-2026",
  "feeDesc": "BSc CS 2026 intake fees",
  "status": true,
  "localOrForeign": true,
  "lef": 1200000, "lec": 12,
  "cef": 900000,  "cec": 9,
  "ace": 500000,  "acec": 5,
  "calcType": 2,
  "amtPer": 10,
  "intakeGuid": "…",
  "feeLines": [
    {
      "ledgerGuid": "…",
      "currencyGuid": "…",
      "semesterGuid": "…",
      "ledgerNum": 1,
      "amount": 1500000
    }
  ]
}
```

`feeLines` carries the same per-line fields as [POST /Programfee-structure/fee](./post-fee.md), minus `feeHdGuid` and `isEdit`.

## Validation
No FluentValidation validator is registered for this command; checks are handler-level.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Fee header must exist | 404 `not_found` |
| Each line's ledger, currency and semester must resolve | 400/404 carrying the offending line's message; the whole update rolls back |

## Response 200
Returns the updated fee header **with its lines** as the `data` payload — same shape as [GET /Programfee-structure/hd/{feeHdGuid}/complete](./get-fee-hd-complete.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | A referenced ledger, currency or semester does not resolve |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
