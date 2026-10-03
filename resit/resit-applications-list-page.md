# Resit Applications List Page

**Route:** /assessment/resit-applications
**Module:** Assessment

## Purpose
Read-only list of every resit application under the **active resit of the current intake**: who applied, for which unit and part, whether they are resitting CW (IA), UE or both, and whether the resit fee is paid. The exam office uses it to follow up on unpaid fees and to see who sits each unit.

Staff always work on the active resit; there is no resit or intake selector. Applications are created and changed on the [Resit Apply Page](./resit-apply-page.md).

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Resit Applications                                                           │
│ Active resit: Resit Spring 2026                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Course Unit [ All units                               ▾ ]                    │
│ Fee  ( All 1,537 )  ( Paid 904 )  ( Unpaid 633 )                             │
│ 🔍 Reg no, student no, name, unit code or name______ [Search] [Clear]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Student No | Student Name | Programme | Campus | Code | Course Unit | Type | │
│ CW | UE | Fee | Email | Phone                                                │
│ 012240336  | AMIE S LAMIN | BSc AIT   | Main   | BIT2116 | Data Comm… | Theory│
│            |              |           |        |      |             |      │
│                                                               ‹ 1 2 … 154 › │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Header
- Title and the active resit name (`resit.refCode`).
- `resit: null` → banner *"There is no active resit in this academic intake."*; filters disabled, empty grid.

### Filters
| Control | Source | Sent as |
|---|---|---|
| **Course Unit** | [GET /applications/course-units](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-application-course-units.md). Show `unitName (unitCode)`, first option *All units*. Searchable dropdown | `courseUnitGuid` (omit for All) |
| **Fee** | Three options with counts from `summary`: *All* (`total`), *Paid* (`paid`), *Unpaid* (`unpaid`) | `feeStatus` — omit for All, `1` Paid, `0` Unpaid |
| **Search** | Free text, max 100 characters | `search` |

### Grid columns
| Column | Field | Display |
|---|---|---|
| Student No | `studentRegNo` | |
| Student Name | `studentName` | |
| Programme | `programName` | |
| Campus | `campusName` | |
| Code | `unitCode` | |
| Course Unit | `unitName` | |
| Type | `unitTypeName` | *Theory*, *Practical* or *Project* |
| CW | `cw` | Yes / No |
| UE | `ue` | Yes / No |
| Fee | `feeStatus` | Badge: *Paid* (`1`, green) / *Unpaid* (`0`, amber) |
| Email | `email` | `mailto:` link; *—* when `null` |
| Phone | `phone` | `tel:` link; *—* when `null` |

10 rows per page with a pager. A combined (theory and practical) unit can show two rows for the same student, one per part; the Type column tells them apart.

## Flow

### 1. Load the page
Call in parallel:
- [GET /resit-application/applications/course-units](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-application-course-units.md) → fill Course Unit.
- [GET /resit-application/applications?page=1&pageSize=10](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-applications.md) → header, Fee counts and grid.

### 2. Change a filter
- **Course Unit** or **Fee** change → reload the list with `page=1`, keeping the other filters.
- **Search** → reload with `search=<text>&page=1`. **Clear** → empty the box and reload page 1.
- The Fee counts always come from the latest `summary`. They follow Course Unit and Search, but not the Fee option itself, so all three counts stay visible whichever is selected.

### 3. Page
Pager → same call with the new `page`, keeping all filters.

### 4. Empty states
| Case | Message |
|---|---|
| `resit: null` | *"There is no active resit in this academic intake."* |
| `summary.total = 0`, no filter | *"No resit applications yet."* |
| `items: []` with a filter | *"No applications match the filters."* |
| `page` past the end (`items: []`, `totalCount > 0`) | Go back to the last page |

## Validation (client side, mirrors the server)
| Field | Rule | Message |
|---|---|---|
| Search | Max 100 characters | *"Search can be at most 100 characters."* |

The page never sends an invalid `page`, `pageSize`, `feeStatus` or `courseUnitGuid`; the server rules are listed on the [API page](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-applications.md#validation).

## Business rules the UI must show
- Only applications with CW or UE ticked are listed.
- Applications of inactive students are not listed.
- **Paid** means the resit fee payment has been recorded for that application; *Unpaid* covers both "not paid" and "not recorded yet".
- Type comes from the student's own programme, so the same unit can show a different type for students of different programmes.

## Error handling
| Response | UI |
|---|---|
| 400 `bad_request` — *Student details could not be loaded. Please try again.* | Toast with the message and a **Retry** button; keep the previous grid |
| 400 `validation_error` | Toast with `errors` joined |
| 401 | Redirect to login |

## APIs needed
| Step | API | API ID |
|---|---|---|
| Course Unit filter | [GET /resit-application/applications/course-units](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-application-course-units.md) | `assessment-attendance-service.assessment.resit-application.list-application-units` |
| Grid, Fee counts, header | [GET /resit-application/applications](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-applications.md) | `assessment-attendance-service.assessment.resit-application.list-applications` |

## Permissions (when enabled)
| Permission | Grants |
|---|---|
| `assessment.resitapplicationlist.get` | Open the page and call both APIs |

## Related pages
| Page | Route |
|---|---|
| [Resit Apply Page](./resit-apply-page.md) | /assessment/resit-apply |
| [Resit Scheduling Page](./resit-scheduling-page.md) | /assessment/resit-scheduling |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-28 | Vaishnav | Initial version created |
