# GET /api/v1/assessment/ue-mark-import/exam

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.get-exam`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.get` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Resolves the University Exam for the selected Programme/Semester/Course Unit/Intake/UE Type and
returns its mark-entry layout plus the exam rule's configured section weights — legacy `BindMaxMark`
(`T_IA` ⋈ `T_IA_UE` ⋈ `M_EXAM_RULES`). `layout` tells the frontend which branch of the UI to show
(Theory / Practical / Project); `maxMarks` reflects that exam's own rule weighting, which is
separate from the hardcoded per-section validation maximums enforced by Preview/Import (see
[POST .../preview](./post-preview.md)).

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | guid | yes | |
| `semesterGuid` | guid | yes | |
| `courseUnitGuid` | guid | yes | |
| `intakeGuid` | guid | yes | |
| `ueType` | enum (`UeType`) | yes | `0` = first-sit, per legacy `rbReportType`/`UE.UETYPE` |

## Response 200
```json
{
  "success": true,
  "data": {
    "universityExamGuid": "ca307565-eafc-4465-b6c2-9d929888c4f8",
    "layout": 0,
    "maxMarks": {
      "sectionAMax": 2.00,
      "sectionBMax": 15.00,
      "sectionCMax": 20.00,
      "recordMax": null,
      "codingMax": null,
      "outputMax": null,
      "vivaMax": null,
      "synopsisMax": null,
      "reviewMax": null,
      "methodologyMax": null,
      "analysisMax": null
    },
    "isVerified": false
  },
  "message": null,
  "code": null,
  "errors": null
}
```
`layout`: `0`=Theory, `1`=Practical, `2`=Project (`UeMarkEntryLayout` enum). Only the fields relevant
to that layout are non-null. `isVerified` mirrors legacy's `ISNULL(VERIFY,0)` check — when `true`,
Preview/Import both reject with "Import Failed. Marks are already verified...!!!".

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No matching University Exam for the given selection |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
