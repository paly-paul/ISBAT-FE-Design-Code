# GET /api/v1/finance/payment-console/payment-history

**API ID:** `finance-service.payment-console.payment-receipts`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
The institution-wide **receipt register**: a searchable, paged, date-filterable list of every receipt issued across all students and all fee categories, enriched with student and program names and each amount restated in the base currency at the day's rate.

Same path as [GET /payment-console/payment-history/{applicationGuid}](./get-payment-history.md) but **without** the path segment — that one is a single student's history and returns a different shape. Don't confuse them.

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | No | Matched against student number, student name and receipt number |
| `fromDate` | DateTime | No | Inclusive lower bound on `payDate` |
| `toDate` | DateTime | No | Inclusive upper bound on `payDate` |
| `intCurrency` | int | No | **The legacy integer currency key, not a GUID** — take it from `intCurrency` on [GET /currencies](../currencies/get-currencies.md) |
| `payType` | EnumPaymentType | No | `1` Cash, `2` Cheque, `3` Bank, `4` DemandDraft, `5` Online |
| `pageNumber` | int | No | 1-based. Defaults to `1`. |
| `pageSize` | int | No | Defaults to `20`. No upper bound enforced here (unlike [search](./get-search-students.md)). |

> **Filtering caveat.** NCHE and guild rows have no currency and no pay-type column in their source tables. Setting either `intCurrency` or `payType` therefore **excludes every NCHE and guild receipt** from the results — not because none matched, but because they cannot match. Leave both unset for a complete register.

## Request body
None.

## Validation
None — this query has no validator despite taking seven parameters. An inverted date range simply returns no rows.

## Response 200
Returns a `PagedResult<PaymentReceiptDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "paymentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "category": 1,
        "receiptNo": "CSH140086",
        "payDate": "2026-08-17T00:00:00",
        "studentNo": "APP/2026/01842",
        "studentName": "Amina Nakato",
        "programName": "BSc Computer Science",
        "feeType": "Tuition",
        "amount": 1200000,
        "currencyCode": "UGX",
        "ugxValue": 1200000,
        "rate": 1,
        "payType": { "value": 1, "name": "Cash" }
      }
    ],
    "totalCount": 8471,
    "pageNumber": 1,
    "pageSize": 20
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `category` | `PaymentHistoryCategory`: `1` Tuition, `2` Other, `3` Nche, `4` Guild, `5` Advance |
| `feeType` | The ledger name where one exists, otherwise the category's default label (`"Tuition"`, `"Other"`, `"NCHE Fee"`, `"Guild Fee"`, `"Advance Deposit"`) |
| `ugxValue` | `amount` converted to the base currency at `rate`. Nullable — null when no rate was on file for that date. |
| `rate` | The exchange rate applied. `1` for base-currency payments. Nullable. |
| `payType` | An object (`{ value, name }`); null for NCHE and guild rows |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

The handler has no failure path — an empty register returns a 200 with `items: []`, not a 404 (unlike the per-student [payment history](./get-payment-history.md)).

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
