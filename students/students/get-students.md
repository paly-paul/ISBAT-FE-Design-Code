# GET /api/v1/students

**API ID:** `academic-service.students.students.list`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a paged list of students with a single free-text search. For anything more selective — by program, batch, campus, sponsor category, refugee status, gender — use [POST /students/search/search](../student-search/post-student-search.md), which takes a full filter object.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | No | Free-text match. Omit to return all students. |
| `page` | int | No | 1-based page index. Defaults to `1`. Not validated. |
| `pageSize` | int | No | Defaults to **`25`**. No upper bound enforced here, unlike the [student search](../student-search/post-student-search.md), which caps at 200. |

## Request body
None.

## Validation
None — this query has no validator.

## Response 200
Returns a paged list of students as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

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
