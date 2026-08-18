# GET /api/v1/finance/payment-console/student-profile/{applicationGuid}

**API ID:** `finance-service.payment-console.student-profile`
**Service:** erp-finance-compliance-service
**Module:** Finance
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the full application record backing the payment console header, proxied from the Admissions service. Beyond display, this is where the frontend picks up the GUIDs the rest of the console needs — most importantly `feeHdGuid` (the assigned fee structure) and `semesterGuid`. Several console endpoints fail with `"Fee structure not assigned to this application."` when `feeHdGuid` is null here, so check it before offering a tuition payment.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | From [GET /payment-console/search](./get-search-students.md) |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns a `StudentProfileDto` as the `data` payload. See [api/README.md](../../README.md) for the envelope.

```json
{
  "success": true,
  "data": {
    "applicationGuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "appRefNo": "APP/2026/01842",
    "firstName": "Amina",
    "lastName": "Nakato",
    "phone": "0770000000",
    "emailId": "amina.nakato@example.com",
    "intakeCode": "SEP",
    "yearCode": "2026",
    "intakeGuid": "…",
    "campusGuid": "…",
    "programGuid": "…",
    "semesterGuid": "…",
    "feeHdGuid": "…",
    "batchGuid": "…",
    "refugee": 0,
    "refugeeId": null,
    "studCategory": 1,
    "gender": 2,
    "action": 2,
    "universityEmail": "amina.nakato@isbat.ac.ug"
  },
  "message": null,
  "code": null,
  "errors": null
}
```

| Field | Notes |
|---|---|
| `feeHdGuid` | The fee structure assigned to this application. **Null blocks tuition payments** — the console should surface that before the cashier gets to an error. |
| `semesterGuid` | The application's semester. Where a student record exists, the *student's* current semester (resolved server-side) takes precedence in fee calculations. |
| `intakeGuid` | Required on every payment; a null here produces `"Intake not assigned to this application."` from the create endpoints |
| `studCategory` | `StudentCategoryType`: `1` = SelfPaid (currently the only member) |
| `action` | Admissions-side application status byte; owned by Admissions, not Finance |

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | `"Application not found."` — also returned when the Admissions service is unreachable, since the handler cannot tell the two apart |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
