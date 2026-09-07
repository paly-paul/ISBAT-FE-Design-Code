# POST /api/v1/academic/Programfee-structure/hd/copy

**API ID:** `academic-service.academic.program-fee-structure.copy-hd`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Copies an existing fee structure header and all its fee lines to a different (or the same) program. Semester mapping is done by `SemCode` — a source fee line whose semester code exceeds the target program's `SemCount` is silently skipped. The new header gets a new `feeCode` and optionally a different intake.

## Path params
None.

## Query params
None.

## Request body
`Content-Type: application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `sourceFeeHdGuid` | guid | Yes | The fee header to copy from |
| `targetProgramGuid` | guid | Yes | The program to copy into |
| `newFeeCode` | string | Yes | Must be globally unique |
| `newFeeDesc` | string? | No | Description for the new header |
| `targetIntakeGuid` | guid? | No | Intake to assign to the new header; if omitted the current active intake code is used |

```json
{
  "sourceFeeHdGuid": "6298b136-13fb-4435-bd96-c7bec469be43",
  "targetProgramGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
  "targetIntakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
  "newFeeCode": "TUI2026-COPY",
  "newFeeDesc": "Tuition Fee 2026 (Copy)"
}
```

## Response 201
Returns the newly created `ProgramFeeHdDto` including copied fee lines.

```json
{
  "success": true,
  "data": {
    "feeHdGuid": "new-guid-here",
    "feeCode": "TUI2026-COPY",
    "feeDesc": "Tuition Fee 2026 (Copy)",
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
    "programFees": [
      {
        "ledgerGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "currencyGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
        "ledgerNum": 1,
        "amount": 1500000,
        "semesterGuid": null,
        "semName": null
      }
    ]
  },
  "message": "Fee structure copied successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `duplicate_fee_code` | `newFeeCode` already exists |
| 400 | `server_error` | No intake is currently flagged as active (required when `targetIntakeGuid` is omitted) |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Source fee header, target program, or target intake not found |

## Business logic notes
- Fee lines are matched from source to target by `SemCode`. If a source line's semester code is higher than the target program's `SemCount`, the line is **skipped silently** — no error is raised.
- All copied fee lines get new `FeeLineGuid` values — they are treated as new records.
- The new header inherits `status`, `localOrForeign`, `calcType`, `amtPer`, `lef`, `cef`, `ace`, `lec`, `cec`, `acec` from the source header.
- `targetIntakeGuid` resolves to the `IntakeGuid` and `IntakeCode` stored on the new header. If omitted, `IntakeCode` is set to the current active intake code but `IntakeGuid` is left null.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
