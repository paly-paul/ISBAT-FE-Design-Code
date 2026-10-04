# GET /api/v1/assessment/gown-collection/search

**API ID:** `assessment-service.gown-collection.search`
**Service:** erp-assessment-attendance-service
**Module:** Assessment
**Auth:** Required — validated via `erp_access` cookie at the gateway, plus permission `assessment.gowncollection.search` (`AssessmentPermissionCatalog.GownCollection.Search`).

## Description
Searches confirmed graduates (`T_GRADUATIONLIST.REGISTRATIONSTATUS = 1`) by student number or name, for the graduation-day gown collection desk — equivalent to legacy's `frmTrnStudentGownCollection` search grid. Returns each match's gown-collection status inline, so the frontend doesn't need a second call to know whether a result has already collected.

Name/number resolution is a single batched call to the student service (`IStudentServiceClient.GetResitCandidatesAsync`), scoped to the confirmed-graduate guid list fetched locally first — not a per-student lookup.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | Yes | Matched against student number or name by the student service; blank returns an empty list |

## Request body
None.

## Response 200
```json
{
  "success": true,
  "data": [
    {
      "studentGuid": "4e2f6b8e-1234-4a2b-9c3d-abcdef123456",
      "studentNumber": "012221999",
      "studentName": "JANE DOE SAMPLE",
      "programName": "Bachelor of Science in Applied Information Technology",
      "batchCode": "BATCH-2022",
      "isGownCollected": false
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

### Response fields
| Field | Type | Notes |
|---|---|---|
| `studentGuid` | guid | Pass this to the collect endpoint |
| `studentNumber` | string\|null | |
| `studentName` | string\|null | |
| `programName` | string\|null | |
| `batchCode` | string\|null | |
| `isGownCollected` | bool | `true` means already collected — hide/disable the collect action for this row |

## Errors
| Status | Code | Reason |
|---|---|---|
| 403 | `forbidden` | Caller lacks the `assessment.gowncollection.search` permission |

## Calls internally
| Service | Endpoint | Purpose |
|---|---|---|
| erp-assessment-attendance-service | (internal) `IGraduationListRepository.GetConfirmedStudentGuidsAsync` | Students on the confirmed graduation list |
| erp-academic-service | `IStudentServiceClient.GetResitCandidatesAsync` (batched) | Student number/name/program/batch for the matching guids |
| erp-assessment-attendance-service | (internal) `IGraduationListRepository.GetConfirmedByStudentGuidsAsync` | Gown-collection flag for the matched students |

## Used by pages
_(no page doc yet — frontend not built at time of writing)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-10-01 | Nebu Salim | Initial version created |
