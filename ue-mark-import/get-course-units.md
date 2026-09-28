# GET /api/v1/assessment/ue-mark-import/units

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.get-units`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.get` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Course Unit dropdown for the given Programme + Semester — legacy `frmTrnIAUEMarkImport.aspx.cs`'s `BindCourseUnit`. Returns the union of:
- **Direct units** (`M_PROGRAM_UNITS.FLAG=1`) scoped to the selected Programme/Semester.
- **Combination units** (`FLAG=2`): each such row's `INTUNIT` holds an `M_COMBINATION` id rather than a real course unit id, expanded to the real course units belonging to that combination through `M_COMBINATION_COURSEUNITS`.

Not reproduced: the lecturer-restriction branch (`T_PROGRAM_PLANNING`) — already commented out/inactive in the legacy source itself.

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | yes | |
| `semesterGuid` | guid | yes | |

## Response 200
```json
{
  "success": true,
  "data": [
    { "courseUnitGuid": "393253dc-49e8-4f5a-840c-b50b336d36d5", "courseUnitCode": "BNCS124", "courseUnitName": "Introduction to algorithms" },
    { "courseUnitGuid": "71b6505f-3129-44df-95b2-054829056cd6", "courseUnitCode": "BNCS125", "courseUnitName": "Operating Systems" }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```
Sorted by `courseUnitCode`. Combination-expanded units (if any) are merged into the same list by `CourseUnitGuid` (no duplicates if a unit is somehow both a direct and combination member).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
