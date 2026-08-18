# GET /api/v1/finance/payment-console/paid-ledgers/{paymentGuid}

**API ID:** `finance-service.payment-console.paid-ledgers`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the allocation lines a single **tuition** payment produced — what the money was actually applied to, ledger by ledger and semester by semester. This is the receipt detail view, and the after-the-fact counterpart to the [payable-ledgers preview](./get-payable-ledgers.md).

Only tuition payments allocate across ledgers, so `paymentGuid` must be a tuition payment — a row with `category: 1` in [the payment history](./get-payment-history.md). Passing an NCHE, guild, other or advance GUID returns a 404.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `paymentGuid` | Guid | Yes | A **tuition** payment GUID |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<PaidLedgerDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "ledgerGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerName": "Tuition Fee",
      "semesterGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "semName": "Semester 2",
      "amount": 900000,
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "amtDef": 900000,
      "discountGuid": null
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `amount` | Applied to this ledger, in the ledger's own currency |
| `amtDef` | The same figure in the default (base) currency, frozen at the rate used when the payment was made |
| `discountGuid` | Non-null on lines representing a discount reduction rather than cash. Show these as deductions. |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"No paid ledgers found for this payment."` — the GUID is unknown, or it belongs to a non-tuition payment, which never has allocation lines |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
