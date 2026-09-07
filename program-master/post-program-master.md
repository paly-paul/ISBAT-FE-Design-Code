# POST /api/v1/academic/program-master

**API ID:** `academic-service.academic.program-master.create`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway.

## Description
Creates a new program. On success the server auto-generates semesters based on the program level's `semCount` and returns the full `ProgramMasterDto` including the generated `semesters[]`. The `semesterGuid` values from the response are required for subsequent course-unit and fee-structure creation.

## Path params
None.

## Query params
None.

## Request body
`Content-Type: multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `programCode` | string | Yes | Must be unique (case-insensitive) |
| `programName` | string | Yes | |
| `pgmStatus` | bool | Yes | `true` = Active |
| `noIa` | bool | Yes | `true` = disable internal assessment |
| `programLevelGuid` | guid | Yes | Must reference an existing program level — drives `yearCount` and `semCount` |
| `programGroupGuid` | guid? | No | |
| `unitCount` | int? | No | |
| `appFee` | decimal? | No | |
| `lateFee` | decimal? | No | |
| `currencyGuid` | guid? | No | |
| `facultyGuid` | guid? | No | Faculty / school |
| `streamGuid` | guid? | No | Specialization stream |
| `intakeGuid` | guid? | No | |
| `dateAcc` | datetime? | No | Accreditation date |
| `accLetterFile` | file? | No | Accreditation letter upload (binary) |

## Validation
| Rule | Error code | Message |
|---|---|---|
| `programCode` already exists | `duplicate_program_code` | "Program code '{code}' already exists." |
| `programLevelGuid` not found | `not_found` | "Program level not found." |
| `programGroupGuid` provided but not found | `not_found` | "Program group not found." |
| `facultyGuid` provided but not found | `not_found` | "Faculty not found." |
| `streamGuid` provided but not found | `not_found` | "Specialization not found." |
| `intakeGuid` provided but not found | `not_found` | "Intake not found." |

## Response 201
Returns a `ProgramMasterDto` for the newly created program.

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
    "streamGuids": ["d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9"],
    "semesters": [
      { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456781", "semCode": 1, "semName": "Year One - Semester One" },
      { "semesterGuid": "a1b2c3d4-e5f6-4789-abcd-ef0123456782", "semCode": 2, "semName": "Year One - Semester Two" }
    ]
  },
  "message": "Program created successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `duplicate_program_code` | Program code already exists |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Program level, group, faculty, stream, or intake not found |

## Business logic notes
- `yearCount` and `semCount` are derived from the selected program level — they cannot be supplied directly.
- Semesters are auto-generated server-side using a `Year {X} - Semester {Y}` naming pattern. The `semesterGuid` values returned in `semesters[]` are needed by `POST /program-course-units` and `POST /Programfee-structure/hd/save-complete`.
- The program is created with `isApproved = false`. It must be approved via `PUT /program-approval` before it appears in the main list.
- `intakeGuid` is stored as an integer FK to `M_INTAKE` (via `INTINTAKE` column) — the server resolves and stores the PK internally.

## Used by pages
| Page | Route |
|---|---|
| Program Master | /academic/program-master |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-14 | Abhinav | Initial version created |
| 2026-08-17 | Abhinav | Added `semesterGuid` to `SemesterDto` in response; fixed model binding for optional `accLetterFile` |
