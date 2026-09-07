# POST /api/v1/academic/Programfee-structure/hd/save-complete

**API ID:** `academic-service.academic.program-fee-structure.save-hd-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Creates a fee structure header together with all its fee lines in a single request. Use this instead of calling `POST /hd` followed by multiple `POST /fee` calls. All fee lines are validated before any data is saved — one failure rejects the entire request.

## Path params
None.

## Query params
None.

## Request body
`Content-Type: application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | Yes | Must reference an existing program |
| `feeCode` | string? | No | Must be globally unique if provided |
| `feeDesc` | string? | No | |
| `status` | bool? | No | |
| `localOrForeign` | bool? | No | `false` = Local, `true` = Foreign |
| `calcType` | int? | No | |
| `amtPer` | decimal? | No | |
| `lef` | decimal? | No | |
| `cef` | decimal? | No | |
| `ace` | decimal? | No | |
| `lec` | int? | No | |
| `cec` | int? | No | |
| `acec` | int? | No | |
| `intakeGuid` | guid? | No | |
| `feeLines` | array | Yes | Can be empty array `[]` |
| `feeLines[].semesterGuid` | guid | Yes | Must belong to the same program |
| `feeLines[].ledgerGuid` | guid | Yes | References finance service |
| `feeLines[].currencyGuid` | guid | Yes | References finance service |
| `feeLines[].ledgerNum` | int | Yes | |
| `feeLines[].amount` | decimal | Yes | |

```json
{
  "programGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
  "feeCode": "TUI2026",
  "feeDesc": "Tuition Fee 2026",
  "status": true,
  "localOrForeign": false,
  "calcType": 1,
  "amtPer": 100,
  "lef": null,
  "cef": null,
  "ace": null,
  "lec": null,
  "cec": null,
  "acec": null,
  "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
  "feeLines": [
    {
      "semesterGuid": "d0324224-5ede-496b-b26c-fe403bfa3c1b",
      "ledgerGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "currencyGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
      "ledgerNum": 1,
      "amount": 1500000
    }
  ]
}
```

## Response 201
Returns `FeeHdCompleteDto` — the saved header with all fee lines. Each line includes `feeLineGuid` and `semesterGuid` for use in subsequent update/delete operations.

```json
{
  "success": true,
  "data": {
    "feeHdGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
    "feeCode": "TUI2026",
    "feeDesc": "Tuition Fee 2026",
    "programGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
    "status": true,
    "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
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
  "message": "Fee structure saved successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `duplicate_fee_code` | `feeCode` already exists globally |
| 400 | `semester_program_mismatch` | A `semesterGuid` in `feeLines` does not belong to the specified program |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Program, intake, or semester not found |

## Business logic notes
- All fee lines are validated sequentially before any are saved. If any semester is not found or does not belong to the program, the entire request is rejected.
- `feeCode` uniqueness is checked globally across all fee headers, not per program.
- `ledgerGuid` and `currencyGuid` reference `erp-finance-compliance-service` and are stored as-is without local validation.
- This is **step 3** of the save-and-continue flow:
  - Step 1 → `POST /program-master` — create program, returns `programGuid` + `semesters[]`
  - Step 2 → `POST /program-course-units` — assign course units using `semesterGuid` from step 1
  - Step 3 → `POST /Programfee-structure/hd/save-complete` *(this)* — create fee structure using `semesterGuid` from step 1

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
