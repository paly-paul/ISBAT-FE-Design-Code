# PUT /api/v1/academic/program-master/{programGuid}

**API ID:** `academic-service.academic.program-master.update`
**Service:** erp-academic-service
**Module:** Academic
**Auth:** Required — validated via `erp_access` cookie at the gateway; no fine-grained permission beyond being an authenticated user.

## Description
Updates a program's **header fields only** — code, name, status, level, group, faculty, currency, stream, intake and fees. It does **not** touch course units or fee structures; for those use [PUT /program-master/{programGuid}/update-complete](./put-program-update-complete.md).

**`multipart/form-data`**, not JSON — the optional accreditation-letter upload rides along in the same request. Antiforgery is disabled on this route.

## Path params
| Name | Type | Required | Notes |
|---|---|---|---|
| `programGuid` | Guid | Yes | Route-constrained to `:guid` |

## Query params
None.

## Request body
`multipart/form-data` with these fields:

| Field | Type | Notes |
|---|---|---|
| `programCode` | string | Required |
| `programName` | string | Required |
| `pgmStatus` | bool | |
| `noIa` | bool | |
| `programGroupGuid` | Guid? | Checked for existence when supplied |
| `unitCount` | int? | |
| `appFee` | decimal? | |
| `lateFee` | decimal? | |
| `programLevelGuid` | Guid | Required |
| `facultyGuid` | Guid? | Checked when supplied |
| `currencyGuid` | Guid? | |
| `dateAcc` | DateTime? | Accreditation date |
| `streamGuid` | Guid? | [Specialization](../specializations/get-specializations.md); checked when supplied |
| `intakeGuid` | Guid? | Checked when supplied |
| `accLetterFile` | file | Optional accreditation letter |

## Validation
`UpdateProgramMasterCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `programCode` | required, max 25 chars | Uniqueness enforced in the handler |
| `programName` | required, max 150 chars | |
| `programLevelGuid` | required, must not be empty | |
| `unitCount` | must be > 0, **only when supplied** | |
| `appFee` | must be ≥ 0, **only when supplied** | |
| `lateFee` | **no rule** | Unvalidated — negative late fees are accepted, unlike `appFee` |
| `accLetterFile` | **no rule** | No size or content-type check at the API layer |

### Business rules (handler-level, not FluentValidation)
| Rule | Behavior |
|---|---|
| Program must exist | 404 `not_found` — `"Program not found."` |
| `programCode` unique excluding self | 400 with `code: "duplicate_program_code"` — `"Program code '{code}' already exists."` A custom code, not `conflict`. |
| `programLevelGuid` must resolve | 404 `not_found` — `"Program level not found."` |
| `programGroupGuid`, when supplied, must resolve | 404 `not_found` — `"Program group not found."` |
| `facultyGuid`, when supplied, must resolve | 404 `not_found` — `"Faculty not found."` |
| `streamGuid`, when supplied, must resolve | 404 `not_found` — `"Specialization not found."` |
| `intakeGuid`, when supplied, must resolve | 404 `not_found` — `"Intake not found."` |

## Response 200
Returns the updated `ProgramMasterDto` as the `data` payload — the same shape as [GET /program-master/{programGuid}](./get-program-by-guid.md).

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 400 | `duplicate_program_code` | Another program already uses this code |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |
| 404 | `not_found` | Program not found, or one of the supplied GUIDs does not resolve — the `errors` message says which |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
