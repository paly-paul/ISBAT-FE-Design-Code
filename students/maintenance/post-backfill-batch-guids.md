# POST /api/v1/students/maintenance/backfill-batch-guids

**API ID:** `academic-service.students.maintenance.backfill-batch-guids`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; **no fine-grained permission**.

## Description
A **one-off data-migration job**, not a feature: it walks student records that carry only the legacy integer `intBatch` and fills in the corresponding `batchGuid`, resolving each through the Academic module's [batch guid-lookup](../../academic/batches/get-batch-guid-lookup.md).

> **Operational endpoint — do not wire it into the UI.** It runs across the whole students table, is unbounded in duration, and takes no parameters to limit scope. Any authenticated user can trigger it; there is no permission gate and no confirmation step.

It is idempotent in effect — records already carrying a `batchGuid` are left alone — so a repeat run is safe, but a concurrent run is not something the endpoint guards against.

## Path params
None.

## Query params
None.

## Request body
None — the `POST` carries no payload.

## Validation
None.

## Response 200
Returns the backfill result as the `data` payload — typically a count of rows updated. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

Because it depends on the Academic module's batch lookup, an Academic outage means GUIDs cannot be resolved and rows are left unbackfilled.

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
