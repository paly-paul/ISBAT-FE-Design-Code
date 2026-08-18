# GET /api/v1/finance/payment-console/ledger-others

**API ID:** `finance-service.payment-console.ledger-others`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the full "other fees" catalogue — the pickable fee types for an [other payment](./post-payment-other.md) (ID replacement, transcript, lateral-entry fee, …). This is a **separate table** from the tuition [ledgers](../ledgers/get-ledgers.md); the GUID it returns is a `ledgerOthersGuid` and is not interchangeable with a `ledgerGuid`.

Unpaged and unfiltered — it returns the whole catalogue in one call, which is what the dropdown wants. There is no CRUD surface for these entries in the Finance API; they are maintained directly in the database.

## Path params
None.

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<LedgerOthersDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "ledgerOthersGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerCode": "IDRP",
      "ledgerName": "ID Replacement"
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

Pass `ledgerOthersGuid` as `ledgerOthersGuid` in [POST /payment-console/payment-other](./post-payment-other.md), or on each `otherLines` entry of a [unified payment](./post-unified-payment.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

The handler has no failure path — an empty catalogue returns a 200 with `data: []`.

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
