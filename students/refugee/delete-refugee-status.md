# DELETE /api/v1/students/refugee/{studentGuid}

**API ID:** `academic-service.students.refugee.remove`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Removes a student's refugee status. The student returns to the [eligible](./get-eligible-students.md) list and drops out of [the refugee list](./get-refugee-students.md).

Re-granting the status requires re-uploading the supporting document via [POST /students/refugee/{studentGuid}](./post-assign-refugee-status.md) — there is no restore.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
`RemoveStudentRefugeeStatusCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `studentGuid` (path) | must not be empty | The only rule |

## Response 200
Returns the standard envelope confirming the removal. See [api/README.md](../../../README.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `studentGuid` is empty |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no refugee-status record |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
