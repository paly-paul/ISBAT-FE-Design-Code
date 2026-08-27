# GET /api/v1/students/applications/{applicationGuid}/documents

**API ID:** `academic-service.students.students.application-documents`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Returns the identity documents attached to the application a student was registered from, so student-side screens can show them without reaching into the Admissions module.

> **Two endpoints, same name, different modules.** The Admissions module exposes [GET /admissions/application-filling/{applicationGuid}/documents](../../admission/application-filling/get-application-documents.md) on the same concept. This one is the Students module's own route, keyed by `applicationGuid` rather than `studentGuid` — note that even here the parameter is the *application's* GUID, not the student's.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `applicationGuid` | Guid | Yes | The **application** GUID, not `studentGuid`. Route-constrained to `:guid`. |

## Query params
None.

## Request body
None.

## Validation
None.

## Response 200
Returns the application's documents as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

As on the Admissions side, documents the applicant never uploaded are simply absent rather than returned as empty entries.

## Errors
| Status | Code | Reason |
|---|---|---|
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | No application with this GUID |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
