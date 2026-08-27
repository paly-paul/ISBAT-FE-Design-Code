# GET /api/v1/students/{studentGuid}/discount

**API ID:** `academic-service.students.student-discounts.get`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a student's discount assignment — which [discount](../../../finance-service/discounts/get-discounts.md) they hold, on what terms, and from/until which semester.

**A student has at most one discount assignment**, which is why this resource has no list endpoint and no assignment identifier in its routes: `/students/{studentGuid}/discount` is singular throughout, and [assign](./post-assign-student-discount.md), [update](./put-student-discount.md) and [cancel](./post-cancel-student-discount.md) all act on that one record.

For how the discount actually resolves against a semester's tuition, see Finance's [GET /payment-console/discount](../../../finance-service/payment-console/get-discount-info.md) — that is the endpoint that decides whether an assignment applies to the semester being billed.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the student's discount assignment as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

The record carries the discount reference, the assignment's own `calcType`/`amtPer` overrides, its status (Active / Cancelled / CancelledImmediate), and the effective-from and cancelled-at semester GUIDs that make resolution semester-aware.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no discount assignment — the common case, so treat it as "no discount", not a failure |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
