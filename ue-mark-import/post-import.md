# POST /api/v1/assessment/ue-mark-import/import

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.import`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.import` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Re-validates the sheet from scratch (identical rules to [POST .../preview](./post-preview.md),
duplicated rather than shared — same convention as Question Bank Import's Preview/Import split) and,
if it passes, saves the marks. Legacy Save button — the actual commit, as opposed to Preview which
never writes anything. Never trusts that an earlier Preview call is still accurate.

Builds one `UniversityExamDetailedMarkEntity` per validated row, with only that branch's fields
populated (everything else `NULL`) and `TotalMark` computed the same way legacy's `M_InsertUEMarks`
did: sum of every non-null mark, nulls treated as zero. If nothing survives validation: `400
bad_request` — "Please import marks before saving!!!" (legacy's exact message).

On success also uploads the source `.xlsx` to S3 (owner type `UeMarkImportUpload`, owner id
`{UniversityExamGuid}:{timestamp}` — one dated copy per import, never overwritten) in the same
transaction as the mark inserts. Rolls back and removes the S3 object if either half fails.

Not reproduced: legacy's `T_UEMARK_TRAIL`/`T_UEMARK_TRAIL_TL` field-by-field audit insert inside
`M_InsertUEMarks` — out of scope per this project's audit-trail-tables policy. This module's own
`CreatedBy`/`CreatedDate` audit fields are the equivalent kept instead.

To see saved marks afterwards: `GET /api/v1/assessment/ue-detailed-marks/{universityExamGuid}` —
both features read/write the same `T_IA_UE_DETAILED_MARKS` table.

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
  "data": true,
  "message": "Marks Saved successfully......!",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 400 | `bad_request` | Same validation as Preview — nothing saved or uploaded |
| 500 | `server_error` | File isn't readable, or the save transaction fails |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
