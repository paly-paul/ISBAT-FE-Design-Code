# PUT /api/v1/students/id-cards/{cardIssueGuid}

**API ID:** `academic-service.students.id-cards.update-dates`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Corrects the joining and expiry dates on an issued ID card. Dates are the **only** editable fields — remarks and the renewal flag set at [issue](./post-issue-or-renew-id-card.md) cannot be changed.

> **The path takes `cardIssueGuid`, not `studentGuid`.** Every other route on this resource is keyed by the student; this one is keyed by the individual card-issue record, because a student can have several across renewals. Get the value from [GET /students/id-cards/{studentGuid}](./get-id-card-details.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `cardIssueGuid` | Guid | Yes | The **card issue** record's GUID, not the student's. Route-constrained to `:guid`. |

## Query params
None.

## Request body
```json
{
  "joiningDate": "2026-09-01T00:00:00",
  "expiryDate": "2029-08-31T00:00:00"
}
```

Both fields are **non-nullable** here — unlike on [issue](./post-issue-or-renew-id-card.md), where a card can be created with no dates. This endpoint is how those blanks get filled in.

## Validation
No FluentValidation validator is registered for this command. In particular there is **no check that `expiryDate` falls after `joiningDate`**, so an inverted range is accepted — the same gap as on the issue endpoint.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| The card-issue record must exist | 404 `not_found` |

## Response 200
Returns the updated card record as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (deserialization) | `joiningDate` or `expiryDate` missing or unparseable — both are required by the DTO |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No card-issue record with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
