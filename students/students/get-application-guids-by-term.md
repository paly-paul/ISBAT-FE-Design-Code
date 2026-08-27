# GET /api/v1/students/application-guids-by-term

**API ID:** `academic-service.students.students.application-guids-by-term`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Resolves a free-text search term to the **application GUIDs** of matching students — a narrow lookup that returns identifiers only, no student data.

It exists for cross-module search: a caller holding a search string (typically Finance, searching for a student to take payment from) uses this to get the application GUIDs, then fetches details from whichever module owns them. For a search that returns actual student records, use [POST /students/search/search](../student-search/post-student-search.md).

## Path params
None.

## Query params
| Parameter | Type | Required | Notes |
|---|---|---|---|
| `searchTerm` | string | **Yes** | Non-optional binding — omitting it fails binding with a 400. **No minimum length**, so a single character is accepted and can match a very large set. |

## Request body
None.

## Validation
None — no validator, no length floor, and no paging at all: the full matching set comes back in one response.

## Response 200
Returns the matching application GUIDs as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

Note these are **application** GUIDs, not student GUIDs — they key into the Admissions module's [application-filling](../../admission/application-filling/get-application-by-guid.md) surface and into the Finance payment console.

An empty result is a normal 200, not a 404.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | (binding) | `searchTerm` missing |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
