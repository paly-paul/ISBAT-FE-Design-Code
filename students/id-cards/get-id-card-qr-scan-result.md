# GET /api/v1/students/id-cards/qr/{studentGuid}

**API ID:** `academic-service.students.id-cards.qr-scan-result`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Resolves a scanned ID-card QR code to the student it identifies — the verification endpoint behind scanning a card at a gate or desk.

The QR code encodes the bare `studentGuid` (see [GET /students/id-cards/{studentGuid}/qr-image](./get-id-card-qr-image.md)), so a scanner reads the GUID out of the image and calls this to get something human-readable back.

**Note it still requires an authenticated session** — this is a staff-side verification endpoint, not a public one, so a scanner app must carry the `erp_access` cookie.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | The value decoded from the QR image. Route-constrained to `:guid`. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the scan result as the `data` payload — the student identity and card validity a verifier needs. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | The GUID does not resolve to a student with a card |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
