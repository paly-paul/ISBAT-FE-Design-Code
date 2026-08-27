# POST /api/v1/students/sponsor-assignment/{studentGuid}/sponsor-assignment

**API ID:** `academic-service.students.sponsor-assignment.assign`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Places a student into a [sponsor category](../sponsor-categories/get-sponsor-categories.md) — recording who funds their studies.

There is no un-assign endpoint; re-post to change the category.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
```json
{
  "sponsorCategoryGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

## Validation
`AssignStudentSponsorCategoryValidator`:

| Field | Rule | Notes |
|---|---|---|
| `studentGuid` (path) | must not be empty | Message: `"Student GUID is required."` |
| `sponsorCategoryGuid` | must not be empty | Message: `"Sponsor category GUID is required."` **Existence is not checked** — a GUID matching no category is accepted |

Neither GUID is verified against its table, so a successful response does not confirm either the student or the category exists.

## Response 200
Returns the assignment result as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Either GUID is empty |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-24 | Vaishnav | Route moved from `/api/v1/studentsponsorassignment/…` to `/api/v1/students/sponsor-assignment/…` — the old prefix wasn't covered by any gateway route and 404'd through the gateway |
| 2026-08-17 | Vaishnav | Initial version created |
