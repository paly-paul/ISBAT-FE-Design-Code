# GET /api/v1/academic/program-master

**API ID:** `academic-service.academic.program-master.get-all`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Returns a paginated list of approved programs (`isApproved = true`). Supports search by program code or name. Used to populate the Program Master list view.

## Path params
None.

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| `pageNumber` | int | No | Default `1`. 1-based. |
| `pageSize` | int | No | Default `20`. |
| `search` | string | No | Case-insensitive contains-match against `programCode` and `programName`. |

## Request body
None.

## Response 200
Returns a paginated list of `ProgramMasterListDto`.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "programGuid": "68e8f374-1e76-4e7c-9b5f-0d36cc56568a",
        "programCode": "BSCS",
        "programName": "Bachelor of Science in Computer Science",
        "pgmStatus": true,
        "noIa": false,
        "programGroupGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "programGroupName": "Science Group",
        "programLevelGuid": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7",
        "programLevelName": "Bachelor",
        "yearCount": 3,
        "semCount": 6,
        "facultyGuid": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8",
        "facultyName": "Faculty of Computing",
        "dateAcc": "2022-01-15T00:00:00",
        "semesters": [
          { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456781", "semCode": 1, "semName": "Year One - Semester One" }
        ]
      }
    ],
    "totalCount": 42,
    "pageNumber": 1,
    "pageSize": 20
  },
  "message": null,
  "code": null,
  "errors": null
}
```

### `ProgramMasterListDto` fields
| Field | Type | Notes |
|---|---|---|
| `programGuid` | guid | |
| `programCode` | string | |
| `programName` | string | |
| `pgmStatus` | bool | `true` = Active |
| `noIa` | bool | Internal assessment disabled flag |
| `programGroupGuid` | guid? | |
| `programGroupName` | string? | |
| `programLevelGuid` | guid? | |
| `programLevelName` | string? | |
| `yearCount` | int | |
| `semCount` | int | |
| `facultyGuid` | guid? | |
| `facultyName` | string? | |
| `dateAcc` | datetime? | |
| `semesters` | array | `{ semesterGuid, semCode, semName }` ordered by semCode |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Business logic notes
- Only returns programs where `isApproved = true`. To retrieve pending-approval programs use `GET /program-master/not-approved`.
- `search` matches against both `programCode` and `programName` using a case-insensitive contains check.

## Used by pages
| Page | Route |
|---|---|
| Program Master | /academic/program-master |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-14 | Abhinav | Initial version created |
| 2026-08-17 | Abhinav | Added `semesterGuid` to semester objects in response |
