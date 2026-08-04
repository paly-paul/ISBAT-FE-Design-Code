# Vetting Desk — API Reference (for frontend)

Base paths:
- Vetting desk: `/api/v1/admissions/vetting`
- Approve/Reject action (lives in Application Filling, not Vetting): `/api/v1/admissions/application-filling`

All endpoints are routed through the YARP gateway (port 5000) to the Admissions service. The gateway validates the JWT and injects user claims as `X-User-*` headers before forwarding.

---

## Endpoints Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admissions/vetting/applications` | Paginated vetting queue (list) |
| GET | `/api/v1/admissions/vetting/applications/{applicationGuid}` | Full application detail for the vetting desk |
| POST | `/api/v1/admissions/vetting/applications/{applicationGuid}/wait` | Put an application "on hold" (non-terminal) |
| POST | `/api/v1/admissions/application-filling/{applicationGuid}/vet` | Approve or Reject an application (terminal decision) |

---

## GET `/api/v1/admissions/vetting/applications`

Returns the paginated list of applications awaiting vetting.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appRefNo` | `string` | No | — | Exact match filter on application reference number |
| `studentName` | `string` | No | — | Partial match on `FirstName + LastName` |
| `page` | `int` | No | `1` | Page number (1-based) |
| `pageSize` | `int` | No | `10` | Records per page |

### Response — `VettingQueueResultDto`

```json
{
  "items": [
    {
      "intApplication": 1024,
      "applicationGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "appRefNo": "APP1001/1024",
      "studentName": "Jane Doe",
      "programGuid": "b3c1...",
      "programName": "BSc Computer Science",
      "type": "Direct",
      "documentsUploaded": 4,
      "documentsTotal": 5,
      "submittedDate": "2026-07-20T10:15:00",
      "action": 1
    }
  ],
  "totalCount": 42,
  "pageNumber": 1,
  "pageSize": 10,
  "summary": {
    "pendingCount": 42,
    "oldestSubmittedDate": "2026-07-01T09:00:00"
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `type` | `string` | `"Direct"` or `"ODL"`. There is no `"Transfer"` value — no data source for it. |
| `documentsUploaded` / `documentsTotal` | `int` | Core docs (National ID, Passport, Photo) + one per qualification proof |
| `action` | `byte?` | Raw status byte — see **Status values** below |

---

## GET `/api/v1/admissions/vetting/applications/{applicationGuid}`

Returns full application detail for the vetting desk to review.

### Response — `VettingApplicationDetailDto`

```json
{
  "intApplication": 1024,
  "applicationGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "appRefNo": "APP1001/1024",
  "firstName": "Jane",
  "lastName": "Doe",
  "dob": "2004-03-12T00:00:00",
  "gender": "Female",
  "nationality": null,
  "nationalId": "CM94...",
  "phone": "+256700000000",
  "emailId": "jane@example.com",
  "admissionType": "Direct",
  "programGuid": "b3c1...",
  "programName": "BSc Computer Science",
  "intakeGuid": "c1d2...",
  "intakeName": "January 2026 Intake",
  "campusGuid": "d4e5...",
  "campusName": "Main Campus",
  "submittedDate": "2026-07-20T10:15:00",
  "spName": "John Doe",
  "spEmail": "john@example.com",
  "spPhone": "+256700000001",
  "vStartDate": null,
  "vEndDate": null,
  "semesterGuid": "e6f7...",
  "batchGuid": "f8a9...",
  "batchTimeGuid": "a0b1...",
  "feeHdGuid": "c2d3...",
  "action": 1,
  "justificationReg": null,
  "approveDateReg": null,
  "docVerified": null,
  "verifiedDate": null,
  "docRemarks": null,
  "feePaid": true,
  "documents": [
    { "documentType": "NationalId", "uploaded": true, "url": "https://..." },
    { "documentType": "Passport", "uploaded": false, "url": null },
    { "documentType": "Visa", "uploaded": false, "url": null },
    { "documentType": "Photo", "uploaded": true, "url": "https://..." }
  ],
  "qualifications": [
    {
      "intApplicationQual": 55,
      "applicationQualGuid": "b1c2...",
      "institution": "O Level",
      "university": "Some High School",
      "passYear": 2020,
      "grade": "Div 2",
      "yearsTaken": 4,
      "proofUserFileName": "cert.pdf",
      "proofUrl": "https://..."
    }
  ]
}
```

### Field notes

| Field | Notes |
|-------|-------|
| `nationality` | **Always `null` today.** `ApplicationEntity.CountryGuid` has no matching `Guid` on the Academic side (`CountryEntity` is still int-code keyed). Not wired up — don't build UI expecting a value here. |
| `gender` | One of `"Male"`, `"Female"`, `"Other"`, or `null`. Note: legacy only ever had Male/Female — `"Other"` is new in this system. |
| `admissionType` | `"Direct"` or `"ODL"`, derived from whether the application has an ODL application link. No `"Transfer"` value exists. |
| `feePaid` | `true` if a non-deleted payment/exemption record exists for this application; `false` otherwise. Not a status enum — just existence of a payment row. |
| `docVerified` / `verifiedDate` / `docRemarks` | Generic "documents verified" flag set automatically when a registrar Approves (see Approve/Reject below) — not qualification-specific, not UNEB-specific. |
| Qualifications `institution` | Free text. **By convention only** (not enforced/validated), staff type `"O Level"` / `"A Level"` etc. into this field — there is no separate `type` column. |

### Fields that do **not** exist — do not build UI for these

The following were asked about and confirmed absent from the data model. There is nothing in the API to bind them to:

| Field | Status |
|-------|--------|
| **Address** | No `Address` column anywhere on `ApplicationEntity`. Not returned, not storable. |
| **Qualification "Type"** (e.g. O-Level/A-Level as a real enum/dropdown) | Does not exist as a column. Only inferable, unreliably, from free-text `institution`. |
| **Index No** (exam index number) | Does not exist anywhere in the schema. |
| **Family / Guardian page** | No guardian/family entity or fields exist. The closest concepts are `spName/spEmail/spPhone` (**Sponsor**, not guardian) and `Ref1*`/`Ref2*` (referee contacts) — neither is a "family/guardian" page and `Ref1*`/`Ref2*` aren't even exposed by this DTO today. **Do not build a Family/Guardian page against this API.** |

---

## POST `/api/v1/admissions/vetting/applications/{applicationGuid}/wait`

Marks an application "on hold" — a non-terminal action. Does **not** approve or reject.

### Request Body

```json
{ "remarks": "Waiting on updated transcript" }
```

| Field | Type | Required |
|-------|------|----------|
| `remarks` | `string?` | No |

### Response

`200 OK` with `true`/`false` (`Result<bool>`), or `404` if the application doesn't exist.

---

## POST `/api/v1/admissions/application-filling/{applicationGuid}/vet`

Approves or rejects a submitted application. This is a **terminal** decision (unlike Wait).

### Request Body — `VetApplicationRequest`

```json
{ "action": 1, "justificationReg": null }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `action` | `RegistrarAction` (byte enum) | Yes | `1` = Approved, `2` = Rejected. (`3` = `Registered` exists on the enum but is not used by this endpoint.) |
| `justificationReg` | `string?` | Required if `action = Rejected` | Validated server-side; request fails without it on reject. |

### Response — `VetApplicationResponse`

```json
{ "intApplication": 1024, "appRefNo": "APP1001/1024", "action": 2 }
```

`action` here is the **persisted status byte** (`EnumApplicationStatus`), not the request's `RegistrarAction` — see Status values below.

### Side effects

- Approve → also sets `docVerified = 1` (auto-verifies documents; there's no separate manual "verify documents" step) and attempts to send a provisional letter (best-effort; failure is logged, not returned as an error).
- Only applications with `action == 1` (Submitted) can be vetted — attempting to vet an already-vetted/rejected/waiting application returns a failure.

---

## Status values (`action` field, across all endpoints)

`action` is a `byte?` on `T_APPLICATION.ACTION`. There is no single enum backing every value — it's assembled from three different enums depending on who wrote it:

| Value | Meaning | Set by |
|-------|---------|--------|
| `null` | Application still being filled in, not yet submitted | Default |
| `0` | **Waiting** (on hold) | `POST .../wait` |
| `1` | Submitted, awaiting vetting | `POST .../submit` (Application Filling) |
| `2` | Approved / Registrar Vetted | `POST .../vet` with `action=1` (Approved) |
| `3` | Rejected by Registrar | `POST .../vet` with `action=2` (Rejected) |
| `4` | Registered | Set elsewhere (post-vetting registration flow), not by these endpoints |

The vetting queue (`GET .../applications`) currently lists rows where `action == 1 (Submitted)` **only**. `action == 0/2/3/4` never appear in this list.

---

## Date Format

All `datetime` fields use ISO 8601 (`YYYY-MM-DDTHH:mm:ss`, UTC assumed).
