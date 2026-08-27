# POST /api/v1/students/search/search

**API ID:** `academic-service.students.student-search.search`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
The **full student search**: fourteen optional filters combined with AND, paged and validated. This is the endpoint behind the student-search screen; [GET /students](../students/get-students.md) is the thin single-term variant.

A POST because the filter set travels in the body — it reads nothing and writes nothing.

## Path params
None.

## Query params
None — every filter is in the body.

## Request body
Every field is optional; omitted filters are not applied.

```json
{
  "schoolGuid": null,
  "programGuid": null,
  "batchGuid": null,
  "semesterGuid": null,
  "campusGuid": null,
  "intCountryCode": null,
  "sponsorCategoryGuid": null,
  "intakeCode": null,
  "studentRegNo": null,
  "studentName": null,
  "refugee": null,
  "refugeeId": null,
  "gender": null,
  "pageNumber": 1,
  "pageSize": 25
}
```

| Field | Notes |
|---|---|
| `intCountryCode` / `intakeCode` | **Legacy integer keys**, not GUIDs — the two filters that break the GUID convention |
| `sponsorCategoryGuid` | From [GET /students/sponsor-categories](../sponsor-categories/get-sponsor-categories.md) |
| `refugee` | Status byte; pair with `refugeeId` to find a specific document |
| `gender` | Must be a defined `Gender` enum value when supplied |

Sending an empty object `{}` is valid and returns the first page of all students.

## Validation
`SearchStudentsQueryValidator`:

| Field | Rule | Notes |
|---|---|---|
| `pageNumber` | must be ≥ 1 | |
| `pageSize` | must be between 1 and 200 inclusive | One of the few paged endpoints in this repo with an upper bound |
| `studentRegNo` | max 50 chars | |
| `studentName` | max 50 chars | Note this is **50**, while the [ID-card search](../id-cards/get-id-card-search.md) allows 100 for the same concept |
| `gender` | must be a defined enum value, **only when supplied** | |

The GUID filters are not existence-checked — an unknown `programGuid` returns an empty page, not a 404.

## Response 200
Returns a paged list of matching students as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Paging out of range, over-long text filter, or an undefined `gender` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-24 | Vaishnav | Route moved from `/api/v1/studentsearch/search` to `/api/v1/students/search/search` — the old prefix wasn't covered by any gateway route and 404'd through the gateway |
| 2026-08-17 | Vaishnav | Initial version created |
