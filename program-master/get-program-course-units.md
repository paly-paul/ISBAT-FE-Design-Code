# GET /api/v1/academic/program-course-units/{programGuid}

**API ID:** `academic-service.academic.program-course-units.get-by-program`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Returns all active (non-deleted) course units assigned to a program, with their semester, stream, unit type, and unit category details.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | Yes | The `ProgramGuid` of the target program |

## Query params
None.

## Request body
None.

## Response 200
Returns a list of `ProgramUnitDto` objects.

```json
{
  "success": true,
  "data": [
    {
      "courseUnitGuid": "4e5775ec-673b-4c41-94e1-ee7e2b50bd7a",
      "courseUnitName": "Introduction to Networking",
      "courseUnitCode": "NET101",
      "semesterGuid": "d0324224-5ede-496b-b26c-fe403bfa3c1b",
      "semName": "Semester 1",
      "flag": 1,
      "streamGuid": null,
      "streamName": null,
      "unitTypeGuid": "a8ae94be-13f1-4b62-a773-bf2161f99b68",
      "unitTypeName": "Compulsory",
      "unitCatGuid": "ae3472ea-0015-4a0d-82b1-b40f0138e442",
      "unitCatName": "Core"
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

### `ProgramUnitDto` fields
| Field | Type | Notes |
|---|---|---|
| `courseUnitGuid` | guid | |
| `courseUnitName` | string? | |
| `courseUnitCode` | string? | |
| `semesterGuid` | guid | |
| `semName` | string | |
| `flag` | byte? | `1` = Core, `2` = Elective |
| `streamGuid` | guid? | Null if not a specialization unit |
| `streamName` | string? | |
| `unitTypeGuid` | guid? | |
| `unitTypeName` | string? | |
| `unitCatGuid` | guid? | |
| `unitCatName` | string? | |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Business logic notes
- Returns an empty array if the program has no assigned course units — does not 404.
- Only non-deleted (`IsDeleted = false`) units are returned.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
