# GET /api/v1/finance/payment-console/discount/{applicationGuid}/{studentGuid}

**API ID:** `finance-service.payment-console.discount-info`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Resolves the [discount](../discounts/get-discounts.md) actually in force for a student **in their current semester**, and shows what it is worth against that semester's tuition fee.

Resolution is semester-aware, not a simple lookup: an assignment has an effective-from semester and possibly a cancelled-at semester, so a student can hold a discount that does not apply to the semester now being billed. That is why this endpoint takes the student, not the discount, and why it can 404 for a student who visibly has one assigned.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | |
| `studentGuid` | Guid | **Yes** | Required — discount assignments live on the student record |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `DiscountInfoDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "discountName": "Staff dependant 10%",
    "calcType": 2,
    "amtPer": 10,
    "discountAmount": 150000,
    "tuitionFeeAmount": 1500000,
    "tuitionFeePaid": 600000,
    "outstandingTuitionFee": 750000,
    "currencyCode": "UGX"
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `calcType` | `DiscountCalcType`: `1` = Amount, `2` = Percentage |
| `amtPer` | The configured flat amount or percentage |
| `discountAmount` | What the discount is worth in currency against this semester's tuition — the resolved figure, not the configured one |
| `outstandingTuitionFee` | `tuitionFeeAmount - tuitionFeePaid - discountAmount`. Already net of the discount, so don't subtract it again. |

The discount is applied automatically by the allocation engine as a discount line — see `isDiscountLine` on [GET /payment-console/payable-ledgers](./get-payable-ledgers.md). This endpoint is for display; nothing here needs to be passed to a payment call.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (generic failure) | `"Fee structure not assigned to this application."` or `"Could not resolve the student's current semester."` |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."`, `"No fee structure lines found."`, `"No tuition fee ledger found for the current semester."`, or `"No discount assigned to this student."` — the last is the normal answer for most students |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
