# GET /api/v1/students/refugee/{studentGuid}

**API ID:** `academic-service.students.refugee.get`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns one student's refugee-status record — their refugee id, country code and the supporting document uploaded at [assignment](./post-assign-refugee-status.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid`, so it never shadows the sibling `/eligible` route |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the student's refugee details as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

`intCountryCode` is the **legacy integer** country key, not a GUID — the same form the [student search](../student-search/post-student-search.md) filter takes.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no refugee-status record |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
