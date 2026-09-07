# POST /api/v1/academic/program-master/save-complete

**API ID:** `academic-service.academic.program-master.save-complete`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Creates a program **together with its course units and fee structures** in one transaction — the "save everything" path behind the full program-master wizard. [POST /program-master](./post-program-master.md) creates the header alone.

Everything is validated before anything is written: program header, then every course unit, then every fee structure. A failure anywhere rolls the whole thing back, so a partially-created program is not a state you can reach through this endpoint.

**`multipart/form-data`**, not JSON — the nested units and fee structures are parsed out of indexed form fields by a dedicated form parser, and the accreditation letter rides along as a file part. Antiforgery is disabled on this route.

## Path params
None.

## Query params
None.

## Request body
`multipart/form-data`. The header fields are the same set as [PUT /program-master/{programGuid}](./put-program-master.md); on top of those the parser reads indexed collections for the nested data:

| Group | Notes |
|---|---|
| Program header | `programCode`, `programName`, `pgmStatus`, `noIa`, `programGroupGuid`, `unitCount`, `appFee`, `lateFee`, `programLevelGuid`, `facultyGuid`, `currencyGuid`, `dateAcc`, `streamGuid`, `intakeGuid` |
| `programUnits[]` | Course units to attach: each references a course unit, and optionally a stream, unit type and unit category |
| `feeStructures[]` | Fee headers with their fee lines |
| `accLetterFile` | Optional accreditation letter file part |

Because the exact indexed field naming is owned by `ProgramMasterFormParser`, mirror what the program-master wizard sends rather than constructing the form by hand.

## Validation
`SaveProgramWithDetailsCommandValidator` delegates to `SaveProgramWithDetailsRequestValidator` for the header fields. The nested collections are **not** validated by FluentValidation — they go through handler-level validators (`ProgramMasterValidator.ValidateUnitsAsync` / `ValidateFeeStructuresAsync`) instead, so their failures come back as business-rule errors rather than `validation_error`.

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| `programCode` must be unique | 400 with `code: "duplicate_program_code"` — `"Program code '{code}' already exists."` |
| `programLevelGuid` must resolve | 404 `not_found` — `"Program level not found."` |
| `programGroupGuid`, when supplied, must resolve | 404 `not_found` — `"Program group not found."` |
| `facultyGuid`, when supplied, must resolve | 404 `not_found` — `"Faculty not found."` |
| Each unit's referenced course unit, stream, unit type and unit category must resolve | 400/404 carrying that unit's message |
| Each fee structure's fee code must be unique, and its intake must resolve | 400/404 carrying that fee structure's message |

## Response 201
Returns the created `ProgramMasterDto` as the `data` payload — the same shape as [GET /program-master/{programGuid}](./get-program-by-guid.md), re-read after the write — with `message: "Program saved successfully."`.

For the units and fee structures as saved, follow up with [GET /program-course-units/{programGuid}](./get-program-course-units.md) and [GET /Programfee-structure](./get-fees-by-program.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | A header field failed validation |
| 400 | `duplicate_program_code` | A program with this code already exists |
| 400 | (generic failure) | A nested unit or fee structure failed its handler-level check |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | A referenced level, group, faculty, stream, unit or intake does not resolve |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
