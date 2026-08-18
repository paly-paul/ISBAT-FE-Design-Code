# GET /api/v1/finance/payment-console/outstanding-ledgers/{applicationGuid}

**API ID:** `finance-service.payment-console.outstanding-ledgers`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the student's outstanding **tuition** ledger lines — fee-structure amount minus what has already been allocated, per ledger per semester. This is the "what is still owed" grid on the tuition tab.

The set is scoped to the semesters the student has actually reached: the handler resolves the current and registration semesters from the Students service (falling back to the application's own semester when there is no student record yet) and only bills up to that point. Future semesters in the fee structure are not shown as outstanding.

For the equivalent across *all* fee categories, not just tuition, use [GET /payment-console/outstanding-all/{applicationGuid}](./get-all-outstanding-ledgers.md).

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | No | Supply it once the applicant has become a student. Without it the handler cannot read the student's academic status and falls back to the application's semester, which can widen or narrow the billed range. |

## Request body
None.

## Validation
None.

## Response 200
Returns a `List<OutstandingLedgerResponseDto>` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": [
    {
      "ledgerGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "semesterGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "ledgerName": "Tuition Fee",
      "ledgerNum": 1,
      "currencyGuid": "…",
      "currencyName": "Uganda Shilling",
      "ledgerAmount": 1500000,
      "paidAmount": 600000,
      "outstanding": 900000
    }
  ],
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `ledgerNum` | The ledger's ordering number within the fee structure — this is the sequence the allocation engine settles in |
| `ledgerAmount` | The fee-structure amount for this ledger/semester |
| `outstanding` | `ledgerAmount - paidAmount` |

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | `"Fee structure not assigned to this application."` (`feeHdGuid` is null) or `"Could not resolve the student's current semester."` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."`, `"No fee structure lines found."`, or `"No outstanding ledgers found."` — note the last one means **fully paid**, a normal state, not an error to show as one |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
