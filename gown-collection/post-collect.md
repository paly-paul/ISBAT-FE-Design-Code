# POST /api/v1/assessment/gown-collection/{studentGuid}/collect

**API ID:** `assessment-service.gown-collection.collect`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required — validated via `erp_access` cookie at the gateway, plus permission `assessment.gowncollection.record` (`AssessmentPermissionCatalog.GownCollection.Record`).

## Description
Records that a confirmed graduate has physically collected their graduation gown — equivalent to legacy's `frmTrnStudentGownCollection` "Gown" button, which set `T_GRADUATIONLIST.GOWNCOLLECTION = 1`. This is a one-way stamp: once a student's gown is marked collected, a second call against the same `studentGuid` is rejected rather than silently succeeding again.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | guid | Yes | From the search response |

## Request body
None.

## Response 200
```json
{
  "success": true,
  "data": true,
  "message": "Gown collection recorded successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 404 | `not_found` | `studentGuid` is not on the confirmed graduation list |
| 400 | `bad_request` | Gown already collected for this student |
| 403 | `forbidden` | Caller lacks the `assessment.gowncollection.record` permission |

## Calls internally
| Service | Endpoint | Purpose |
|---|---|---|
| erp-assessment-attendance-service | (internal) `IGraduationListRepository.GetTrackedConfirmedByStudentGuidAsync` | Load the confirmed graduation-list row (tracked) to validate and update |
| erp-academic-service | `IStudentServiceClient.GetByGuidAsync` | Student name for the audit log summary (single lookup, not part of the collection decision) |

## Used by pages
_(no page doc yet — frontend not built at time of writing)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-10-01 | Nebu Salim | Initial version created |
