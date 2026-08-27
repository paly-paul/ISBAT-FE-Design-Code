# GET /api/v1/students/sponsor-assignment/{studentGuid}/sponsor-details

**API ID:** `academic-service.students.sponsor-assignment.details`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the [sponsor category](../sponsor-categories/get-sponsor-categories.md) a student is assigned to, with its details resolved.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the student's sponsor-category details as the `data` payload, including the category label and its `mandatoryFeeCheck` flag. See [api/README.md](../../../README.md) for the envelope.

Because [assignment](./post-assign-sponsor-category.md) does not verify the category exists, and [category deletion](../sponsor-categories/delete-sponsor-category.md) performs no referential check, a student can hold an assignment whose category no longer resolves — expect null or empty category details in that case rather than an error.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no sponsor-category assignment |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-24 | Vaishnav | Route moved from `/api/v1/studentsponsorassignment/…` to `/api/v1/students/sponsor-assignment/…` — the old prefix wasn't covered by any gateway route and 404'd through the gateway |
| 2026-08-17 | Vaishnav | Initial version created |
