# GET /api/v1/academic/program-master/not-approved

**API ID:** `academic-service.academic.program-master.list-not-approved`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the programs still awaiting approval — the queue behind the program-approval screen.

This is a **convenience alias**, not a distinct query: it dispatches the same `GetProgramMasterQuery` as [GET /program-master](./get-programs.md) with `notApproved` forced to `true`. Calling `/program-master?notApproved=true` returns exactly the same thing.

Approve a program via the [program-approval](../program-approval/program-approval.md) endpoints.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `pageNumber` | int | No | 1-based page index. Defaults to `1`. Note the name — `pageNumber`, not `page`. |
| `pageSize` | int | No | Defaults to **`20`**, not `10`. No upper bound enforced. |
| `search` | string | No | Partial match against program code/name |

There is **no `notApproved` parameter here** — it is hard-coded to `true`.

## Request body
None.

## Validation
None.

## Response 200
Returns the same paged program list shape as [GET /program-master](./get-programs.md), filtered to unapproved programs. See [api/README.md](../../../README.md) for the envelope.

An empty queue is a normal 200 with an empty `items` array.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
