# GET /api/v1/academic/program-master/{programGuid}

**API ID:** `academic-service.academic.program-master.get-by-guid`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Returns a single program by its GUID. Returns core program fields, associated stream GUIDs, and the program's semesters. Does **not** include course units or fee structures — use [`GET /program-master/{programGuid}/full-details`](./get-program-full-details.md) for the complete picture.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | Yes | The `ProgramGuid` of the target program |

## Query params
None.

## Request body
None.

## Response 200
Returns a `ProgramMasterDto`.

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
    "unitCount": 24,
    "programLevelGuid": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7",
    "yearCount": 3,
    "semCount": 6,
    "facultyGuid": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8",
    "dateAcc": "2022-01-15T00:00:00",
    "accLetter": 1,
    "appFee": 50000,
    "lateFee": 10000,
    "currencyGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
    "intakeGuid": "f0c0e3ce-a0fd-4ddf-8934-e3f5de5b2877",
    "streamGuids": [
      "d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9"
    ],
    "semesters": [
      { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456781", "semCode": 1, "semName": "Semester 1" },
      { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456782", "semCode": 2, "semName": "Semester 2" }
    ]
  },
  "message": null,
  "code": null,
  "errors": null
}
```

### `ProgramMasterDto` fields
| Field | Type | Notes |
|---|---|---|
| `programGuid` | guid | |
| `programCode` | string | |
| `programName` | string | |
| `pgmStatus` | bool | `true` = Active |
| `noIa` | bool | Whether internal assessment is disabled |
| `programGroupGuid` | guid? | |
| `unitCount` | int? | Total credit unit target |
| `programLevelGuid` | guid? | |
| `yearCount` | int | |
| `semCount` | int | |
| `facultyGuid` | guid? | Also the school/faculty — mapped via `IntSchool` |
| `dateAcc` | datetime? | Accreditation date |
| `accLetter` | int? | Accreditation letter file reference |
| `appFee` | decimal? | Application fee |
| `lateFee` | decimal? | Late application fee |
| `currencyGuid` | guid? | |
| `intakeGuid` | guid? | |
| `streamGuids` | guid[] | Active stream(s) linked to this program |
| `semesters` | array | Ordered list of `{ semesterGuid, semCode, semName }` |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No program exists for the provided GUID |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
| 2026-08-17 | Abhinav | Added `semesterGuid` to semester objects in response |
