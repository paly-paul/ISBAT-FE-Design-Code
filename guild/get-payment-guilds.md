# GET /api/v1/finance/guild/payment-guilds

**API ID:** `erp-finance-service.guild.payment-guilds.list`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Retrieves a paginated list of all Guild payment records across the system. Used for administrative review and reporting.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|
| page | int | No | Page number (default: 1) |
| pageSize | int | No | Items per page (default: 10) |

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
{
  "items": [
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
  ],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 10
}
```

## Errors
| Status | Code | Reason |
|---|---|---|

## Used by pages
| Page | Route |
|---|---|
| [Guild Payment Console](../../../pages/finance/guild-console-page.md) | /finance/guild/console |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
