# DELETE /api/v1/finance/guild/payment-guild/{paymentGuildGuid}

**API ID:** `erp-finance-service.guild.payment-guild.delete`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Bearer cookie via gateway; requires permission (TBD)

## Description
Deletes an existing Guild payment record. This operation is irreversible and will remove the payment from the student's payment history.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| paymentGuildGuid | Guid | Yes | The payment record GUID to delete (must exist in database) |

## Query params
| Name | Type | Required | Notes |
|---|---|---|---|

## Request body
```json
{

}
```

## Validation
No validation rules for this endpoint beyond the path parameter.

| Field | Rule | Notes |
|---|---|---|

## Response 200
```json
true
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 404 | NotFound | Payment record not found |

## Used by pages
| Page | Route |
|---|---|
| [Guild Payment Page](../../../pages/finance/guild-payment-page.md) | /finance/guild/payment |

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-31 | Nebu Salim | Initial version created |
