# Application Filling — API Documentation

Base path: `/api/v1/admissions/application-filling`

---

## Table of Contents

1. [Overview](#overview)
2. [API List](#api-list)
3. [Dropdown / Lookup APIs](#dropdown--lookup-apis)
4. [Write APIs (POST/DELETE)](#write-apis)
5. [Validations Summary](#validations-summary)

---

## Overview

The Application Filling feature allows a student (or admin on behalf of a student) to fill in and submit an application form. The flow is:

1. **Payment must exist first** — `SaveGeneral` requires an `AppRefNo` which is created by the Application Payment feature.
2. Fill **General** details (personal info, programme, documents).
3. Add one or more **Qualifications**.
4. Upload a **Photo**.
5. **Submit** the application (requires General saved + at least 1 qualification).

---

## API List

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | GET | `/lookup` | Look up application by reference number |
| 2 | GET | `/` | List all applications (paginated) |
| 3 | GET | `/payment-search` | Search applications eligible for payment |
| 4 | GET | `/{applicationGuid}` | Get completed application by GUID |
| 5 | GET | `/countries` | Get countries dropdown |
| 6 | GET | `/{intApplication}/detail` | Get application detail by integer ID |
| 7 | GET | `/{intApplication}/qualifications` | List qualifications for an application |
| 8 | GET | `/filter` | Filter applications by gender / country |
| 9 | GET | `/{intApplication}/summary` | Get application summary |
| 10 | GET | `/{intApplication}/photo` | Get student photo (file URL) |
| 11 | POST | `/general` | Save/update General section (multipart) |
| 12 | POST | `/qualifications` | Add/update a qualification (multipart) |
| 13 | DELETE | `/qualifications/{intApplicationQual}` | Delete a qualification |
| 14 | POST | `/photo` | Upload student photo (multipart) |
| 15 | POST | `/{intApplication}/submit` | Submit the completed application |
| 16 | POST | `/contacts` | Get contact details for a list of application IDs |

---

## Dropdown / Lookup APIs

### 1. Lookup Application by Ref No
```
GET /lookup?appRefNo=APP2026/1
```
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `appRefNo` | `string` | Yes | Application reference number |

**Response:** `{ appRefNo, intApplication, applicationGuid, status }`

---

### 2. List Applications
```
GET /?page=1&pageSize=10
```
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | `int` | No | 1 | Page number |
| `pageSize` | `int` | No | 10 | Results per page |

---

### 3. Payment Search
```
GET /payment-search?searchTerm=john&pageNumber=1&pageSize=20
```
Used to search for applications when creating a payment. Search matches on student name, email, phone, or ref no.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `searchTerm` | `string` | No | — | Partial match |
| `pageNumber` | `int` | No | 1 | Page number |
| `pageSize` | `int` | No | 20 | Results per page |

---

### 4. Get Application by GUID
```
GET /{applicationGuid}
```
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationGuid` | `Guid` | Yes | Application GUID (path param) |

---

### 5. Countries Dropdown
```
GET /countries
```
No query params. Returns list of `{ countryGuid, countryName }`.

> ⚠️ **Do not use this endpoint in the Application Filling feature.** Country data must be sourced from the **Identity module** countries GET API.

---

### 6. Get Application Detail
```
GET /{intApplication}/detail
```
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `intApplication` | `int` | Yes | Application integer ID (path param) |

---

### 7. List Qualifications
```
GET /{intApplication}/qualifications
```
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `intApplication` | `int` | Yes | Application integer ID (path param) |

---

### 8. Filter Applications
```
GET /filter?gender=1&countryGuid=3fa85f64-5717-4562-b3fc-2c963f66afa6
```
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `gender` | `byte` | No | `0` = Female, `1` = Male |
| `countryGuid` | `Guid` | No | Filter by country GUID |

**Response:** `List<int>` — list of `intApplication` IDs matching the filter.

---

### 9. Get Application Summary
```
GET /{intApplication}/summary
```

---

### 10. Get Student Photo
```
GET /{intApplication}/photo
```
Returns a presigned file URL for the student's photo.

---

### 11. Get Application Contacts
```
POST /contacts
Content-Type: application/json

Body: [1, 2, 3]   (array of intApplication integers)
```
| Body | Type | Required | Description |
|------|------|----------|-------------|
| (body) | `int[]` | Yes | List of `intApplication` IDs |

---

## Write APIs

### POST `/general` — Save Application General
**Content-Type:** `multipart/form-data`

> **Prerequisite:** An `AppRefNo` must already exist (created by Application Payment). The handler resolves `intApplication` from the ref no; if not found, the request fails.

**Dummy Payload:**

| Field | Type | Required | Validation | Notes / FK Dropdown |
|-------|------|----------|------------|---------------------|
| `appRefNo` | `string` | **Yes** | Not empty | Created by Application Payment. e.g. `APP2026/1` |
| `enquiryGuid` | `Guid` | No | Valid GUID | FK → `GET /api/v1/admissions/enquiries` |
| `intakeCode` | `string` | No | — | e.g. `"2026"` |
| `emailId` | `string` | No | — | Student email |
| `dob` | `DateTime` | No | — | Format: `yyyy-MM-dd` e.g. `2000-01-15` |
| `firstName` | `string` | No | — | |
| `lastName` | `string` | No | — | |
| `gender` | `byte` | No | — | `0` = Female, `1` = Male |
| `countryGuid` | `Guid` | No | — | FK → Identity module countries GET API (do not use `/countries` from this feature) |
| `phone` | `string` | No | — | e.g. `"700000000"` |
| `nationalId` | `string` | No | — | National ID number |
| `nationalIdFile` | `file` | No | — | Replaces existing file for this application |
| `passportNo` | `string` | No | — | |
| `passportFile` | `file` | No | — | |
| `vStartDate` | `DateTime` | No | — | Visa start date |
| `vEndDate` | `DateTime` | No | — | Visa end date |
| `visaFile` | `file` | No | — | |
| `spName` | `string` | No | — | Sponsor/parent name |
| `spEmail` | `string` | No | — | Sponsor email |
| `spCountryGuid` | `Guid` | No | — | FK → Identity module countries GET API (do not use `/countries` from this feature) |
| `spPhone` | `string` | No | — | Sponsor phone |
| `campusGuid` | `Guid` | **Yes** (validator) | Not null | FK → Academic service campus dropdown |
| `programGuid` | `Guid` | **Yes** (validator) | Not null | FK → Academic service programme dropdown |
| `feeHdGuid` | `Guid` | **Yes** (validator) | Not null, not empty | FK → `GET /api/v1/admissions/application-payments/dropdowns/fees?programGuid=...` |
| `semesterGuid` | `Guid` | No | — | FK → Academic service semester dropdown |
| `batchTimeGuid` | `Guid` | No | — | FK → Academic service batch-time dropdown |
| `batchGuid` | `Guid` | No | — | FK → `GET /api/v1/admissions/application-payments/dropdowns/batches?programGuid=...&semesterGuid=...&batchTimeGuid=...` |
| `refugee` | `byte` | No | — | `0` = No, `1` = Yes |
| `refugeeId` | `string` | Conditional | Required when `refugee = 1` | Refugee ID number |
| `refugeeFile` | `file` | No | — | Refugee certificate document |

**Example form values:**
```
appRefNo       = APP2026/1
enquiryGuid    = 3fa85f64-5717-4562-b3fc-2c963f66afa6
intakeCode     = 2026
emailId        = john.doe@example.com
dob            = 2000-01-15
firstName      = John
lastName       = Doe
gender         = 1
countryGuid    = 3fa85f64-5717-4562-b3fc-2c963f66afa6
phone          = 700000000
nationalId     = CM90000000UG
campusGuid     = 3fa85f64-5717-4562-b3fc-2c963f66afa6
programGuid    = 3fa85f64-5717-4562-b3fc-2c963f66afa6
feeHdGuid      = 3fa85f64-5717-4562-b3fc-2c963f66afa6
semesterGuid   = 3fa85f64-5717-4562-b3fc-2c963f66afa6
batchTimeGuid  = 3fa85f64-5717-4562-b3fc-2c963f66afa6
batchGuid      = 3fa85f64-5717-4562-b3fc-2c963f66afa6
refugee        = 0
```

**Response:** `{ intApplication, applicationGuid, isFirstSave, saveStep }`

---

### POST `/qualifications` — Save Application Qualification
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `appRefNo` | `string` | **Yes** | Not empty | e.g. `APP2026/1` |
| `institution` | `string` | **Yes** | Not empty, max 200 chars | School/college name |
| `university` | `string` | **Yes** | Not empty, max 200 chars | Awarding university/board |
| `passYear` | `int` | **Yes** | Not null, between 1950 and current year | Year of passing |
| `grade` | `string` | **Yes** | Not empty, max 50 chars | Grade / division / GPA |
| `yearsTaken` | `int` | **Yes** | Not null, > 0 | Duration of the course in years |
| `proofFile` | `file` | **Yes** | Not null | Certificate/transcript document |

**Example form values:**
```
appRefNo    = APP2026/1
institution = St. Mary's College
university  = Makerere University
passYear    = 2022
grade       = First Class
yearsTaken  = 3
proofFile   = <file>
```

**Response:** `{ intApplicationQual, appRefNo }`

---

### DELETE `/qualifications/{intApplicationQual}` — Delete Qualification
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `intApplicationQual` | `int` | Yes | Qualification integer ID (path param) |

**Response:** success message.

---

### POST `/photo` — Upload Student Photo
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `appRefNo` | `string` | **Yes** | Not empty | e.g. `APP2026/1` |
| `photo` | `file` | **Yes** | Not null; allowed extensions: `.jpg`, `.jpeg`, `.png`, `.bmp` | Student passport-style photo |

---

### POST `/{intApplication}/submit` — Submit Application
**Content-Type:** `application/json`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `intApplication` | `int` | Yes | Path param, must be > 0 |

**Body:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `appRefNo` | `string` | **Yes** | Not empty | |
| `declarationAccepted` | `bool` | **Yes** | Must be `true` | "I confirm the information is correct" |

**Example body:**
```json
{
  "appRefNo": "APP2026/1",
  "declarationAccepted": true
}
```

**Business rules checked at submit time (in handler):**
- General section must already be saved (record must exist).
- At least 1 qualification must be added.
- Both checks return `400` with a descriptive message if not met.

**Response:** `{ intApplication, appRefNo }`

---

## Validations Summary

### Save General (`POST /general`)
| Rule | Field | Condition |
|------|-------|-----------|
| Required | `appRefNo` | Always |
| Required | `campusGuid` | Always (not null) |
| Required | `programGuid` | Always (not null) |
| Required | `feeHdGuid` | Always (not null, not empty GUID) |
| Required | `refugeeId` | Only when `refugee = 1` |

### Save Qualification (`POST /qualifications`)
| Rule | Field | Condition |
|------|-------|-----------|
| Required | `appRefNo` | Always |
| Required, max 200 | `institution` | Always |
| Required, max 200 | `university` | Always |
| Required, 1950–current year | `passYear` | Always |
| Required, max 50 | `grade` | Always |
| Required, > 0 | `yearsTaken` | Always |
| Required | `proofFile` | Always |

### Upload Photo (`POST /photo`)
| Rule | Field | Condition |
|------|-------|-----------|
| Required | `appRefNo` | Always |
| Required | `photo` | Always |
| Allowed extensions: `.jpg` `.jpeg` `.png` `.bmp` | `photo.FileName` | When file is present |

### Submit (`POST /{intApplication}/submit`)
| Rule | Field | Condition |
|------|-------|-----------|
| > 0 | `intApplication` | Always (path param) |
| Must be `true` | `declarationAccepted` | Always |
| General section must exist | (handler check) | Always |
| At least 1 qualification must exist | (handler check) | Always |
