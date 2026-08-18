# GET /api/v1/finance/payment-console/search

**API ID:** `finance-service.payment-console.search-students`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
The payment console's entry point: finds the application (student) the cashier is about to take money for. Everything else in the console is keyed by the `applicationGuid` this returns.

Finance holds no student data of its own — the handler proxies straight to the **Admissions service**. When that call fails the endpoint reports it rather than returning an empty page, so an empty `items` list genuinely means "no matches".

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | No | Matched by the Admissions service against application ref no, name, phone and email. Omit to list all applications. |
| `pageNumber` | int | No | 1-based. Defaults to `1`. Note the name — `pageNumber` here, not `page` as on the master-data lists. |
| `pageSize` | int | No | Defaults to `20`. Capped at 100 by validation. |

## Request body
None.

## Validation
`SearchStudentsQueryValidator` — the **only validated query** in the Finance module:

| Field | Rule | Notes |
|---|---|---|
| `searchTerm` | min 2 chars, **only when non-blank** | Message: `"Search term must be at least 2 characters."` Omitting it entirely, or sending whitespace, skips the rule. |
| `pageNumber` | must be ≥ 1 | |
| `pageSize` | must be between 1 and 100 inclusive | The one paging endpoint in this module with an upper bound |

## Response 200
Returns a `PagedResult<ApplicationSummaryDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "appRefNo": "APP/2026/01842",
        "firstName": "Amina",
        "lastName": "Nakato",
        "phone": "0770000000",
        "emailId": "amina.nakato@example.com",
        "programGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "action": 2
      }
    ],
    "totalCount": 3,
    "pageNumber": 1,
    "pageSize": 20
  },
  "message": null,
  "code": null,
  "errors": null
}
```

This is a deliberately thin summary — take `applicationGuid` into [GET /payment-console/student-profile/{applicationGuid}](./get-student-profile.md) for the full record.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Search term too short, or paging out of range |
| 400 | (generic failure) | `"Could not retrieve applications from the admissions service."` — the downstream call failed or returned nothing |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
