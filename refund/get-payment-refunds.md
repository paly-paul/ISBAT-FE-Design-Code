# GET /api/v1/finance/refund/payments

**API ID:** `finance-service.payment-refunds.list`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns a paged, cross-application list of refunds. A refund is scoped to `(applicationGuid, ledgerGuid)`, not to any specific payment — see [POST /refund/applications/{applicationGuid}](./post-refund.md).

Supports optional `studentGuid` and `applicationGuid` filters. For one application's refunds use [GET /refund/by-application/{applicationGuid}](./get-refunds-by-application.md).

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `page` | int | No | 1-based page index. Defaults to `1`. |
| `pageSize` | int | No | Items per page. Defaults to `10`. No upper bound enforced. |
| `studentGuid` | Guid | No | Filter to a single student's refunds. |
| `applicationGuid` | Guid | No | Filter by application GUID. Either filter can be used independently. |

## Request body
None.

## Validation
None.

## Response 200
Returns a `PagedResult<PaymentRefundDto>` as the `data` payload.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "refundGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
        "amount": 300000,
        "currency": { "currencyGuid": "…", "currencyCode": "UGX", "currencyName": "Uganda Shilling" },
        "refundDate": "2026-08-17T00:00:00",
        "ledger": { "ledgerGuid": "…", "ledgerCode": "TUIT", "ledgerName": "Tuition Fee" },
        "remarks": "Withdrawal before census date"
      }
    ],
    "totalCount": 62,
    "pageNumber": 1,
    "pageSize": 10
  },
  "message": null,
  "code": null,
  "errors": null
}
```

`ledger` is the ledger the refund was issued against. An application can have at most one refund per ledger, ever — see [POST /refund/applications/{applicationGuid}](./post-refund.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
| 2026-09-05 | Nebu Salim | **Moved** from `payments/get-payment-refunds.md` to `refund/get-payment-refunds.md` (API ID unchanged, per contributing rule 5; route is unchanged). `PaymentRefundDto` no longer includes a `payment` field — refunds are no longer linked to any specific payment, only to `(applicationGuid, ledgerGuid)`. Previously each item included `"payment": { "paymentGuid", "paymentCode" }`; that field has been removed from the response. |
| 2026-09-05 | Nebu Salim | Route changed from `GET /api/v1/finance/payment-refunds` to `GET /api/v1/finance/refund/payments` — the endpoint moved under the `refund` route group alongside the other refund endpoints. API ID unchanged. |
