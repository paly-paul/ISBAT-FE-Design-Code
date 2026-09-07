# DELETE /api/v1/academic/program-master/{programGuid}

**API ID:** `academic-service.academic.program-master.delete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Soft-deletes the program **header only** (`isDeleted = true`). Its course units and fee structures are **left untouched and still active**, orphaned behind a hidden program.

That is almost never what you want. Use [DELETE /program-master/{programGuid}/delete-complete](./delete-program-delete-complete.md) instead, which cascades to units and fee structures in one transaction. This endpoint is the narrow variant kept for the header-only edit flow.

No referential check against enrolled students or existing timetable entries.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | Guid | Yes | Route-constrained to `:guid`. Note the sibling `/delete-complete` route is a distinct endpoint. |

## Query params
None.

## Request body
None.

## Validation
None.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Program must exist | 404 `not_found` — `"Program not found."` |

## Response 200
Returns `true` as the `data` payload, with `message: "Program deleted successfully."`.

The audit trail records `"Delete program {code} - {name}"`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No program with this GUID, or it is already soft-deleted |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
