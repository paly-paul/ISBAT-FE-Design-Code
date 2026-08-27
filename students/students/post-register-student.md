# POST /api/v1/students/register

**API ID:** `academic-service.students.students.register`
**Service:** erp-academic-service
**Module:** Students
**Auth:** Required — validated via `erp_access` cookie at the gateway; **no fine-grained permission**.

## Description
Creates a student record from a vetted application — the Students module's own registration command.

> **Prefer the registrar-desk endpoint.** [POST /admissions/registrar-desk/applications/{applicationGuid}/register](../../admission/registrar-desk/post-register-student.md) is the supported path: it takes four fields, resolves all the placement data itself from the application, and enforces that the application is actually in RegistrarVetted status. This endpoint takes **twenty** fields, trusts every one of them, and performs **no status check** — so it will happily register an application that was never vetted, or with placement data that contradicts the application record. Treat it as the internal/back-fill entry point.

It also accepts a **`password` in plain text** in the request body, for the student portal account created alongside the record.

## Path params
None.

## Query params
None.

## Request body
```json
{
  "intApplication": 4471,
  "applicationGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "programGuid": "…",
  "semesterGuid": "…",
  "intSem": 412,
  "batchGuid": "…",
  "intBatch": 104,
  "campusGuid": "…",
  "intType": 1,
  "intakeCode": 261,
  "yearCode": 2026,
  "intFee": 88,
  "campusCode": "KLA",
  "password": "…",
  "isRefugee": false,
  "refugeeId": null,
  "aptech": false,
  "studentName": "Amina Nakato",
  "email": "amina.nakato@example.com",
  "semCount": 6
}
```

Note the mix of GUIDs and **legacy integer keys** (`intApplication`, `intSem`, `intBatch`, `intType`, `intFee`, `intakeCode`, `yearCode`) — both forms of the same references must be supplied and kept consistent by the caller; nothing cross-checks them.

## Validation
`RegisterStudentCommandValidator`:

| Field | Rule | Notes |
|---|---|---|
| `intApplication` | must be > 0 | |
| `studentName` | required, max 50 chars | |
| `password` | required | **No complexity or length rule** |
| `campusCode` | required | |
| `programGuid`, `semesterGuid`, `batchGuid`, `campusGuid` | must not be `Guid.Empty` | Existence is **not** checked |
| `intSem`, `intType`, `intakeCode`, `yearCode`, `intFee`, `semCount` | each must be > 0 | |
| `applicationGuid`, `email`, `isRefugee`, `refugeeId`, `aptech` | **no rules** | `email` is not format-checked; `refugeeId` is not required even when `isRefugee` is true |

Every rule above is a shape check. **No rule confirms the referenced application, program, semester, batch or campus actually exists**, and none checks the application's vetting status.

## Response 200
Returns the registration result as the `data` payload. See [api/README.md](../../../README.md) for the envelope.

## Errors
| Status | Code | Reason |
|---|---|---|
| 400 | `validation_error` | One or more fields failed validation |
| 401 | `unauthorized` | Missing/invalid/expired `erp_access` cookie |

## Used by pages
_(no page docs reference this yet)_

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-17 | Vaishnav | Initial version created |
