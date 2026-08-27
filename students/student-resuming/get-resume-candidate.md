# GET /api/v1/students/resume/{studentGuid}/candidate

**API ID:** `academic-service.students.student-resuming.get-candidate`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the candidate profile and dropdown options needed to populate the Resume form for any student. Unlike the Rejoin candidate endpoint, there is no `REGSTATUS` precondition — any student can be resumed. All semesters for the program are available (unrestricted), not just current and current+1. Student search uses the existing `GET /api/v1/students/?searchTerm=` endpoint.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | `Guid` | Yes | Any active student |

## Query params
None.

## Request body
None.

## Validation
None — guard logic inside the handler returns `400` if the student is not found or has no active history.

## Response 200
Returns a `ResumeCandidateDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "studentGuid": "f8c6fa4f-1ee1-4d8a-b897-05797ea995be",
    "studentRegNo": "021240602",
    "studentName": "ABAHO JONARD",
    "currentProgramGuid": "c94edf5c-bd5b-45ad-affd-1af2a0413d0f",
    "currentProgramName": "Bachelor of Information Technology",
    "currentSemesterGuid": "42dec935-b077-4e85-a7b7-764438f5b271",
    "currentSemesterName": "Semester 2",
    "availableSemesters": [
      { "semesterGuid": "42dec935-b077-4e85-a7b7-764438f5b271", "semName": "Semester 2" },
      { "semesterGuid": "1b490442-6eb5-43ee-8baf-c51207e2101d", "semName": "Semester 3" },
      { "semesterGuid": "ac00ad77-9d41-48c4-9a78-fe3bf02cf3ae", "semName": "Semester 4" }
    ],
    "availableFeeHeads": [
      { "feeHdGuid": "a07b1787-5942-4aa3-be62-7518ce295e4c", "feeCode": "BIT.SP26.LCL", "feeDesc": "BIT Local SP26" }
    ],
    "availableBatches": [
      { "batchGuid": "077eefea-2fa6-4465-b4e2-7a935f416141", "batchCode": "D" }
    ]
  },
  "message": null,
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Student not found |
| 400 | `bad_request` | Student has no active history or no program assigned |

## Used by pages
| Page | Route |
|---|---|
| Student Resuming Form | /students/resume/{studentGuid} |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-21 | Nebu Salim | Initial version created |
