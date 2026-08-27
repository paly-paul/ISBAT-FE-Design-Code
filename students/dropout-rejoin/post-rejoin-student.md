# POST /api/v1/students/dropout-rejoin/{studentGuid}/rejoin

**API ID:** `academic-service.students.dropout-rejoin.rejoin`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Moves a dropout student into a new semester/batch/fee. Atomically: inserts a `T_STUDENT_REJOIN` audit row, clones the active history into a new row with `REMARKS = 'DropOut Rejoined'`, deactivates the old history, updates the student's current semester/batch/fee, and sets `REGSTATUS` based on registration fee payment. Returns `400` if the student is not a dropout.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | `Guid` | Yes | Must be a student with `REGSTATUS = 3 (DropOut)` in their active history |

## Query params
None.

## Request body
```json
{
  "studentGuid": "e6c6e819-0892-431a-adf2-c7b60961bfb4",
  "newSemesterGuid": "ac00ad77-9d41-48c4-9a78-fe3bf02cf3ae",
  "newBatchGuid": "077eefea-2fa6-4465-b4e2-7a935f416141",
  "newFeeGuid": "a07b1787-5942-4aa3-be62-7518ce295e4c"
}
```

**Note:** `studentGuid` in the body is overridden by the route `{studentGuid}` param.

## Validation
None via FluentValidation — guard logic enforced inside the handler:
- Student must exist.
- Active history must have `REGSTATUS = 3`.
- `newFeeGuid` must resolve to a valid fee head in Academic.

## Response 200
Returns a `RejoinResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "studentGuid": "e6c6e819-0892-431a-adf2-c7b60961bfb4",
    "studentRegNo": "011260182",
    "studentName": "AINE-OMUGISHA VERON"
  },
  "message": "Student rejoined successfully.",
  "code": null,
  "errors": null
}
```

**What happens internally:**
1. Old history row: `ACTIVE = 0 (Inactive)`.
2. New history row: `ACTIVE = 1 (Active)`, `REMARKS = 'DropOut Rejoined'`, discount fields copied unchanged.
3. `REGSTATUS` on new history: `1 (Registered)` if reg fees paid or `MandatoryFeeCheck = 0`; otherwise `2 (Yet to Register)`.
4. Audit row written to `T_STUDENT_REJOIN` with Guid references.
5. All writes in a single `SaveChangesAsync` (atomic).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Student not found |
| 400 | `bad_request` | Student is not a dropout, has no active history, or fee structure not found |

## Used by pages
| Page | Route |
|---|---|
| Dropout Rejoin Form | /students/dropout-rejoin/{studentGuid} |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-21 | Nebu Salim | Initial version created |
