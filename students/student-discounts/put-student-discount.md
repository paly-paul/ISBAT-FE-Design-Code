# PUT /api/v1/students/{studentGuid}/discount

**API ID:** `academic-service.students.student-discounts.update`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; **no fine-grained permission**.

## Description
Updates the terms of a student's existing discount assignment — its `calcType`, `amtPer`, `cop` and remarks.

**What cannot change here:** the `discountGuid` and the `effectiveFromSemesterGuid` are absent from the request, so neither the discount being granted nor the semester it starts from can be edited. To change either, [cancel](./post-cancel-student-discount.md) the assignment and [assign](./post-assign-student-discount.md) again.

Changes take effect on **future** fee resolution — semesters already billed and paid are not restated.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid`. The assignment is singular per student, so no assignment id is needed. |

## Query params
None.

## Request body
```json
{
  "calcType": 2,
  "amtPer": 15,
  "cop": null,
  "remarks": "Increased to 15% from FY26"
}
```

## Validation
`UpdateStudentDiscountCommandValidator` — the same rules as [assign](./post-assign-student-discount.md), minus the `discountGuid` rule:

| Field | Rule | Notes |
|---|---|---|
| `calcType` | must be between 1 and 2 inclusive, **only when supplied** | `1` = Amount, `2` = Percentage |
| `amtPer` | must be > 0, **only when supplied** | |
| `amtPer` | must be ≤ 100 **when `calcType == 2`** | Message: `"Percentage cannot be more than 100."` |
| `remarks` | max 500 chars | |
| `cop` | **no rule** | |

Every field is optional, so an empty body `{}` passes validation.

## Response 200
Returns the updated assignment as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Out-of-range `calcType`/`amtPer`, or over-long remarks |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no discount assignment to update |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
