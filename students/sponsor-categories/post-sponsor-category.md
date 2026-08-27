# POST /api/v1/students/sponsor-categories

**API ID:** `academic-service.students.sponsor-categories.create`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Creates a sponsor category.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "category": "HEC",
  "mandatoryFeeCheck": 1
}
```

The same `CreateSponsorCategoryRequest` type is used by [PUT](./put-sponsor-category.md) — there is no separate update DTO.

## Validation
`CreateSponsorCategoryCommandValidator`, which delegates to `CreateSponsorCategoryRequestValidator`:

| Field | Rule | Notes |
|---|---|---|
| `category` | required, **max 10 chars** | A short code, not a descriptive name. **Not** uniqueness-checked — two categories with the same label are accepted. |
| `mandatoryFeeCheck` | **no rule** | Nullable byte, not range-checked |

## Response 201
Returns the created sponsor category as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `category` missing or over 10 chars |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
