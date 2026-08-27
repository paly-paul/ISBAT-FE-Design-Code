# POST /api/v1/students/{studentGuid}/discount

**API ID:** `academic-service.students.student-discounts.assign`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; **no fine-grained permission** — any authenticated user can grant a fee discount.

## Description
Assigns a [discount](../../../finance-service/discounts/get-discounts.md) to a student. This directly reduces what the student is billed, from `effectiveFromSemesterGuid` onward.

The assignment may **override the discount's own terms**: supplying `calcType` and `amtPer` here overrides the values configured on the discount itself, so two students on the same discount can receive different amounts. Omit both to inherit the discount's configuration.

A student holds at most one assignment — to change the terms later use [PUT](./put-student-discount.md), and to end it use [cancel](./post-cancel-student-discount.md). An active assignment also **blocks deletion of the discount** in Finance; see [GET /students/discounts/{discountGuid}/active-assignment-count](./get-active-assignment-count.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
```json
{
  "discountGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "calcType": 2,
  "amtPer": 10,
  "cop": null,
  "effectiveFromSemesterGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "remarks": "Staff dependant"
}
```

| Field | Notes |
|---|---|
| `discountGuid` | Required — the Finance discount being granted |
| `calcType` | `1` = Amount, `2` = Percentage. Nullable; omit to inherit from the discount. Sent as a **byte** here, though Finance's own `DiscountCalcType` is an `int` — the values line up. |
| `amtPer` | The flat amount or percentage. Nullable; omit to inherit. |
| `cop` | Legacy field carried through from the Finance discount |
| `effectiveFromSemesterGuid` | The semester the discount starts applying from. **Nullable and unvalidated** — behaviour when omitted is decided by the resolution logic in Finance, so send it explicitly. |
| `remarks` | Free text, max 500 chars |

## Validation
`AssignStudentDiscountCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `discountGuid` | required, must not be empty | **Existence is not checked** — a GUID matching no Finance discount is accepted |
| `calcType` | must be between 1 and 2 inclusive, **only when supplied** | |
| `amtPer` | must be > 0, **only when supplied** | |
| `amtPer` | must be ≤ 100 **when `calcType == 2`** | Message: `"Percentage cannot be more than 100."` Mirrors the rule on [POST /finance/discounts](../../../finance-service/discounts/post-discount.md) |
| `remarks` | max 500 chars | |
| `effectiveFromSemesterGuid`, `cop` | **no rules** | |

Note the path `studentGuid` has no rule either, and the student's existence is not verified.

## Response 201
Returns the created assignment as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Missing `discountGuid`, out-of-range `calcType`/`amtPer`, or over-long remarks |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
