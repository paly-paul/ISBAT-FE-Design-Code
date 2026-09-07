# DELETE /api/v1/academic/program-master/{programGuid}/delete-complete

**API ID:** `academic-service.academic.program-master.delete-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Soft-deletes a program **and everything hanging off it** — its course units, its fee structures, and every fee line under those fee structures — in one transaction.

This is the delete you normally want. [DELETE /program-master/{programGuid}](./delete-program-master.md) removes the header only and leaves the units and fee structures active but orphaned.

Everything is a soft delete (`isDeleted = true`); nothing is physically removed, and historical payments that reference the deleted fee lines still resolve. There is **no referential check** against enrolled students or timetable entries, and no confirmation step.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | Guid | Yes | Route-constrained to `:guid` |

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
Returns `true` as the `data` payload, with `message: "Program and all related data deleted successfully."`.

```json
{
  "success": true,
  "data": true,
  "message": "Program and all related data deleted successfully.",
  "code": null,
  "errors": null
}
```

The audit trail records `"Delete complete program {code} - {name} with all course units and fee structures"` — a single entry covering the whole cascade, not one per child row.

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
