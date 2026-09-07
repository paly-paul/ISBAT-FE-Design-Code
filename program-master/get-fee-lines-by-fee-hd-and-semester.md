# GET /api/v1/academic/Programfee-structure/fee-lines/{feeHdGuid}/semester/{semesterGuid}

**API ID:** `academic-service.academic.fee-structure.fee-lines-by-semester`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the fee lines under a fee header **for one semester only** — the narrow variant of [GET /Programfee-structure/fee-lines/{feeHdGuid}](./get-fee-lines-by-fee-hd.md), for screens that price a single semester rather than the whole program.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | Guid | Yes | Route-constrained to `:guid` |
| `semesterGuid` | Guid | Yes | Route-constrained to `:guid`. From [GET /semesters/dropdownforprogram](../semesters/get-semester-dropdown-by-program.md). |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<ProgramFeeLineDto>` as the `data` payload — identical item shape and field notes to [GET /Programfee-structure/fee-lines/{feeHdGuid}](./get-fee-lines-by-fee-hd.md).

```json
{
  "success": true,
  "data": [
    {
      "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "semesterGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerGuid": "…",
      "ledgerName": "Tuition Fee",
      "ledgerNum": 1,
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "amount": 1500000
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

A semester with no lines configured returns a 200 with `data: []`, not a 404 — so an empty array cannot distinguish "unpriced semester" from "unknown semester GUID".

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
