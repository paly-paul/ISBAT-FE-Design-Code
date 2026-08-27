# POST /api/v1/students/resume/{studentGuid}/resume

**API ID:** `academic-service.students.student-resuming.resume`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Moves any student (any `REGSTATUS`) into a new semester/batch/fee. Before writing anything, enforces a fee-clearance gate: if the student is moving to a different semester and `MandatoryFeeCheck = 1`, the endpoint calls Finance to verify the old semester is fully paid — if not, returns `400` with no state change. On success, atomically inserts a `T_STUDENT_RESUME` audit row, clones history with `REMARKS = 'Resuming Student'`, deactivates the old history, and sets `REGSTATUS` based on registration fee payment.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | `Guid` | Yes | Any active student |

## Query params
None.

## Request body
```json
{
  "studentGuid": "f8c6fa4f-1ee1-4d8a-b897-05797ea995be",
  "newSemesterGuid": "1b490442-6eb5-43ee-8baf-c51207e2101d",
  "newBatchGuid": "077eefea-2fa6-4465-b4e2-7a935f416141",
  "newFeeGuid": "a07b1787-5942-4aa3-be62-7518ce295e4c"
}
```

**Note:** `studentGuid` in the body is overridden by the route `{studentGuid}` param.

## Validation
None via FluentValidation — guard logic enforced inside the handler:
- Student must exist with an active history.
- **Fee-clearance gate:** If `newSemesterGuid != currentSemesterGuid` AND `MandatoryFeeCheck = 1`, Finance `semester-fee-status` must return `isFullyPaid = true` for the current semester.
- `newFeeGuid` must resolve to a valid fee head in Academic.

## Response 200
Returns a `ResumeResultDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "studentGuid": "f8c6fa4f-1ee1-4d8a-b897-05797ea995be",
    "studentRegNo": "021240602",
    "studentName": "ABAHO JONARD"
  },
  "message": "Student resumed successfully.",
  "code": null,
  "errors": null
}
```

**What happens internally:**
1. Fee-clearance gate checked first — no writes if it fails.
2. Old history row: `ACTIVE = 0 (Inactive)`.
3. New history row: `ACTIVE = 1 (Active)`, `REMARKS = 'Resuming Student'`, discount fields copied unchanged.
4. `REGSTATUS` on new history: `1 (Registered)` if reg fees paid or `MandatoryFeeCheck = 0`; otherwise `2 (Yet to Register)`.
5. Audit row written to `T_STUDENT_RESUME` with Guid references.
6. All writes in a single `SaveChangesAsync` (atomic).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Student not found |
| 400 | `bad_request` | Student has no active history; fee structure not found; or fee-clearance gate failed ("Please clear previous semester fees before proceeding.") |

## Used by pages
| Page | Route |
|---|---|
| Student Resuming Form | /students/resume/{studentGuid} |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-21 | Nebu Salim | Initial version created |
