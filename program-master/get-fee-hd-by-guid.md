# GET /api/v1/academic/Programfee-structure/hd/{feeHdGuid}

**API ID:** `academic-service.academic.fee-structure.get-hd`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a single fee header by its GUID — the header fields only, without its fee lines. For header **and** lines in one call use [GET /Programfee-structure/hd/{feeHdGuid}/complete](./get-fee-hd-complete.md).

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | Guid | Yes | Route-constrained to `:guid`. The sibling `/hd/{feeHdGuid}/complete` is a separate endpoint. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `ProgramFeeHdDto` as the `data` payload — same shape and field notes as [GET /Programfee-structure](./get-fees-by-program.md).

```json
{
  "success": true,
  "data": {
    "feeHdGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "feeCode": "BSCCS-2026",
    "feeDesc": "BSc CS 2026 intake fees",
    "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": true,
    "intakeGuid": "…",
    "localOrForeign": true,
    "calcType": 2,
    "amtPer": 10,
    "lef": 1200000, "lec": 12,
    "cef": 900000,  "cec": 9,
    "ace": 500000,  "acec": 5,
    "programFees": []
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`programFees` is empty here — this endpoint returns the header only.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header with this GUID, or it is soft-deleted |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
