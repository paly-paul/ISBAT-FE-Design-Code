# GET /api/v1/students/nche-search

**API ID:** `academic-service.students.student-search.nche-search`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a paged list of students scoped to NCHE payment workflows. Each result is enriched with the student's currently-active program and semester (resolved from the active history entry, falling back to the top-level student fields). Used by the NCHE payment console to pick a student before recording or reviewing a payment.

Structurally identical to [GET /api/v1/students](../students/get-students.md) but returns `NcheStudentSearchResultDto` items which carry the extra `applicationGuid`, `programGuid`/`programName`, and `semesterGuid`/`semesterName` fields required by the NCHE flow.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | No | Free-text match against student name / registration number. Omit to page all students. |
| `page` | int | No | 1-based page index. Defaults to `1`. Not validated — out-of-range values return an empty `items` array. |
| `pageSize` | int | No | Items per page. Defaults to `25`. No upper bound is enforced at the handler level. |

## Request body
None — `GET` endpoint, all parameters are query-string.

## Validation
No FluentValidation validator is wired for this query. `page` and `pageSize` default values are applied in the query record constructor; no range checks are performed.

## Response 200
Paged envelope (see [api/README.md](../../../README.md) for the full envelope shape).

```json
{
  "items": [
    {
      "studentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "studentName": "Jane Doe",
      "studentNum": "STU/2024/001",
      "applicationGuid": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "programGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "programName": "Bachelor of Business Administration",
      "semesterGuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "semesterName": "Semester 3"
    }
  ],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 25
}
```

### Item fields

| Field | Type | Notes |
|---|---|---|
| `studentGuid` | `Guid` | Primary key of the student record |
| `studentName` | `string?` | Display name; may be `null` for migrated/legacy rows |
| `studentNum` | `string?` | Registration number (e.g. `STU/2024/001`) |
| `applicationGuid` | `Guid?` | Active history entry's application GUID, falling back to the top-level student `applicationGuid` |
| `programGuid` | `Guid?` | Active history entry's program GUID, falling back to the top-level student `programGuid` |
| `programName` | `string?` | Resolved from the academic service; `null` if the GUID is unknown or the lookup call fails |
| `semesterGuid` | `Guid?` | Active history entry's semester GUID, falling back to the top-level student `semesterGuid` |
| `semesterName` | `string?` | Resolved from the academic service; `null` if the GUID is unknown or the lookup call fails |

> The handler fans out two parallel calls to the academic service to bulk-resolve program names and semester names. If the student list is empty, the lookups are skipped and an empty paged result is returned immediately.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-01 | Nebu Salim | Initial version created |
