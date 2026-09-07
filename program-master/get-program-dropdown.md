# GET /api/v1/academic/program-master/dropdown

**API ID:** `academic-service.academic.program-master.dropdown`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Program list for dropdowns, optionally scoped to one faculty.

Note this dropdown takes **`facultyGuid`, not `search`** — like the [faculty dropdown](../faculties/get-faculty-dropdown.md), and unlike most others in this module. Filter by text client-side, or use [GET /program-master](./get-programs.md), which does support `search`.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `facultyGuid` | Guid | No | Restrict to programs under this faculty. Omit for the institution-wide list. |

## Request body
None.

## Validation
None beyond query parameter binding.

## Response 200
Returns a `List<ProgramDropdownItemDto>` as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "programGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "programCode": "BSCCS",
      "programName": "BSc Computer Science"
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

Unlike most dropdown DTOs in this module, this one keeps entity-specific field names and exposes **no legacy integer id**.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

An unknown `facultyGuid` returns a 200 with `data: []`, not a 404.

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
