# GET /api/v1/students/sponsor-categories/{guid}

**API ID:** `academic-service.students.sponsor-categories.get`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a single sponsor category by its GUID.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `sponsorCategoryGuid`. Route-constrained to `:guid`. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the sponsor category as the `data` payload — same shape as an item from [GET /students/sponsor-categories](./get-sponsor-categories.md). See [api/README.md](../../../README.md) for the envelope.

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
