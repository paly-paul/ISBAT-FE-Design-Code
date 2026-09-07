# GET /api/v1/academic/Programfee-structure/fee-lines/{feeHdGuid}

**API ID:** `academic-service.academic.fee-structure.fee-lines`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns **all** fee lines under a fee header — one row per ledger per semester, with ledger and currency names resolved.

This is the endpoint the Finance module calls to price a student's tuition: outstanding-balance and allocation calculations are built from these lines. For a single semester's lines use [GET /Programfee-structure/fee-lines/{feeHdGuid}/semester/{semesterGuid}](./get-fee-lines-by-fee-hd-and-semester.md).

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<ProgramFeeLineDto>` as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

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

| Field | Notes |
|---|---|
| `ledgerNum` | The line's ordering number — **the sequence Finance settles payments in**, oldest-lowest first. Not cosmetic. |
| `amount` | Nullable — a configured-but-unpriced line comes back as `null`, not `0` |
| `ledgerName` / `currencyName` | Nullable; resolved for display |

An empty result is a normal 200 with `data: []`.

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
