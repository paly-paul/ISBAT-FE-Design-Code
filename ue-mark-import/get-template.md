# GET /api/v1/assessment/ue-mark-import/template

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.get-template`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.get` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Generates a live, exam-specific Excel template — legacy `btTemplate_Click`. Unlike a fixed, static
asset, this is rebuilt fresh on every call from the exam's real present-and-unmarked students.

Only present students (`T_IA_UE_ATTENDANCE.PRESENT=1`) who don't already have a row in
`T_IA_UE_DETAILED_MARKS` are included. Columns: `SLNO`, `MATCHINGCODE`, `REGNO`, `STUDENTNAME`, then
branch-specific blank mark columns (Project: `SYNOPSIS`/`REVIEW`/`METHODOLOGY`/`ANALYSIS`/`REPORT`/`VIVA`;
Practical: `RECORD`/`CODING`/`OUTPUT`/`VIVA`; Theory: `SECTIONA`/`SECTIONB`[/`SECTIONC` if not Master's level]).

`MATCHINGCODE` is pre-filled and never typed by the lecturer: `InternalAssessmentId + IntStudent`
(the exact legacy `CONVERT(VARCHAR,INTIA)+CONVERT(VARCHAR,INTSTUDENT)` formula), with `IntStudent`
fetched from the Student service's legacy `T_STUDENT.INTSTUDENT` column. `REGNO`/`STUDENTNAME` are
extra, purely for the lecturer's own visual confirmation — not used for matching.

Every generated file is archived to S3 via `IFileAttachmentService`, one dated copy per generation —
this endpoint returns a presigned URL, not the file bytes.

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| `universityExamGuid` | guid | yes | |

## Response 200
```json
{
  "success": true,
  "data": {
    "url": "https://erp-s3-bucket-.../assessment/uemarkimporttemplate/2026/09/<guid>.xlsx?...",
    "expiresAtUtc": "2026-09-27T14:05:00Z"
  },
  "message": null,
  "code": null,
  "errors": null
}
```
Generated filename: `UE_Mark_Import_Template_{universityExamGuid:N}_{yyyyMMddHHmmss}.xlsx`.
Sheet name: `{layout}_Template_{yyyyMMdd}` (e.g. `Theory_Template_20260927`).
S3 object key: `{KeyPrefix}/uemarkimporttemplate/{yyyy}/{MM}/{newGuid}.xlsx`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | University exam not found |
| 400 | `bad_request` | "No Students Found../Attendance not entered..!!!" — no attendance rows exist for this exam |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
