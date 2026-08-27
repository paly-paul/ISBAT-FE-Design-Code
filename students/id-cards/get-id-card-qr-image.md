# GET /api/v1/students/id-cards/{studentGuid}/qr-image

**API ID:** `academic-service.students.id-cards.qr-image`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Generates the QR code printed on a student's ID card, as a PNG.

> **This endpoint does not return the standard envelope.** It returns the **raw PNG bytes** with `Content-Type: image/png` — the only response in this module that bypasses `ApiResult<T>`. Bind it directly as an `<img src>`; do not try to parse it as JSON.

The QR encodes the bare `studentGuid` as text — nothing more, and nothing signed. Scanning it yields the GUID, which [GET /students/id-cards/qr/{studentGuid}](./get-id-card-qr-scan-result.md) turns back into student details. Because the payload is just an identifier with no signature or expiry, the QR proves nothing on its own; verification has to go through that endpoint.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
None.

## Validation
None.

**The student is never looked up.** The handler encodes whatever GUID is in the route straight into a QR image, so an unknown or made-up GUID still returns a valid PNG — there is no 404 on this route. Validity is only discovered when the code is scanned and resolved.

## Response 200
Raw PNG image bytes. `Content-Type: image/png`. No JSON envelope, no `success` field.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

No 404 — see the note above.

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
