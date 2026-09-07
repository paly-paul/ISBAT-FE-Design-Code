# PUT /api/v1/academic/program-master/{programGuid}/update-complete

**API ID:** `academic-service.academic.program-master.update-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates a program **together with its course units and fee structures** in one transaction — the editing counterpart of [POST /program-master/save-complete](./post-program-save-complete.md), and the full-fat alternative to header-only [PUT /program-master/{programGuid}](./put-program-master.md).

The nested collections are **replacements, not merges**: send the complete intended set of `programUnits` and `feeStructures`, because anything you omit is dropped. Load the current state from [GET /program-master/{programGuid}/full-details](./get-program-full-details.md) first.

The accreditation letter is likewise **replaced** when a file part is present — the handler swaps the attachment for this program rather than appending. Omit the file part to leave the existing letter alone.

**`multipart/form-data`**, not JSON. Antiforgery is disabled on this route.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
`multipart/form-data` — the identical field set to [POST /program-master/save-complete](./post-program-save-complete.md): program header fields, indexed `programUnits[]` and `feeStructures[]` collections, and an optional `accLetterFile` part. Mirror what the program-master wizard sends rather than constructing the form by hand.

## Validation
`UpdateProgramCompleteCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `programGuid` (path) | must not be empty | |
| Program header fields | per `SaveProgramWithDetailsRequestValidator` | The same header rules as save-complete |

Nested units and fee structures are validated in the handler, not by FluentValidation.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Program must exist | 404 `not_found` — `"Program not found."` |
| `programCode` unique excluding self | 400 with `code: "duplicate_program_code"` — `"Program code '{code}' already exists."` |
| `programLevelGuid` must resolve | 404 `not_found` — `"Program level not found."` |
| `programGroupGuid`, when supplied, must resolve | 404 `not_found` — `"Program group not found."` |
| Each unit's referenced course unit, stream, unit type and unit category must resolve | 400/404 carrying that unit's message |
| Each fee structure's fee code must be unique **within this program**, and its intake must resolve | 400/404 carrying that fee structure's message |

## Response 200
Returns the updated `ProgramMasterDto` as the `data` payload, re-read after the write, with `message: "Program updated successfully."`.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | A header field failed validation |
| 400 | `duplicate_program_code` | Another program already uses this code |
| 400 | (generic failure) | A nested unit or fee structure failed its handler-level check |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Program not found, or a referenced entity does not resolve |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
