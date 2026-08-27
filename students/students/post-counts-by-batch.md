# POST /api/v1/students/counts-by-batch

**API ID:** `academic-service.students.students.counts-by-batch`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns how many students are in each of the given batches. A POST purely because the GUID list travels in the body — it reads nothing and writes nothing.

This is the endpoint the Academic module calls from [GET /timetables/eligible-batches](../../academic/timetables/get-timetable-eligible-batches.md) to put a live headcount next to each batch, so the scheduler can size the room.

## Path params
None.

## Query params
None.

## Request body
Unlike the other bulk lookups in this repo, this one takes an **object wrapping the list**, not a bare array:

```json
{
  "batchGuids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  ]
}
```

## Validation
None. An empty list is accepted and returns an empty result.

## Response 200
Returns a `List<BatchStudentCountDto>` as the `data` payload — batch GUID paired with its student count. See [api/README.md](../../../README.md) for the envelope.

**Batches with no students may be absent from the result** rather than returned with a count of zero — the Academic caller defaults missing entries to `0`, and callers here should do the same rather than assuming one row per input GUID.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (deserialization) | Body is not the expected object shape |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
