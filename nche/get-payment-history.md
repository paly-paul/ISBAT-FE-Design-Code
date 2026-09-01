# GET /api/v1/finance/nche/payment-history/{studentGuid}

**API ID:** `erp-finance-service.nche.payment-history.get`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Retrieves the complete payment history for a student's NCHE payments, showing all payments made across their application.

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
    "paymentNcheGuid": "guid",
    "applicationGuid": "guid",
    "studentGuid": "guid",
    "intakeGuid": "guid",
    "payDate": "2026-08-31T00:00:00Z",
    "pnrNumber": "string",
    "amount": 1000.00,
    "remarks": "string"
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
| [NCHE Payment History Page](../../../pages/finance/nche-history-page.md) | /finance/nche/history |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
