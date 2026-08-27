# POST /api/v1/students/id-cards

**API ID:** `academic-service.students.id-cards.issue-or-renew`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Issues a student ID card, or renews an existing one — **one endpoint for both**, switched by the `isRenewal` flag rather than by separate routes.

| `isRenewal` | Effect |
|---|---|
| `false` (default) | Issues a first card |
| `true` | Records a renewal against the student's existing card history |

Check the current state first with [GET /students/id-cards/{studentGuid}](./get-id-card-details.md) — nothing here stops you issuing a "new" card to a student who already has one, or recording a renewal for a student who has none.

## Path params
None — the student is identified in the body.

## Query params
None.

## Request body
```json
{
  "studentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "joiningDate": "2026-09-01T00:00:00",
  "expiryDate": "2029-08-31T00:00:00",
  "remarks": null,
  "isRenewal": false
}
```

| Field | Notes |
|---|---|
| `studentGuid` | Required |
| `joiningDate` / `expiryDate` | **Both nullable** — a card can be issued with no dates at all, and they can be filled in later via [PUT /students/id-cards/{cardIssueGuid}](./put-id-card-dates.md), which does require them |
| `remarks` | Nullable free text; no length limit |
| `isRenewal` | Defaults to `false` when omitted |

## Validation
`IssueOrRenewIdCardCommandValidator` — a single rule:

| Field | Rule | Notes |
|---|---|---|
| `studentGuid` | must not be empty | **Existence is not checked** |
| `joiningDate`, `expiryDate` | **no rules** | Not required, and **no check that `expiryDate` is after `joiningDate`** — an expiry before the joining date is accepted |
| `remarks`, `isRenewal` | **no rules** | |

## Response 201
Returns the issued or renewed card record as the `data` payload, including its `cardIssueGuid`. See [api/README.md](../../../README.md) for the envelope.

Keep the `cardIssueGuid` — it is what [PUT /students/id-cards/{cardIssueGuid}](./put-id-card-dates.md) takes, not `studentGuid`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | `studentGuid` is empty |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
