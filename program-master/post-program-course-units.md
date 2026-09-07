# POST /api/v1/academic/program-course-units

**API ID:** `academic-service.academic.program-course-units.add-bulk`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Adds one or more course units to an existing program in bulk. Each unit is linked to a semester, and optionally to a specialization stream, unit type, and unit category. The endpoint validates for duplicates and referential integrity before inserting.

## Path params
None.

## Query params
None.

## Request body
`Content-Type: application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | Yes | Must reference an existing, non-deleted program |
| `programName` | string? | No | Optional label — used only for audit log summary, not stored |
| `units` | array | Yes | One or more course unit items to add |
| `units[].semesterGuid` | guid | Yes | Must be a semester that belongs to the program |
| `units[].courseUnitGuid` | guid | Yes | Must reference an existing course unit |
| `units[].streamGuid` | guid? | No | Required when `unitCatGuid` resolves to Specialization category |
| `units[].unitTypeGuid` | guid? | No | |
| `units[].unitCatGuid` | guid? | No | |
| `units[].flag` | byte | Yes | `1` = Core, `2` = Elective |

```json
{
  "programGuid": "b5e16384-8d14-49c6-b70a-5c4f9dacb7ce",
  "units": [
    {
      "semesterGuid": "d0324224-5ede-496b-b26c-fe403bfa3c1b",
      "courseUnitGuid": "4e5775ec-673b-4c41-94e1-ee7e2b50bd7a",
      "streamGuid": null,
      "unitTypeGuid": "a8ae94be-13f1-4b62-a773-bf2161f99b68",
      "unitCatGuid": "ae3472ea-0015-4a0d-82b1-b40f0138e442",
      "flag": 1
    }
  ]
}
```

## Validation
Enforced by the command handler before any insert.

| Rule | Error code | Message |
|---|---|---|
| `programGuid` not found | `not_found` | "Program not found." |
| `semesterGuid` not in program's semesters | `not_found` | "Semester not found for this program." |
| `courseUnitGuid` not found | `not_found` | "Course unit not found." |
| Duplicate `(courseUnitGuid, semesterGuid, flag)` within request | `duplicate_program_unit` | "Duplicate course unit entry for semester '{semName}'." |
| Same unit already exists in DB for that semester | `duplicate_program_unit` | "Course unit '{name}' already exists in semester '{semName}'." |
| `streamGuid` provided but not found | `not_found` | "Specialization not found." |
| `streamGuid` not mapped to this program | `stream_not_mapped` | "Selected specialization is not mapped to this program." |
| `unitCatGuid` resolves to Specialization but no `streamGuid` given | `validation_error` | "Specialization is required when unit category is Specialization." |
| `unitTypeGuid` provided but not found | `not_found` | "Unit type not found." |

## Response 201
Returns a list of `ProgramUnitDto` objects for the newly added units.

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
  "message": "Course units saved successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Unit category is Specialization but `streamGuid` not provided |
| 400 | `duplicate_program_unit` | Duplicate within request or already exists in DB |
| 400 | `stream_not_mapped` | Stream not linked to the program |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Program, semester, course unit, stream, or unit type not found |

## Business logic notes
- A `ProgramUnitGuid` (UUID) is generated server-side for each inserted row — clients must not supply it.
- Stream validation checks that the given stream is in the program's `M_PROGRAM_STREAMS` entries, not just that it exists globally.
- The duplicate check runs against existing non-deleted rows keyed on `(IntUnit, IntSem, Flag)`.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-13 | Abhinav | Initial version created |
