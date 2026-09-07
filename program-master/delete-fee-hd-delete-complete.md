# DELETE /api/v1/academic/Programfee-structure/hd/{feeHdGuid}/delete-complete

**API ID:** `academic-service.academic.fee-structure.delete-hd-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Soft-deletes a fee header **and all its fee lines** in one transaction. This is the only delete on the fee-structure resource — there is no header-only delete and no per-line delete (to drop a single line, use [PUT /Programfee-structure/hd/{feeHdGuid}/update-complete](./put-fee-hd-update-complete.md) with that line omitted).

Everything is a soft delete (`isDeleted = true`). **No referential check** against payments already allocated to these fee lines — historical payment rows keep resolving, but the structure disappears from future fee calculation, so a student mid-program on this structure will stop being billed correctly. Move them to another structure first.

Note the route casing: `Programfee-structure`. See the note on [GET /Programfee-structure](./get-fees-by-program.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `feeHdGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Fee header must exist | 404 `not_found` |

## Response 200
Returns the standard envelope confirming the delete. See [api/README.md](../../../README.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No fee header with this GUID, or it is already soft-deleted |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
