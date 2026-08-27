# GET /api/v1/students/{guid}

**API ID:** `academic-service.students.students.get`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a single student by their GUID.

`studentGuid` is the key the rest of the system hangs off: the Finance payment console takes it as an optional parameter to scope [outstanding ledgers](../../../finance-service/payment-console/get-outstanding-ledgers.md) by the student's real academic status, and it identifies the student in the [discount](../student-discounts/get-student-discount.md), [refugee](../refugee/get-student-refugee-details.md), [sponsor](../sponsor-assignment/get-sponsor-details.md) and [ID card](../id-cards/get-id-card-details.md) sub-resources.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `studentGuid`. Route-constrained to `:guid`, so it never shadows the sibling `/register`, `/counts-by-batch` etc. routes. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the student record as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No student with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
