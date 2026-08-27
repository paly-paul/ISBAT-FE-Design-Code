# GET /api/v1/students/dropout-rejoin/{studentGuid}/candidate

**API ID:** `academic-service.students.dropout-rejoin.get-candidate`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the candidate profile and dropdown options needed to populate the Rejoin form for a specific dropout student. Semester options are restricted to the student's current semester and the next semester only (current SemCode and current SemCode + 1). Returns a 400 if the student is not a dropout.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | `Guid` | Yes | Must be a student with `REGSTATUS = 3 (DropOut)` in their active history |

## Query params
None.

## Request body
None.

## Validation
None — guard logic inside the handler returns a `400` if the student is not found or not a dropout.

## Response 200
Returns a `RejoinCandidateDto` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "studentGuid": "e6c6e819-0892-431a-adf2-c7b60961bfb4",
    "studentRegNo": "011260182",
    "studentName": "AINE-OMUGISHA VERON",
    "currentProgramGuid": "abb6b80c-f217-447e-93bc-1addc2cf615d",
    "currentProgramName": "Bachelor of Science in Computer Engineering",
    "currentSemesterGuid": "ac00ad77-9d41-48c4-9a78-fe3bf02cf3ae",
    "currentSemesterName": "Semester 3",
    "availableSemesters": [
      { "semesterGuid": "ac00ad77-9d41-48c4-9a78-fe3bf02cf3ae", "semName": "Semester 3" },
      { "semesterGuid": "1b490442-6eb5-43ee-8baf-c51207e2101d", "semName": "Semester 4" }
    ],
    "availableFeeHeads": [
      { "feeHdGuid": "a07b1787-5942-4aa3-be62-7518ce295e4c", "feeCode": "BSC.CES.SP26.LCL", "feeDesc": "BSC CES Local SP26" }
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

Pass `semesterGuid`, `batchGuid`, and `feeHdGuid` from these lists into the rejoin submit endpoint.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Student not found |
| 400 | `bad_request` | Student has no active history, or is not a dropout, or has no program assigned |

## Used by pages
| Page | Route |
|---|---|
| Dropout Rejoin Form | /students/dropout-rejoin/{studentGuid} |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-21 | Nebu Salim | Initial version created |
