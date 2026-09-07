# GET /api/v1/academic/Programfee-structure/hd/{feeHdGuid}/complete

**API ID:** `academic-service.academic.program-fee-structure.get-hd-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Returns a fee structure header together with all its fee lines, including the `feeLineGuid` and `semesterGuid` for each line. Used when the UI needs to display or edit a complete fee structure.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | guid | Yes | The `FeeHdGuid` of the fee header |

## Query params
None.

## Request body
None.

## Response 200
Returns a `FeeHdCompleteDto`.

```json
{
  "success": true,
  "data": {
    "feeHdGuid": "6298b136-13fb-4435-bd96-c7bec469be43",
    "feeCode": "TUI2026",
    "feeDesc": "Tuition Fee 2026",
    "programGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
    "status": true,
    "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
    "intakeCode": 2026,
    "localOrForeign": false,
    "calcType": 1,
    "amtPer": 100,
    "lef": null,
    "cef": null,
    "lec": null,
    "cec": null,
    "ace": null,
    "acec": null,
    "feeLines": [
      {
        "feeLineGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
        "semesterGuid": "d0324224-5ede-496b-b26c-fe403bfa3c1b",
        "semCode": 1,
        "ledgerGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "currencyGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
        "ledgerNum": 1,
        "amount": 1500000
      }
    ]
  },
  "message": null,
  "code": null,
  "errors": null
}
```

### `FeeHdCompleteDto` fields
| Field | Type | Notes |
|---|---|---|
| `feeHdGuid` | guid | |
| `feeCode` | string? | |
| `feeDesc` | string? | |
| `programGuid` | guid? | |
| `status` | bool? | |
| `intakeGuid` | guid? | |
| `intakeCode` | int? | Numeric intake code from `M_INTAKE` |
| `localOrForeign` | bool? | `false` = Local, `true` = Foreign |
| `calcType` | int? | |
| `amtPer` | decimal? | |
| `lef` | decimal? | |
| `cef` | decimal? | |
| `lec` | int? | |
| `cec` | int? | |
| `ace` | decimal? | |
| `acec` | int? | |
| `feeLines` | array | |
| `feeLines[].feeLineGuid` | guid | Required for update/delete operations on individual lines |
| `feeLines[].semesterGuid` | guid | |
| `feeLines[].semCode` | int | Numeric semester code |
| `feeLines[].ledgerGuid` | guid | References finance service |
| `feeLines[].currencyGuid` | guid? | References finance service |
| `feeLines[].ledgerNum` | int? | |
| `feeLines[].amount` | decimal? | |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header exists for the provided GUID — "Fee structure not found." |

## Business logic notes
- Unlike [`GET /hd/{feeHdGuid}`](./get-fee-hd-by-guid.md), this endpoint returns `feeLineGuid` and `semesterGuid` per line, which are needed for the update-complete flow.
- Ledger and currency names are **not** resolved here — use the finance service to resolve names from the returned GUIDs.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
