# DELETE /api/v1/academic/program-course-units

**API ID:** `academic-service.academic.program-course-units.delete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Removes one course-unit assignment from a program — it detaches the unit from that program/semester, it does **not** delete the [course unit](../courseunits/get-courseunits.md) itself.

> **The target comes from the query string, not the path.** The route has no `{guid}` segment; all three key parts are query parameters on a DELETE, which is unusual for this codebase. Compare [PUT /program-course-units](./put-program-course-unit.md), which takes the same key in a JSON body.

## Path params
None.

## Query params
All three are **non-optional bindings** — omit any and the request fails binding with a 400.

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | Guid | **Yes** | |
| `courseUnitGuid` | Guid | **Yes** | |
| `semCode` | int | **Yes** | The semester ordinal within the program. Part of the assignment's key, so the same unit can be attached to several semesters independently. |

## Request body
None.

## Validation
No FluentValidation validator is registered — the handler performs the existence check.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| The assignment must exist for that program/unit/semester triple | 404 `not_found` |

No referential check against timetable entries that already teach this unit for the program.

## Response 200
Returns the standard envelope confirming the delete. See [api/README.md](../../../README.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (binding) | A required query parameter is missing or unparseable |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No assignment matches the program/unit/semester triple |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
