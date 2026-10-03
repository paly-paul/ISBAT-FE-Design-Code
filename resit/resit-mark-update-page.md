# Resit Mark Update Page

**Route:** /assessment/resit-mark-update
**Module:** Assessment

## Purpose
The exam office copies **resit marks** into the students' **exam results**. After a resit coursework is evaluated or a resit university exam is marked, the new mark is pushed into the exam result — but only if it is **higher** than the student's current mark, so the student always keeps the best result.

Each row is one student and course unit, with two parts: **IA** (coursework) and **UE** (university exam). Each part is pushed as soon as its own resit mark exists; the other part can follow later.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Resit Mark Update                                                                        │
│ Academic Session [ Spring 2026 (20261)          ▾ ]   Resit [ Resit SpRING 2026      ▾ ] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━┓                                                                         │
│  ┃  Ready (2)  ┃   Pending (1,535)   Pushed (0)           [ Search student or unit…    ] │
│  ┗━━━━━━━━━━━━━┛                                                                         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Student                  Course unit                   IA            UE                 │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  BAGUMA STEPHEN           BNCS3234 · Theory             0 → 30 / 30   0 · waiting        │
│  011240168                Intellectual Property Rights  [ Ready ]     [ Pending ]        │
│  BSc Networks & Cyber…                                                        [ Push ]   │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  BAGUMA STEPHEN           BNCS3235 · Theory             0 → 30 / 30   0 · waiting        │
│  011240168                Digital Transformation…       [ Ready ]     [ Pending ]        │
│  BSc Networks & Cyber…                                                        [ Push ]   │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│  KATO JOSEPH              BIT2116 · Combined            —             35 → 13.30 / 70    │
│  012220626                Data Communication…           Not applied   [ Ready ] lower    │
│  ⚠ No exam result to update.                                             [ Push ] (off)  │
│                                                                                          │
│                                                         Showing 1–10 of 41   ‹ 1 2 3 5 › │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Filters
| Control | Source | Default |
|---|---|---|
| **Academic Session** | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md). Label `description (intakeCode)` | `currentIntake: true` |
| **Resit** | [GET /assessment/resit-configs?academicIntakeGuid={intakeGuid}&page=1&pageSize=50](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md). Label `refCode` | `isActive: true`, otherwise the first |
| **Search** | Free text, max 100 characters, debounced | Empty |

### Tabs
| Tab | `status` sent | Badge | Meaning |
|---|---|---|---|
| **Ready** (default) | `0` | `summary.ready` | At least one part has a resit mark that can be pushed |
| **Pending** | `1` | `summary.pending` | Waiting for a resit mark (coursework not evaluated or exam not marked yet) |
| **Pushed** | `2` | `summary.pushed` | Every applied part is pushed |

Badges come from `summary`, so all three stay visible whichever tab is open.

### Columns
| Column | Fields | Display |
|---|---|---|
| **Student** | `studentName`, `studentNum`, `programmeName` | Name bold; number and programme small grey on the lines below |
| **Course unit** | `unitCode`, `unitTypeName`, `unitName` | *"BNCS3234 · Theory"*, name below |
| **IA** | `ia` | Mark cell + status chip (see below) |
| **UE** | `ue` | Mark cell + status chip |
| Action | `status`, `warning` | **Push** button on the Ready tab |

### Mark cell and status chip
| `status` | Mark cell | Chip |
|---|---|---|
| `0` Not applied | *—* | grey *Not applied* |
| `1` Pending | `currentMark` · *waiting* | amber *Pending* |
| `2` Ready | `currentMark → newMark / maxMark` | blue *Ready*; add a small *lower* hint when `newMark <= currentMark` (the push will keep the current mark) |
| `3` Updated | `currentMark / maxMark` | green *Updated* |
| `4` Not updated | `currentMark / maxMark` | grey *Not updated – lower mark* |

Marks show up to 2 decimals (`30`, `13.30`).

### Row with a warning
When `warning` is set, show it under the student with a ⚠ icon in amber and disable **Push** (tooltip: the warning text).

### Push confirmation

```
┌──────────────────────────────────────────────────────────────┐
│ Push resit marks                                         [✕] │
│                                                              │
│ BAGUMA STEPHEN · 011240168                                   │
│ BNCS3234 · Intellectual Property Rights                      │
│                                                              │
│   IA   0  →  30 / 30     will be updated                     │
│   UE   waiting for the resit exam mark — stays pending       │
│                                                              │
│ The exam result is only changed when the resit mark is       │
│ higher.                                                      │
│                                   [ Cancel ]  [ Push marks ] │
└──────────────────────────────────────────────────────────────┘
```

One line per applied part, from the row:
| Part state | Line |
|---|---|
| Ready, `newMark > currentMark` | *"{current} → {new} / {max} — will be updated"* (green) |
| Ready, `newMark <= currentMark` | *"{new} is not higher than {current} — current mark is kept"* (grey) |
| Pending | *"waiting for the resit {coursework evaluation / exam mark} — stays pending"* (amber) |
| Not applied | hidden |

## Flow

### 1. Open the page
1. [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) → Academic Session, select the current intake.
2. [GET /assessment/resit-configs?academicIntakeGuid=…&page=1&pageSize=50](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) → Resit, select the active one.
3. [GET /resit-mark-updates?intakeGuid=…&resitConfigGuid=…&status=0&page=1&pageSize=10](../../../api/assessment-attendance-service/assessment/resit-mark-updates/get-resit-mark-updates.md) → **Ready** tab and the badges.

### 2. Change a filter or tab
- **Academic Session** → reload Resit (select its active one), then reload the list.
- **Resit**, **tab** or **Search** → reload the list with `page=1`.
- Pager → same call with the new `page`.
- No resit for the intake → *"No resit found for this academic session."*

### 3. Push a row
1. **Push** → the confirmation above.
2. **Push marks** → [POST /resit-mark-updates/{resitApplicationGuid}/push](../../../api/assessment-attendance-service/assessment/resit-mark-updates/post-resit-mark-update-push.md).
3. Success — toast from the response, e.g. *"IA updated to 30. UE is still pending."* or *"IA not updated — the resit mark was not higher."*, then reload the current tab and badges (the row leaves **Ready**; it moves to **Pushed**, or to **Pending** if a part is still waiting).
4. 400 → toast with the message; reload the list (e.g. the exam result was removed).
5. 409 → toast with the message; reload the list.

## Business logic notes
- Only CW- or UE-applied, not deleted resit applications of the selected resit are listed; applications of inactive students are hidden.
- **New IA** = resit coursework `mark / max` × the exam result's IA maximum. **New UE** = resit exam total % × the UE maximum; a combined unit adds its theory and practical halves (each out of half the maximum, a half the student did not resit counts as 0). Project units: IA = review × 2, UE = record + viva + methodology + analysis.
- A part is pushed only when its resit mark exists; otherwise it stays **Pending** (never recorded as low).
- The exam result is only changed when the new mark is **higher**; an equal or lower mark is recorded as **Not updated** and the current mark is kept.
- A row without an exam result, or without the needed maximum, cannot be pushed and shows a warning.
- Pushing changes the student's IA/UE totals immediately, which feeds pass percentage, resit eligibility and unit results elsewhere.
- Every push is recorded in the activity log with the old and new marks.

## Validation
Only the search length is checked on the client (max 100 characters); all rules are on the [list API page](../../../api/assessment-attendance-service/assessment/resit-mark-updates/get-resit-mark-updates.md#validation).

## Error handling
| Response | UI |
|---|---|
| 400 `bad_request` — *Student details could not be loaded. Please try again.* | Toast with **Retry**; keep the previous rows |
| 400 on push | Toast with the message; reload the list |
| 404 on push | Toast *"This application no longer exists."*; reload the list |
| 409 on push | Toast with the message; reload the list |
| 404 on list | *"Resit not found for the selected academic session."*; reload the Resit dropdown |
| 401 | Redirect to login |

## Empty states
| Case | Message |
|---|---|
| Ready tab empty | *"Nothing to push — no new resit marks yet."* |
| Pending tab empty | *"No students waiting for resit marks."* |
| Pushed tab empty | *"No marks pushed yet for this resit."* |
| Search matches nothing | *"No students or units match your search."* |

## APIs used
| Step | API | API ID |
|---|---|---|
| Academic Session dropdown | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) | `academic-service.academic.intakes.dropdown` |
| Resit dropdown | [GET /assessment/resit-configs](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) | `assessment-attendance-service.assessment.resit-configs.list` |
| List, tabs and badges | [GET /resit-mark-updates](../../../api/assessment-attendance-service/assessment/resit-mark-updates/get-resit-mark-updates.md) | `assessment-attendance-service.assessment.resit-mark-updates.list` |
| Push a row | [POST /resit-mark-updates/{resitApplicationGuid}/push](../../../api/assessment-attendance-service/assessment/resit-mark-updates/post-resit-mark-update-push.md) | `assessment-attendance-service.assessment.resit-mark-updates.push` |

## Permissions (when enabled)
| Permission | Grants |
|---|---|
| `assessment.resitmarkupdate.get` | Open the page and view the list |
| `assessment.resitmarkupdate.push` | Push marks |

## Related pages
| Page | Route |
|---|---|
| [Resit IA Evaluation Page](./resit-ia-evaluation-page.md) | /assessment/resit-evaluation |
| [Resit Applications List Page](./resit-applications-list-page.md) | /assessment/resit-applications |
| [Resit Scheduling Page](./resit-scheduling-page.md) | /assessment/resit-scheduling |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-29 | Vaishnav | Initial version created |
