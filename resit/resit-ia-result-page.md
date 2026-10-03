# Resit IA Result Page

**Route:** /assessment/resit-ia-results
**Module:** Assessment

## Purpose
Read-only report of the **resit IA marks** that lecturers have submitted. The exam office picks an academic session and an assessment type (Class Test or Course Work) and sees every evaluated student with the course unit and the mark out of its maximum, optionally narrowed to one resit or one campus.

Nothing is edited here — marks are entered on the [Resit IA Evaluation Page](./resit-ia-evaluation-page.md) and copied into exam results on the [Resit Mark Update Page](./resit-mark-update-page.md).

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Resit IA Result                                                                          │
│ Academic Session [ Spring 2026 (20261)   ▾ ]  Resit [ All resits          ▾ ]            │
│ Campus [ All campuses                    ▾ ]                                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━┓                                                                        │
│  ┃  Class Test  ┃   Course Work                        [ Search student, programme, unit ] │
│  ┗━━━━━━━━━━━━━━┛                                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  #   Student                     Programme      Course unit                     Mark     │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  1   NAKIBUUKA HAJARAH           BBAIBS22       Global Strategic Management    2 / 25    │
│      012230213                                                                ▰▱▱▱▱▱ 8%  │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  2   ALFRED EKANYA               BSc.NCSF22     Computer Organization and…    10 / 25    │
│      012221590                                                              ▰▰▰▱▱▱ 40%  │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  3   BAGUMA STEPHEN              BSc.NCSF22     Intellectual Property Rights  25 / 25    │
│      011240168                                                             ▰▰▰▰▰▰ 100%  │
│                                                                                          │
│                                                          Showing 1–10 of 20   ‹ 1 2 ›    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Filters
| Control | Source | Default |
|---|---|---|
| **Academic Session** (required) | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md). Label `description (intakeCode)` | `currentIntake: true` |
| **Resit** | [GET /assessment/resit-configs?academicIntakeGuid={intakeGuid}&page=1&pageSize=50](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md). Label `refCode`, plus a first option *All resits* | *All resits* |
| **Campus** | [GET /academic/campus/dropdown](../../../api/academic-service/academic/campus/get-campus-dropdown.md). Label `campusName`, plus a first option *All campuses* | *All campuses* |
| **Search** | Free text, max 100 characters, debounced | Empty |

### Assessment type tabs
| Tab | `category` sent |
|---|---|
| **Class Test** (default) | `1` |
| **Course Work** | `2` |

### Columns
| Column | Fields | Display |
|---|---|---|
| **#** | — | Row number across pages: `(pageNumber - 1) × pageSize + index + 1` |
| **Student** | `studentName`, `studentNum` | Name bold; number small grey below |
| **Programme** | `programCode` | As is; *—* when `null` |
| **Course unit** | `unitName` | Truncate with a tooltip for long names |
| **Mark** | `mark`, `maxMark` | *"{mark} / {maxMark}"*, right aligned, up to 2 decimals. Below it a small bar and percentage `mark / maxMark × 100`, rounded — red under 40%, amber 40–59%, green 60% and above |

## Flow

### 1. Open the page
1. [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) → Academic Session, select the current intake.
2. In parallel: [GET /assessment/resit-configs?academicIntakeGuid=…](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) → Resit, and [GET /academic/campus/dropdown](../../../api/academic-service/academic/campus/get-campus-dropdown.md) → Campus.
3. [GET /resit-ia-results?intakeGuid=…&category=1&page=1&pageSize=10](../../../api/assessment-attendance-service/assessment/resit-ia-results/get-resit-ia-results.md) → the table.

### 2. Change a filter or tab
- **Academic Session** → reload Resit (reset to *All resits*), then reload the list.
- **Resit**, **Campus**, **tab** or **Search** → reload the list with `page=1`. Omit `resitConfigGuid` / `campusGuid` for the *All* options.
- Pager → same call with the new `page`.

## Business logic notes
- Only **submitted** evaluations are listed; marks a lecturer saved but did not submit are not shown.
- The academic session is the session the student applied for the resit in.
- The campus and programme are the student's current ones.
- Students who are no longer active are not listed.
- The page is read only; there is no export.

## Validation
Only the search length is checked on the client (max 100 characters); all rules are on the [list API page](../../../api/assessment-attendance-service/assessment/resit-ia-results/get-resit-ia-results.md#validation).

## Error handling
| Response | UI |
|---|---|
| 400 `bad_request` — *Student details could not be loaded. Please try again.* | Toast with **Retry**; keep the previous rows |
| 404 — *Resit not found for the selected academic session.* | Toast; reload the Resit dropdown and select *All resits* |
| 401 | Redirect to login |

## Empty states
| Case | Message |
|---|---|
| No results for the filters | *"No resit {class test / course work} marks submitted for this session yet."* |
| Search matches nothing | *"No students, programmes or units match your search."* |

## APIs used
| Step | API | API ID |
|---|---|---|
| Academic Session dropdown | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) | `academic-service.academic.intakes.dropdown` |
| Resit dropdown | [GET /assessment/resit-configs](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) | `assessment-attendance-service.assessment.resit-configs.list` |
| Campus dropdown | [GET /academic/campus/dropdown](../../../api/academic-service/academic/campus/get-campus-dropdown.md) | `academic-service.academic.campus.dropdown` |
| Result list | [GET /resit-ia-results](../../../api/assessment-attendance-service/assessment/resit-ia-results/get-resit-ia-results.md) | `assessment-attendance-service.assessment.resit-ia-results.list` |

## Permissions (when enabled)
| Permission | Grants |
|---|---|
| `assessment.resitiaresult.get` | Open the page and view the list |

## Related pages
| Page | Route |
|---|---|
| [Resit IA Evaluation Page](./resit-ia-evaluation-page.md) | /assessment/resit-evaluation |
| [Resit Mark Update Page](./resit-mark-update-page.md) | /assessment/resit-mark-update |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-30 | Vaishnav | Initial version created |
