# POST /api/v1/finance/payment-console/unified-payment

**API ID:** `finance-service.payment-console.create-unified-payment`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Settles **several fee categories in one transaction** — tuition, other, NCHE and guild together — against a single receipt and a single payment group. This is what the console's combined-payment screen posts, driven by [GET /payment-console/outstanding-all/{applicationGuid}](./get-all-outstanding-ledgers.md).

Internally it runs the same per-category logic as the individual endpoints, so every business rule documented on [payments](./post-payment.md), [payment-other](./post-payment-other.md), [payment-nche](./post-payment-nche.md) and [payment-guild](./post-payment-guild.md) still applies to the corresponding line — including the NCHE and guild "must be a multiple of the rate" rules.

**All-or-nothing:** the whole group is written in one transaction. A single failing line rolls the entire payment back, and any such failure surfaces as a plain 400 carrying that line's message.

**Not idempotent** — a receipt number is claimed. On a timeout, check [the payment history](./get-payment-history.md) before retrying.

## Path params
None.

## Query params
None.

## Request body
Header fields are shared across every line; the four line collections carry the per-category detail.

```json
{
  "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "studentGuid": "9a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "currencyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptBookGuid": "…",
  "payDate": "2026-08-17T00:00:00",
  "payType": 1,
  "procBankGuid": null,
  "remarks": null,
  "tuition": { "amount": 900000 },
  "otherLines": [
    { "ledgerOthersGuid": "…", "amount": 50000, "paymentAdvanceGuid": null }
  ],
  "ncheLines": [ { "amount": 20000, "pnrNumber": "PNR-88213" } ],
  "guildLines": [ { "amount": 10000, "bankDeposit": "DEP-556102" } ]
}
```

`tuition` is a single nullable object (at most one tuition line); the other three are arrays and may be empty.

## Validation
`CreateUnifiedPaymentCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` | required, must not be empty | |
| `currencyGuid` | required, must not be empty | Applies to the whole group |
| `receiptBookGuid` | required, must not be empty | **Always required** — even a group made up only of NCHE/guild lines, which individually issue no receipt |
| `payDate` | required | |
| `payType` | must be a defined `EnumPaymentType` value | Byte. Message: `"Invalid payment type."` |
| `procBankGuid` | required when `payType != 1` (Cash) | Message: `"Bank account is required for non-cash payments."` |
| (whole request) | at least one of `tuition`, `otherLines`, `ncheLines`, `guildLines` must be non-empty | Message: `"At least one fee item must be selected."` |
| `tuition.amount` | must be ≥ 0, when `tuition` is supplied | Zero allowed, matching [POST /payments](./post-payment.md) |
| `otherLines[].ledgerOthersGuid` | required, must not be empty | Per-element rule |
| `otherLines[].amount` | must be > 0 | Per-element rule |
| `ncheLines[].amount` | must be > 0 | Per-element rule |
| `guildLines[].amount` | must be > 0 | Per-element rule |
| `otherLines[].paymentAdvanceGuid` | none | Nullable — an individual other-line may still be funded from an advance |
| `studentGuid`, `remarks` | none | Nullable |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Application must exist | 404 — `"Application not found."` |
| Application must have an intake | 400 — `"Intake not assigned to this application."` |
| Receipt book must exist | 404 — `"Receipt book not found."` |
| Every per-category rule | 400 carrying that line's message — e.g. `"Amount must be a multiple of {rate}."`, `"Amount exceeds the outstanding NCHE balance."`, `"Advance balance is exhausted."` The whole group is rolled back. |

## Response 201
Returns a `UnifiedPaymentResultDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "payGroupGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payRefCode": "GRP-2026-000451",
    "totalAmount": 980000,
    "lines": [
      { "category": 1, "paymentGuid": "…", "amount": 900000, "receipt": "CSH140086" },
      { "category": 2, "paymentGuid": "…", "amount": 50000, "receipt": "CSH140086" },
      { "category": 3, "paymentGuid": "…", "amount": 20000, "receipt": null },
      { "category": 4, "paymentGuid": "…", "amount": 10000, "receipt": null }
    ],
    "advanceMessage": null
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `payGroupGuid` / `payRefCode` | Identify the group as a whole — this is what ties the lines together |
| `lines[].category` | `PaymentGroupCategory`: `1` Tuition, `2` Other, `3` Nche, `4` Guild |
| `lines[].paymentGuid` | The identifier **within that category's own table**, so it is the right key for [paid-ledgers](./get-paid-ledgers-by-payment.md) only on the tuition line |
| `lines[].receipt` | Null on NCHE and guild lines — those categories issue no receipt |
| `advanceMessage` | Set when a tuition overpayment was booked as an advance deposit |

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | (generic failure) | Any per-category business rule; the whole group was rolled back |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Application or receipt book not found |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
