# GET /api/v1/students/id-cards/search

**API ID:** `academic-service.students.id-cards.search`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Finds a student to issue or renew an ID card for. A narrow, purpose-built search — registration number and name only — feeding the ID-card desk.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `studentRegNo` | string | No | Max 50 chars |
| `studentName` | string | No | Max 100 chars — note this is **100** here, while [POST /students/search/search](../student-search/post-student-search.md) allows only 50 for the same concept |
| `pageNumber` | int | No | 1-based. Defaults to `1`. |
| `pageSize` | int | No | Defaults to `25`. Capped at 200 by validation. |

Both filters are optional; omitting both returns the first page of all students.

## Request body
None.

## Validation
`SearchStudentForIdCardQueryValidator`:

| Field | Rule | Notes |
|---|---|---|
| `pageNumber` | must be ≥ 1 | |
| `pageSize` | must be between 1 and 200 inclusive | |
| `studentRegNo` | max 50 chars | |
| `studentName` | max 100 chars | |

## Response 200
Returns a paged list of students as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

Take `studentGuid` into [GET /students/id-cards/{studentGuid}](./get-id-card-details.md) to see the card history before issuing.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Paging out of range, or an over-long filter |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
