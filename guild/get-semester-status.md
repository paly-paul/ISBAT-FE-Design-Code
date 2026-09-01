# GET /api/v1/finance/guild/semester-status/{applicationGuid}

**API ID:** `erp-finance-service.guild.semester-status.get`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Retrieves the semester status for an application's Guild payments, showing which semester the student is currently eligible to pay for based on their payment history.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| applicationGuid | Guid | Yes | The application GUID to check semester status for |

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| studentGuid | Guid? | No | Optional student GUID for additional context |

## Request body
```json
{

}
```

## Validation
No validation rules for this endpoint.

| Field | Rule | Notes |
|---|---|---|

## Response 200
Returns a list — one entry per semester in the student's program (starting from semester 1, or from the registration semester for lateral-entry/credit-exemption students).

```json
[
  {
    "semesterGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "semCode": 1,
    "semName": "Semester 1",
    "status": "Paid"
  },
  {
    "semesterGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "semCode": 2,
    "semName": "Semester 2",
    "status": "Due"
  },
  {
    "semesterGuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "semCode": 3,
    "semName": "Semester 3",
    "status": ""
  }
]
```

### Status values

| Value | Meaning |
|---|---|
| `"Paid"` | Guild fee for this semester has been paid |
| `"Due"` | Fee is due — semester is at or before the student's current semester and not yet paid |
| `""` (empty string) | Not yet due — semester is beyond the student's current semester |

## Errors
| Status | Code | Reason |
|---|---|---|
| 404 | NotFound | Application not found |

## Used by pages
| Page | Route |
|---|---|
| [Guild Payment Page](../../../pages/finance/guild-payment-page.md) | /finance/guild/payment |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
