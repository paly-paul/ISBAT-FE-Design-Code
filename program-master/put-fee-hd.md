# PUT /api/v1/academic/Programfee-structure/hd

**API ID:** `academic-service.academic.fee-structure.update-hd`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates a fee **header's** own fields. It does not touch the fee lines — for header and lines together use [PUT /Programfee-structure/hd/{feeHdGuid}/update-complete](./put-fee-hd-update-complete.md).

> **The target is identified by the body, not the path.** The route has no `{feeHdGuid}` segment; the row is located by the `feeHdGuid` field inside the request. Compare the update-complete variant, which does take the GUID in the path.

Changing `lef`/`cef`/`ace` or `calcType`/`amtPer` affects **future** fee calculation only — amounts already billed or paid are not restated.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
None.

## Query params
None.

## Request body
Same field set as [POST /Programfee-structure/hd](./post-fee-hd.md), plus the `feeHdGuid` identifying the row:

```json
{
  "feeHdGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "feeCode": "BSCCS-2026",
  "feeDesc": "BSc CS 2026 intake fees",
  "status": true,
  "localOrForeign": true,
  "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "lef": 1200000, "lec": 12,
  "cef": 900000,  "cec": 9,
  "ace": 500000,  "acec": 5,
  "calcType": 2,
  "amtPer": 10,
  "intakeGuid": "…"
}
```

`feeHdGuid` and `programGuid` are both required; the rest are nullable.

## Validation
No FluentValidation validator is registered for this command — `feeCode` is neither required nor uniqueness-checked here.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Fee header must exist | 404 `not_found` |

## Response 200
Returns the updated fee header as the `data` payload — same shape as [GET /Programfee-structure/hd/{feeHdGuid}](./get-fee-hd-by-guid.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header matches `feeHdGuid` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
