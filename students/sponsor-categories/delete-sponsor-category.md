# DELETE /api/v1/students/sponsor-categories/{guid}

**API ID:** `academic-service.students.sponsor-categories.delete`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Deletes a sponsor category.

**No referential check** — students already assigned to this category keep pointing at it, and their [sponsor details](../sponsor-assignment/get-sponsor-details.md) will reference a category that no longer resolves. Reassign affected students first with [POST /students/sponsor-assignment/{studentGuid}/sponsor-assignment](../sponsor-assignment/post-assign-sponsor-category.md).

Contrast the Finance module's [discount delete](../../../finance-service/discounts/delete-discount.md), which does check for active assignments before proceeding — there is no equivalent guard here.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `sponsorCategoryGuid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the standard envelope confirming the delete. See [api/README.md](../../../README.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No sponsor category with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
