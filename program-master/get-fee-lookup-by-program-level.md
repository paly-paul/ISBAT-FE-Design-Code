# GET /api/v1/academic/program-master/fee-lookup/{programLevelGuid}

**API ID:** `academic-service.academic.program-master.fee-lookup`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the default application and late fees carried by a [program level](../program-levels/get-program-level-by-guid.md), so the program-creation form can pre-fill `appFee` / `lateFee` when the user picks a level.

Pre-fill only: the values are **not** enforced when the program is saved. [POST /program-master](./post-program-master.md) accepts whatever `appFee`/`lateFee` you send, so a program can carry fees that differ from its level's defaults.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programLevelGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `FeeLookupDto` as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "feeCode": "BSC-APP",
    "feeName": "Bachelors application fee",
    "appFee": 50000,
    "lateFee": 20000
  },
  "message": null,
  "code": null,
  "errors": null
}
```

Every field is **nullable** — a level with no fee configuration returns nulls rather than an error, so guard before binding into a numeric input.

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
