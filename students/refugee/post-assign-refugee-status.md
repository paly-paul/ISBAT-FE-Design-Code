# POST /api/v1/students/refugee/{studentGuid}

**API ID:** `academic-service.students.refugee.assign`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Grants a student refugee status, with the supporting document. Pick the student from [GET /students/refugee/eligible](./get-eligible-students.md).

The document is **mandatory** here — unlike most file uploads in this codebase, it is both required and properly validated (see below), and the request is rejected outright without it.

**`multipart/form-data`**, not JSON. Antiforgery is disabled on this route.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `studentGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
`multipart/form-data`:

| Field | Type | Notes |
|---|---|---|
| `intCountryCode` | int | **Legacy integer** country key, not a GUID |
| `refugeeId` | string | The refugee document/registration number |
| `document` | file | Supporting document — required |

## Validation
`AssignStudentRefugeeStatusCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `studentGuid` (path) | must not be empty | |
| `intCountryCode` | must be > 0 | |
| `refugeeId` | required, **max 20 chars** | A tighter limit than most identifier fields in this repo |
| `document` | required | Message: `"A refugee document file is required."` |
| `document` | must pass `FileUploadValidator` | Checks the file against the configured S3 storage options — **a real size and content-type check**, unlike the extension-only check on [application photo upload](../../admission/application-filling/post-application-photo.md) |

## Response 201
Returns the created refugee-status record as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | Missing/over-long `refugeeId`, non-positive `intCountryCode`, or a missing or disallowed document |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
