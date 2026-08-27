# GET /api/v1/students/sponsor-categories

**API ID:** `academic-service.students.sponsor-categories.list`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a paged list of sponsor categories — the classifications a student's funding source falls under (self-paid, HEC, corporate sponsorship, …). A student is placed into one via [POST /students/sponsor-assignment/{studentGuid}/sponsor-assignment](../sponsor-assignment/post-assign-sponsor-category.md).

Each category carries a `mandatoryFeeCheck` flag that downstream fee handling reads.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `page` | int | No | 1-based page index. Defaults to `1`. Not validated. |
| `pageSize` | int | No | Defaults to **`25`**. No upper bound enforced. |

## Request body
None.

## Validation
None.

## Response 200
Returns a paged list of sponsor categories as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

| Field | Notes |
|---|---|
| `sponsorCategoryGuid` | Pass this as `sponsorCategoryGuid` when assigning a student |
| `category` | The category label — max 10 chars, so these are short codes rather than descriptive names |
| `mandatoryFeeCheck` | Nullable byte flag |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
