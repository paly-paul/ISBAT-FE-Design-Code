# GET /api/v1/academic/program-master/by-campus/{campusGuid}

**API ID:** `academic-service.academic.program-master.by-campus`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the list of programmes offered at a given campus. Used to populate the Programme picker when a campus has been selected. Returns only the minimal fields needed for a dropdown — `programGuid`, `programCode`, `programName`.

## Path params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `campusGuid` | guid | Yes | The campus whose programmes to list |

## Query params
None.

## Request body
None.

## Validation
None beyond path parameter binding.

## Response 200
Returns a `List<ProgramDropdownItemDto>` as the `data` payload — every response is wrapped in the standard envelope, see [api/README.md](../../../README.md).

```json
{
  "success": true,
  "data": [
    {
      "programGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "programCode": "BSC-CS",
      "programName": "Bachelor of Science in Computer Science"
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

Pass `programGuid` as `programGuid` in the application payment POST.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
| Page | Route |
|---|---|
| [Application Payment Page](../../../../pages/admission/application-payment-page.md) | /admission/payment |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-12 | Abhinav | Initial documentation added |
