# POST /api/v1/assessment/ue-mark-import/preview

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.preview`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.preview` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Parses and validates the given sheet without saving anything — the "preview grid" step (legacy
Import button, before Save). `SheetName` is optional; omit to use the first sheet.

Guard checks first: exam exists → not already verified ("Import Failed. Marks are already
verified...!!!") → attendance exists.

Then, in order, stopping at the first failing rule: header column count (varies by branch — Project
10, Practical 8, Theory 6 or 7 columns, including `SLNO`/`MATCHINGCODE`/`REGNO`/`STUDENTNAME`) → drop
blank-`SLNO` rows → "already added" check (`MatchingCode` already in `T_IA_UE_DETAILED_MARKS`) →
blank `MatchingCode` → not present in attendance register → branch-specific blank checks →
branch-specific max-mark checks (legacy hardcoded maxes: Project 15/15/20/20/15/15, Practical
10/30/10/20, Master's Theory 60/40, Bachelor's Theory 20/60/20).

`MatchingCode` is computed server-side from real attendance + real Student-service legacy ids —
never trusted from the uploaded file's own values beyond string matching.

## Request body
`multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | yes | The filled-in marks workbook |
| `SheetName` | string | no | Defaults to the first sheet |
| `UniversityExamGuid` | guid | yes | |

## Response 200
```json
{
  "success": true,
  "data": [
    {
      "slNo": "1",
      "matchingCode": "32444493",
      "studentGuid": "e29a8a6c-ac04-426f-9199-842e8b7180b2",
      "regNo": "022240764",
      "studentName": "Turyasingura Joab",
      "sectionAMark": 15,
      "sectionBMark": 50,
      "sectionCMark": 18,
      "recordMark": null,
      "codingMark": null,
      "outputMark": null,
      "vivaMark": null,
      "synopsisMark": null,
      "reviewMark": null,
      "methodologyMark": null,
      "analysisMark": null
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```
Real response captured against local dev data — exam `CA307565-EAFC-4465-B6C2-9D929888C4F8`
(Bachelor's Theory). Only the branch's own mark fields are non-null.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 400 | `bad_request` | `errors[0]` = the failing validation rule's message (see Description) |
| 500 | `server_error` | File isn't a readable `.xlsx` workbook |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
