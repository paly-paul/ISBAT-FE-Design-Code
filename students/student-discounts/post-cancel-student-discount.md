# POST /api/v1/students/{studentGuid}/discount/cancel

**API ID:** `academic-service.students.student-discounts.cancel`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; **no fine-grained permission**.

## Description
Ends a student's discount assignment. It is a **cancellation, not a delete** — the record stays with a cancelled status and a cancelled-at semester, so past semesters keep the discount they were billed with.

`includeCurrentSemester` decides when the cancellation bites:

| Value | Effect |
|---|---|
| `false` (default) | The discount still applies to the **current** semester; it stops from the next one. Status becomes `Cancelled`. |
| `true` | The discount stops **immediately**, including the semester now being billed. Status becomes `CancelledImmediate`. |

Getting this wrong changes what the student owes this semester, so send it explicitly rather than relying on the default.

Cancelling is also the prerequisite for deleting the discount itself in Finance — see [GET /students/discounts/{discountGuid}/active-assignment-count](./get-active-assignment-count.md), which only counts Active assignments.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `includeCurrentSemester` | bool | No | Defaults to **`false`** — the discount survives the current semester unless you opt in |

## Request body
None — the `POST` carries no payload; the only input is the query flag.

## Validation
None — this command has no validator.

## Response 200
Returns the cancellation result as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no discount assignment to cancel |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
