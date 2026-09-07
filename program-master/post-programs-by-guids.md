# POST /api/v1/academic/program-master/by-guids

**API ID:** `academic-service.academic.program-master.by-guids`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Bulk program lookup: resolves a list of program GUIDs to their code and name in one round trip, for labelling grids whose rows carry only `programGuid`. A POST purely because the list travels in the body — it reads nothing and writes nothing.

The Finance payment console calls this to put program names on receipt rows.

## Path params
None.

## Query params
None.

## Request body
A bare JSON array of GUIDs — **not** an object wrapping one:

```json
["3fa85f64-5717-4562-b3fc-2c963f66afa6", "7c9e6679-7425-40de-944b-e07fc1f90ae7"]
```

## Validation
None. An empty array is accepted and returns an empty list.

## Response 200
Returns a `List<ProgramDropdownItemDto>` as the `data` payload — the same item shape as [GET /program-master/dropdown](./get-program-dropdown.md).

**Unresolvable GUIDs are silently dropped**: the result is a list, not a map, and can be shorter than the input with no indication of which GUIDs were missed. Match on `programGuid` client-side rather than by position.

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

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (deserialization) | Body is not a JSON array of GUIDs |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

No 404 — unknown GUIDs are omitted rather than reported.

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
