# GET /api/v1/students/dropout-rejoin

**API ID:** `academic-service.students.dropout-rejoin.list`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the full list of active students whose registration history is in `REGSTATUS = 3 (DropOut)`. For each student, resolves program, semester, and batch names via bulk Academic service calls, then checks fee eligibility via a single Finance batch call to set the `canRejoin` flag. Results are sorted eligible-first (`canRejoin desc`), then by student name.

## Path params
None.

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<DropoutStudentDto>` as the `data` payload.

```json
{
  "success": true,
  "data": [
    {
      "studentGuid": "e6c6e819-0892-431a-adf2-c7b60961bfb4",
      "studentRegNo": "011260182",
      "studentName": "AINE-OMUGISHA VERON",
      "programGuid": "abb6b80c-f217-447e-93bc-1addc2cf615d",
      "programName": "Bachelor of Science in Computer Engineering",
      "semesterGuid": "ac00ad77-9d41-48c4-9a78-fe3bf02cf3ae",
      "semesterName": "Semester 3",
      "batchGuid": "f8dbcd3c-9879-42b6-9b3a-0a502f14ef97",
      "batchCode": "BS.CES26DA",
      "applicationGuid": "6e60c3b4-6b14-4c7a-a25f-6ca87a830883",
      "canRejoin": true
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

**`canRejoin`:** `true` if the student's current semester fees are fully paid; `false` otherwise. Eligible students appear first in the list.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
| Page | Route |
|---|---|
| Dropout Rejoin List | /students/dropout-rejoin |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-21 | Nebu Salim | Initial version created |
