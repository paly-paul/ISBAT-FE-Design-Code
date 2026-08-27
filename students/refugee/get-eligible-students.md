# GET /api/v1/students/refugee/eligible

**API ID:** `academic-service.students.refugee.eligible`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the students who **may be given refugee status** but do not currently hold it — the candidate list for [POST /students/refugee/{studentGuid}](./post-assign-refugee-status.md).

The complement is [GET /students/refugee](./get-refugee-students.md), which lists those who already hold the status.

**Unpaged and unfiltered** — the full candidate set comes back in one call.

## Path params
None.

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the eligible students as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

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
