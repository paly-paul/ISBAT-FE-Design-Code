# GET /api/v1/students/refugee

**API ID:** `academic-service.students.refugee.list`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the students who currently hold refugee status. The complement is [GET /students/refugee/eligible](./get-eligible-students.md), which lists candidates who do not.

**Unpaged and unfiltered** — the full set comes back in one call. To filter refugee students by program, batch or campus, use [POST /students/search/search](../student-search/post-student-search.md) with its `refugee` filter instead.

## Path params
None.

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the refugee students as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

An empty result is a normal 200, not a 404.

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
