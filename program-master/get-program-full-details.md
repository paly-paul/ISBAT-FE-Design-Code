# GET /api/v1/academic/program-master/{programGuid}/full-details

**API ID:** `academic-service.academic.program-master.get-full-details`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Returns the complete picture of a program — header fields, all assigned course units, and all fee structure headers with their fee lines. Ledger and currency names are resolved from the finance service (`erp-finance-compliance-service`) and included inline.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | Yes | The `ProgramGuid` of the target program |

## Query params
None.

## Request body
None.

## Response 200
Returns a `ProgramFullDetailsDto`.

```json
{
  "success": true,
  "data": {
    "programGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
    "programCode": "BSCS",
    "programName": "Bachelor of Science in Computer Science",
    "pgmStatus": true,
    "noIa": false,
    "programGroupGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "programGroupName": "Science Group",
    "unitCount": 24,
    "programLevelGuid": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7",
    "programLevelName": "Bachelor",
    "yearCount": 3,
    "semCount": 6,
    "facultyGuid": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8",
    "schoolName": "Faculty of Computing",
    "dateAcc": "2022-01-15T00:00:00",
    "accLetter": 1,
    "appFee": 50000,
    "lateFee": 10000,
    "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
    "intakeCode": 2026,
    "streamGuids": ["d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9"],
    "streamNames": ["Computer Networking"],
    "semesters": [
      { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456781", "semCode": 1, "semName": "Semester 1" }
    ],
    "programUnits": [
      {
        "semCode": 1,
        "courseUnitGuid": "4e5775ec-673b-4c41-94e1-ee7e2b50bd7a",
        "courseUnitCode": "NET101",
        "courseUnitName": "Introduction to Networking",
        "streamGuid": null,
        "streamName": null,
        "unitTypeGuid": "a8ae94be-13f1-4b62-a773-bf2161f99b68",
        "unitTypeName": "Compulsory",
        "unitCatGuid": "ae3472ea-0015-4a0d-82b1-b40f0138e442",
        "unitCatName": "Core",
        "flag": 1
      }
    ],
    "feeStructures": [
      {
        "feeHdGuid": "6298b136-13fb-4435-bd96-c7bec469be43",
        "feeCode": "TUI2026",
        "feeDesc": "Tuition Fee 2026",
        "status": true,
        "localOrForeign": false,
        "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
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
            "semCode": 1,
            "ledgerGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
            "ledgerName": "Tuition Ledger",
            "currencyGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
            "currencyName": "Uganda Shillings",
            "ledgerNum": 1,
            "amount": 1500000
          }
        ]
      }
    ]
  },
  "message": null,
  "code": null,
  "errors": null
}
```

### Top-level fields
| Field | Type | Notes |
|---|---|---|
| `programGuid` | guid | |
| `programCode` | string | |
| `programName` | string | |
| `pgmStatus` | bool | `true` = Active |
| `noIa` | bool | Internal assessment disabled flag |
| `programGroupGuid` | guid? | |
| `programGroupName` | string? | |
| `unitCount` | int? | |
| `programLevelGuid` | guid? | |
| `programLevelName` | string? | |
| `yearCount` | int | |
| `semCount` | int | |
| `facultyGuid` | guid? | |
| `schoolName` | string? | Faculty/school name — mapped via `IntSchool` FK |
| `dateAcc` | datetime? | |
| `accLetter` | int? | |
| `appFee` | decimal? | |
| `lateFee` | decimal? | |
| `intakeGuid` | guid? | |
| `intakeCode` | int? | Numeric intake code |
| `streamGuids` | guid[] | Parallel array with `streamNames` |
| `streamNames` | string?[] | Parallel array with `streamGuids` |
| `semesters` | array | `{ semesterGuid, semCode, semName }` ordered by semCode |
| `programUnits` | array | See below |
| `feeStructures` | array | See below |

### `programUnits[]` fields
| Field | Type | Notes |
|---|---|---|
| `semCode` | int | Numeric semester code |
| `courseUnitGuid` | guid | |
| `courseUnitCode` | string? | |
| `courseUnitName` | string? | |
| `streamGuid` | guid? | |
| `streamName` | string? | |
| `unitTypeGuid` | guid? | |
| `unitTypeName` | string? | |
| `unitCatGuid` | guid? | |
| `unitCatName` | string? | |
| `flag` | byte? | `1` = Core, `2` = Elective |

### `feeStructures[]` fields
| Field | Type | Notes |
|---|---|---|
| `feeHdGuid` | guid | |
| `feeCode` | string? | |
| `feeDesc` | string? | |
| `status` | bool? | |
| `localOrForeign` | bool? | `false` = Local, `true` = Foreign |
| `intakeGuid` | guid? | |
| `calcType` | int? | |
| `amtPer` | decimal? | |
| `lef` | decimal? | |
| `cef` | decimal? | |
| `lec` | int? | |
| `cec` | int? | |
| `ace` | decimal? | |
| `acec` | int? | |
| `feeLines` | array | |

### `feeLines[]` fields
| Field | Type | Notes |
|---|---|---|
| `semCode` | int | |
| `ledgerGuid` | guid | References `erp-finance-compliance-service` |
| `ledgerName` | string? | Resolved from finance service; null if not found |
| `currencyGuid` | guid? | |
| `currencyName` | string? | Resolved from finance service; null if not found |
| `ledgerNum` | int? | |
| `amount` | decimal? | |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No program exists for the provided GUID — "Program not found." |

## Business logic notes
- Ledger names are bulk-fetched in a single call to the finance service via `GetLedgerNamesByGuidsAsync`.
- Currency names are fetched in parallel per distinct currency GUID via `GetCurrencyNameByGuidAsync`. If the finance service is unavailable or returns null, the name fields will be null — the response is not failed.
- `schoolName` = `FacultyName` — the `Faculty` navigation property on `ProgramEntity` is configured via the `IntSchool` foreign key column, making faculty and school synonymous in this domain.
- `streamGuids` and `streamNames` are parallel arrays of the same length — index `i` in one corresponds to index `i` in the other.

## Used by pages
| Page | Route |
|---|---|
| Program Master Detail | /academic/program-master/{programGuid}/full-details |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
| 2026-08-17 | Abhinav | Added `semesterGuid` to semester objects in response |
