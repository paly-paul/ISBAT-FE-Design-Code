# POST /api/v1/assessment/ue-mark-import/sheets

**API ID:** `assessment-attendance-service.assessment.ue-mark-import.get-sheets`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required (`erp_access` cookie). Permission `assessment.uemarkimport.get` is defined in `AssessmentPermissionCatalog` but currently commented out on the endpoint (not yet enforced).

## Description
Reads the worksheet names inside an uploaded `.xlsx` file — same method as Question Bank Import's
Get Sheets (`XlsxWorkbookReader.GetSheetNames`). The file is read entirely in memory and is not
stored anywhere.

## Request body
`multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | yes | The workbook to inspect |

## Response 200
```json
{
  "success": true,
  "data": ["Project_Template", "Practical_Template", "MasterTheory_Template", "BachelorTheory_Template"],
  "message": null,
  "code": null,
  "errors": null
}
```
Sheet names, in tab order.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 500 | `server_error` | File isn't a readable `.xlsx` workbook |

## Used by pages
No page doc references this endpoint yet.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-27 | Akshara | Initial version created |
