# GET /api/v1/students/id-cards/{studentGuid}

**API ID:** `academic-service.students.id-cards.details`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a student's ID-card record — the card currently issued, its joining and expiry dates, and the issue history that [renewals](./post-issue-or-renew-id-card.md) build up.

This is what the ID-card desk loads before deciding whether to issue a first card or renew an expiring one.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid`, so it never shadows the sibling `/search` route |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the student's ID-card details as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

Each issue record carries a `cardIssueGuid` — that, **not** `studentGuid`, is what [PUT /students/id-cards/{cardIssueGuid}](./put-id-card-dates.md) takes.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The student has no ID card issued yet |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
