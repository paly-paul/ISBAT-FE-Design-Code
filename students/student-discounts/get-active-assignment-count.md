# GET /api/v1/students/discounts/{discountGuid}/active-assignment-count

**API ID:** `academic-service.students.discounts.active-assignment-count`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns how many students currently hold an **active** assignment of a given [discount](../../../finance-service/discounts/get-discounts.md).

This exists for one caller: [DELETE /finance/discounts/{guid}](../../../finance-service/discounts/delete-discount.md) calls it before deleting a discount and **refuses the delete** if the count is greater than zero — or if this endpoint cannot be reached at all. It is the referential check that Finance cannot perform itself, because discount assignments live in the Students database.

Note the route shape: the `{discountGuid}` sits under `/students/discounts/`, so this is keyed by the **discount**, not by a student.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `discountGuid` | Guid | Yes | The discount whose assignments are being counted. Route-constrained to `:guid`. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the count as the `data` payload.

```json
{
  "success": true,
  "data": 3,
  "message": null,
  "code": null,
  "errors": null
}
```

Only **Active** assignments are counted — cancelled ones (`Cancelled`, `CancelledImmediate`) are excluded, which is what lets a discount be deleted once its assignments have been cancelled via [POST /students/{studentGuid}/discount/cancel](./post-cancel-student-discount.md).

An unknown `discountGuid` returns `0`, not a 404.

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
