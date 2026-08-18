# GET /api/v1/finance/payment-console/lateral-credit-balance/{applicationGuid}/{studentGuid}

**API ID:** `finance-service.payment-console.lateral-credit-balance`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the outstanding **lateral-entry / credit-exemption** fee for a student — the one-off charge levied when a student joins mid-program or transfers credits in, priced per exempted credit.

This only applies to students whose registration type is Lateral Entry or Credit Exemption; for everyone else the endpoint 404s by design. The rate configuration comes from [GenSets](../gen-sets/get-gen-sets.md) (`LE`, `CE`, `LEF`, `CEF`, `ACE`), so an incomplete GenSet setup surfaces here as an error rather than a zero balance.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |
| `studentGuid` | Guid | **Yes** | Required, not optional — the registration type lives on the student record, so this cannot be answered for an applicant who is not yet a student |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `LateralCreditBalanceDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "ledgerAmount": 1200000,
    "paidAmount": 400000,
    "balanceAmount": 800000,
    "currencyCode": "UGX"
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `ledgerAmount` | The total lateral/credit-exemption fee computed from the GenSet rates and the student's exempted credits |
| `paidAmount` | Sum of [other payments](../payments/get-payment-others.md) already made against that ledger |
| `balanceAmount` | `ledgerAmount - paidAmount` |

Settle the balance through [POST /payment-console/payment-other](./post-payment-other.md) against the corresponding ledger-others entry — there is no dedicated payment endpoint for it.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | `"Fee structure not assigned to this application."`, or `"Lateral Entry/Credit Exemption fee configuration is incomplete."` (a required GenSet is missing or unparseable) |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."`, or `"Lateral Entry/Credit Exemption balance only applies to Lateral Entry or Credit Exemption students."` — the latter is the expected answer for a regular student, so hide the section rather than showing an error |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
