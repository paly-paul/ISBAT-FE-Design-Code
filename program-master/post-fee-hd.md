# POST /api/v1/academic/Programfee-structure/hd

**API ID:** `academic-service.academic.fee-structure.create-hd`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Creates a fee **header** on its own, with no fee lines. Add lines afterwards one at a time via [POST /Programfee-structure/fee](./post-fee.md).

For the usual case — header and all its lines together in one transaction — use [POST /Programfee-structure/hd/save-complete](./post-fee-hd-save-complete.md) instead. This endpoint exists for the incremental build flow.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
None.

## Query params
None.

## Request body
```json
{
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

| Field | Notes |
|---|---|
| `programGuid` | **Required** — the only non-nullable GUID on the request |
| `feeCode` / `feeDesc` | Nullable in the DTO |
| `localOrForeign` | Which cohort the structure applies to |
| `lef`/`lec`, `cef`/`cec`, `ace`/`acec` | Lateral-entry, credit-exemption and Aptech credit-exemption fees with their credit counts — these feed the Finance module's lateral-credit calculation |
| `calcType` / `amtPer` | Discount calculation type and amount |
| `intakeGuid` | Nullable; scopes the structure to one intake |

## Validation
No FluentValidation validator is registered for this command — including **none on `feeCode`**, so a header can be created with a null or duplicate code. The uniqueness checking that [save-complete](./post-fee-hd-save-complete.md) performs does not apply here.

## Response 201
Returns the created fee header as the `data` payload — same shape as [GET /Programfee-structure/hd/{feeHdGuid}](./get-fee-hd-by-guid.md), with an empty `programFees`.

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
