# POST /api/v1/finance/refund/applications/{applicationGuid}

**API ID:** `finance-service.payment-console.create-refund`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Issues a refund against one ledger of one application. This endpoint intentionally ports the legacy `T_InsertPaymentConsole_Refund` stored procedure's behavior, including several of its known limitations — see the business rules table below and the changelog for what those are and why they were kept rather than "fixed" during the port.

A refund here is a standalone record: it does **not** reverse any ledger line, and it is not linked to any specific payment. The application's paid total for that ledger is unchanged after a refund — a known limitation carried over from legacy, not an oversight.

An application can be refunded **at most once per ledger, ever** — a second refund attempt against the same `(applicationGuid, ledgerGuid)` is always rejected, regardless of how much of the first refund's amount was requested.

Pick a ledger to refund from [GET /refund/ledger-options/{applicationGuid}](./get-ledger-options.md), and check how much has been paid into it with [GET /refund/total-paid](./get-total-paid.md) before submitting.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |

## Query params
None.

## Request body
```json
{
  "ledgerGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "currencyGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "amount": 300000,
  "refundDate": "2026-08-17T00:00:00",
  "studentGuid": null,
  "remarks": "Withdrawal before census date"
}
```

## Validation
`CreateRefundCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `applicationGuid` (path) | must not be empty | |
| `ledgerGuid` | must not be empty | |
| `currencyGuid` | must not be empty | |
| `refundDate` | required | Determines which day's exchange rate applies to the USD/UGX cross-check below |
| `amount` | none | No positivity check — matches legacy, which never validated this either |
| `studentGuid` | none | Nullable |
| `remarks` | none | Nullable free text |

### Business rules (handler-level, not FluentValidation) — ported 1:1 from legacy, bugs included
| Rule | Behavior |
|---|---|
| Ledger must exist | 404 — `"Ledger not found."` |
| Currency must exist | 404 — `"Currency not found."` |
| No existing refund for this `(applicationGuid, ledgerGuid)` | 400 — `"Refund already exists."` — permanent, regardless of the first refund's amount |
| Amount vs. total paid | Total paid is `SUM(AMTDEF)` across **every payment, every semester** this application ever paid into that ledger — **not filtered for soft-deleted payments or ledger lines** (a known legacy bug, kept intentionally). If the refund currency matches the ledger's paid currency and the amount exceeds that total: 400 — `"Refund amount should not be greater than Total Amount."` |
| Currency-mismatch cross-check | Only runs when the refund currency differs from the ledger's paid currency, and **only recognizes USD and UGX** — any other currency pair skips this check entirely (legacy limitation, kept intentionally) |
| Zero-paid-amount bypass | If the ledger has **no** recorded payments for this application at all, the total-paid check above is skipped entirely and **any** amount is accepted — a known legacy bug, reproduced intentionally. Don't rely on this — it will refund into thin air. |
| Missing exchange rate on the refund date | The USD/UGX cross-check above is silently skipped (not blocked, not an error) when no rate exists for `refundDate` — mirrors `NULL` propagation in the legacy T-SQL procedure |
| No ledger reversal | A successful refund does **not** touch `T_PAYMENT_LEDGER` — the paid total for that ledger is unchanged afterwards |
| No concurrency lock | Two simultaneous refund requests for the same `(applicationGuid, ledgerGuid)` are not serialized against each other |

## Response 201
Returns a `RefundResultDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "refundGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "message": "Refund saved successfully.",
  "code": null,
  "errors": null
}
```

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | A required field above was missing/empty |
| 400 | (generic failure) | Any business rule above that maps to 400 — read `errors` for which |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Ledger not found."` or `"Currency not found."` |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
| 2026-09-05 | Nebu Salim | **Moved** from `payment-console/post-payment-refund.md` to `refund/post-refund.md` (API ID unchanged, per contributing rule 5). Rebuilt to match the legacy `T_InsertPaymentConsole_Refund` stored procedure exactly. Route changed from `POST /payment-console/payments/{paymentGuid}/refund` to `POST /refund/applications/{applicationGuid}`. Request body changed from `{amount, refundDate, remarks}` to `{ledgerGuid, currencyGuid, amount, refundDate, studentGuid, remarks}` — no more `paymentGuid`. Previously: refund was scoped to a single payment, allowed partial/repeated refunds up to a computed refundable balance, actually reversed the payment's ledger lines, required a base currency + an exchange rate for both the payment and ledger currency (any currency), took an advisory lock, and rejected any payment spread across more than one ledger (`"Multi-ledger refunds are not yet supported."`). Response was `{refundGuid, paymentGuid, paymentCode, receipt, remainingRefundableBalance}`. Now: scoped to `(applicationGuid, ledgerGuid)`, at most one refund ever per ledger, no ledger reversal, USD/UGX-only currency cross-check, no lock, response is just `{refundGuid}` — see business rules table for the full list. |
