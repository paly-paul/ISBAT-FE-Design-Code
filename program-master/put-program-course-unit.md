# PUT /api/v1/academic/program-course-units

**API ID:** `academic-service.academic.program-course-units.update`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates one course-unit assignment on a program — its stream, unit type, unit category or flag.

> **The target is identified by the body, not the path.** The route has no `{guid}` segment; the row is located by the `programGuid` + `courseUnitGuid` + `semCode` triple in the body, which is the assignment's natural key. The same is true of [DELETE /program-course-units](./delete-program-course-unit.md), which takes its key from the query string instead.

To change the *semester* a unit sits in, delete the assignment and re-add it — `semCode` is part of the key, not an editable field.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "programGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "semCode": 2,
  "courseUnitGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "streamGuid": null,
  "unitTypeGuid": "…",
  "unitCatGuid": "…",
  "flag": 1
}
```

| Field | Notes |
|---|---|
| `programGuid` + `courseUnitGuid` + `semCode` | Together identify the row to update — all three are part of the key, none are editable |
| `streamGuid` | Optional [specialization](../specializations/get-specializations.md) the unit belongs to. Nullable. |
| `unitTypeGuid` | Optional [unit type](../unit-types/get-unit-types.md). Nullable. |
| `unitCatGuid` | Optional [unit category](../unit-categories/get-unit-categories.md). Nullable. |
| `flag` | Byte flag carried over from the legacy schema |

## Validation
No FluentValidation validator is registered for this command — every check happens in the handler.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| The assignment must exist for that program/unit/semester triple | 404 `not_found` |
| Referenced stream, unit type and unit category must resolve when supplied | 400/404 carrying the offending reference's message |

## Response 200
Returns the standard envelope confirming the update. See [api/README.md](../../../README.md).

Re-fetch with [GET /program-course-units/{programGuid}](./get-program-course-units.md) to see the saved state.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | A referenced stream, unit type or unit category does not resolve |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No assignment matches the program/unit/semester triple |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
