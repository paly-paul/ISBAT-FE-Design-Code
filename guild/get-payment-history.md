# GET /api/v1/finance/guild/payment-history/{studentGuid}

**API ID:** `erp-finance-service.guild.payment-history.get`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Retrieves the complete payment history for a student's Guild payments, showing all payments made across their application.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| studentGuid | Guid | Yes | The student GUID to retrieve payment history for |

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|

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
```json
[
  {
    "paymentGuildGuid": "guid",
    "applicationGuid": "guid",
    "studentGuid": "guid",
    "studentName": "string",
    "intakeGuid": "guid",
    "intakeCode": 1,
    "payDate": "2026-08-31T00:00:00Z",
    "bankDeposit": "string",
    "receipt": "string",
    "amount": 1000.00
  }
]
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 404 | NotFound | Student not found |

## Used by pages
| Page | Route |
|---|---|
| [Guild Payment History Page](../../../pages/finance/guild-history-page.md) | /finance/guild/history |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
