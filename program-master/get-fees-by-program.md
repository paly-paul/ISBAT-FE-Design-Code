# GET /api/v1/academic/Programfee-structure

**API ID:** `academic-service.academic.fee-structure.list`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a paged list of fee headers (fee HDs), optionally filtered to one program. A fee header is a named fee structure — its lines are the per-semester, per-ledger amounts that the Finance module bills against.

> **Note the route casing:** `Programfee-structure`, with a capital `P` and a lowercase `f`. It is inconsistent with every other kebab-case route in this module, and paths are case-sensitive at the gateway — copy it exactly.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `pageNumber` | int | No | 1-based page index. Defaults to `1`. Note the name — `pageNumber`, not `page`. |
| `pageSize` | int | No | Defaults to **`20`**. No upper bound enforced. |
| `programGuid` | Guid | No | Restrict to one program's fee headers. Omit for all programs. |

## Request body
None.

## Validation
None.

## Response 200
Returns a paged list of `ProgramFeeHdDto` as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "items": [
      {
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
      }
    ],
    "totalCount": 14,
    "pageNumber": 1,
    "pageSize": 20
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `localOrForeign` | Which student cohort the structure applies to — a program typically has one header for each |
| `lef` / `lec` | Lateral-entry fee and credit count |
| `cef` / `cec` | Credit-exemption fee and credit count |
| `ace` / `acec` | Aptech credit-exemption fee and credit count. These six feed the Finance module's [lateral-credit balance](../../../finance-service/payment-console/get-lateral-credit-balance.md) calculation. |
| `calcType` / `amtPer` | Discount calculation type and amount carried on the structure |
| `programFees` | The fee lines. **Empty on this list endpoint** — fetch them via [GET /Programfee-structure/fee-lines/{feeHdGuid}](./get-fee-lines-by-fee-hd.md) or the [complete](./get-fee-hd-complete.md) endpoint. |

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
