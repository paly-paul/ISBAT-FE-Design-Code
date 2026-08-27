# PUT /api/v1/students/sponsor-categories/{guid}

**API ID:** `academic-service.students.sponsor-categories.update`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates a sponsor category. Students already assigned to it keep their assignment — only the label and flag change.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `guid` | Guid | Yes | `sponsorCategoryGuid` |

## Query params
None.

## Request body
```json
{
  "category": "HEC",
  "mandatoryFeeCheck": 1
}
```

## Validation
`UpdateSponsorCategoryCommandValidator`, delegating to the same `CreateSponsorCategoryRequestValidator`:

| Field | Rule | Notes |
|---|---|---|
| `category` | required, max 10 chars | Not uniqueness-checked |
| `mandatoryFeeCheck` | **no rule** | Nullable byte |

The path `guid` has no rule; the route's `:guid` constraint is the only gate.

## Response 200
Returns the updated sponsor category as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `category` missing or over 10 chars |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No sponsor category with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
