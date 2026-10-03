# Resit IA Evaluation Page

**Route:** /assessment/resit-evaluation
**Module:** Assessment

## Purpose
Lecturers mark the **resit coursework (Course Work 1)** that students submitted online and submit each student's evaluation. A lecturer only sees the units they are planned to teach in the chosen academic session.

The page has two screens:
1. **Dashboard** — pick the academic session and resit, then pick a unit from the **Pending** or **Evaluated** tab. Each unit is a card with its progress.
2. **Evaluate** — the unit's students on the left with their progress; the selected student's questions and marks on the right.

## Screen 1 — Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Resit IA Evaluation                                                                │
│ Academic Session [ Spring 2026 (20261)       ▾ ]  Resit [ Resit SpRING 2026   ▾ ]  │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━┓                                                                   │
│  ┃ Pending (2) ┃  Evaluated (1)                          [ Search unit…       ]    │
│  ┗━━━━━━━━━━━━━┛                                                                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│ │ BBAIB2221              Course Work1  │  │ BNCS1211               Course Work1  │ │
│ │ Global Strategic Management          │  │ Data and Storage Security            │ │
│ │ BBA International Business - S22     │  │ BSc Networks and Cyber Security      │ │
│ │                                      │  │                                      │ │
│ │ ░░░░░░░░░░░░░░░░░░░░  0 of 1 done    │  │ ░░░░░░░░░░░░░░░░░░░░  0 of 1 done    │ │
│ │ 2 applied · 1 submitted · 1 pending  │  │ 3 applied · 1 submitted · 1 pending  │ │
│ │                                      │  │                                      │ │
│ │                 [ Start evaluating ] │  │                 [ Start evaluating ] │ │
│ └──────────────────────────────────────┘  └──────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Evaluated tab — same cards, full green bar and a **View** button:

```
┌──────────────────────────────────────┐
│ BNCS3235               Course Work1  │
│ Digital Transformation and Overview  │
│ BSc Networks and Cyber Security      │
│                                      │
│ ████████████████████  1 of 1 done  ✓ │
│ 1 applied · 1 submitted · 0 pending  │
│                                      │
│                             [ View ] │
└──────────────────────────────────────┘
```

### Filters
| Control | Source | Default |
|---|---|---|
| **Academic Session** | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md). Label `description (intakeCode)` | The item with `currentIntake: true` |
| **Resit** | [GET /assessment/resit-configs?academicIntakeGuid={intakeGuid}&page=1&pageSize=50](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md). Label `refCode` | The item with `isActive: true`; otherwise the first |

### Tabs
| Tab | Cards from | Badge |
|---|---|---|
| **Pending** (opens by default) | `data.pending` | `pending.length` |
| **Evaluated** | `data.evaluated` | `evaluated.length` |

**Search unit** filters the cards of the open tab on the client by unit code or name.

### Unit card
| Item | Field | Display |
|---|---|---|
| Code | `unitCode` | Bold |
| Category chip | `categoryLabel` | Small grey chip, top right |
| Name | `unitName` | |
| Programmes | `programmeNames` | Joined with `, `; one line, ellipsis, full list in a tooltip |
| Progress bar | `evaluatedCount / submittedCount` | Amber while pending, green when complete |
| Progress text | `evaluatedCount`, `submittedCount` | *"{evaluatedCount} of {submittedCount} done"* |
| Counts line | `headCount`, `submittedCount`, `pendingCount` | *"{headCount} applied · {submittedCount} submitted · {pendingCount} pending"* |
| Button | — | Pending tab: **Start evaluating** (or **Continue** when `evaluatedCount > 0`). Evaluated tab: **View** |

Cards are in a responsive grid (3 per row on wide screens, 1 on mobile), in the order returned (unit code).

## Screen 2 — Evaluate

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Back   BBAIB2221 · Global Strategic Management               1 of 3 evaluated  │
│          ██████░░░░░░░░░░░░░                                                     │
├───────────────────────────┬──────────────────────────────────────────────────────┤
│ Students  [ Search…     ] │ NAKIBUUKA HAJARAH · 012230213                        │
│ ───────────────────────── │ BBA International Business - S22                     │
│ ● NAKIBUUKA HAJARAH     ▶ │ Marked 1 of 2 · at least 1 needed    Total 18.5 / 25 │
│   012230213  1/2 marked   ├──────────────────────────────────────────────────────┤
│ ○ OKELLO JAMES            │ Questions  ( 1 ✓ )  ( 2 )                            │
│   012230541  0/2 marked   │                                                      │
│ ✓ AMONG GRACE             │ ┌──────────────────────────────────────────────────┐ │
│   012230118  18.5 / 25    │ │ Q1 · Section A · Descriptive           Max 25    │ │
│                           │ │ Define Porter's Five Forces model and explain    │ │
│                           │ │ its significance in strategic analysis           │ │
│                           │ ├──────────────────────────────────────────────────┤ │
│                           │ │ Student's answer                                 │ │
│                           │ │ Porter's model looks at five competitive forces  │ │
│                           │ │ that shape an industry…                          │ │
│                           │ │ [file] answer.pdf  [ Open ]                      │ │
│ ───────────────────────── │ ├──────────────────────────────────────────────────┤ │
│ ○ Not started             │ │ Mark  [ 18.5 ] / 25                    ✓ Saved   │ │
│ ● In progress             │ └──────────────────────────────────────────────────┘ │
│ ✓ Evaluated (read-only)   │ [ ‹ Previous ]                          [ Next › ]   │
│                           │                            [ Submit evaluation ✓ ]   │
└───────────────────────────┴──────────────────────────────────────────────────────┘
```

### Header
| Item | Source |
|---|---|
| **← Back** | Back to the dashboard (reload it) |
| Title | `unitCode · unitName` from the students response |
| Progress | *"{evaluated} of {total} evaluated"* and a bar, counted from the student list; updates after each submit |

### Student list (left)
All students of the unit who submitted, in the order returned (by name). Each row:

| Item | Field | Display |
|---|---|---|
| Icon | `evaluationStatus`, `markedCount` | **✓** evaluated · **●** in progress (`markedCount > 0`) · **○** not started |
| Name | `studentName` | Bold for the selected student, with **▶** |
| Reg no | `studentRegNo` | Small grey |
| Progress | `markedCount`, `questionCount`, `mark`, `maxMark` | Pending: *"{markedCount}/{questionCount} marked"*. Evaluated: *"{mark} / {maxMark}"* in green |

**Search** filters the list by name or reg no. Clicking a row opens that student; switching students never submits anything (marks are already saved as they are entered). A legend at the bottom explains the icons.

### Student panel (right)
| Item | Source | Display |
|---|---|---|
| Name · reg no, programme | Selected student row | |
| **Marked** | `markedCount`, `questions.length`, `minQuestion` | *"Marked {markedCount} of {n} · at least {minQuestion} needed"*; green when the minimum is reached |
| **Total** | Computed from the loaded marks | Best N marks per section, same rule as submit: *"Total {x} / {max}"*. For an evaluated student, `mark / maxMark` from the list |
| **Question chips** | `questions[]` | One chip per `questionNumber`; **✓** when `mark` is not `null`; the current one highlighted. Click to jump |

### Question card
| Item | Field | Display |
|---|---|---|
| Heading | `questionNumber`, `section`, `questionType`, `maxMark` | *"Q1 · Section A · Descriptive"*, *"Max 25"* on the right |
| Question | `questionText` | Render as HTML. `null` → *"Question not available."* in grey italics |
| Student's answer | `answerText` | Read-only text; *"No typed answer."* when empty |
| Attachment | `answerFileName`, `answerFileUrl` | File name with an **Open** button (new tab). Hidden when `null` |
| Mark | `mark`, `maxMark` | Number input `/ maxMark`. Read-only for MCQ (`isMcq`, hint *"Marked automatically"*) and for evaluated students |
| Save status | — | *"Saving…"*, *"✓ Saved"*, or the error in red |

### Buttons
| Button | Enabled | Action |
|---|---|---|
| **‹ Previous** / **Next ›** | Not on the first / last question | Move between questions (the mark is saved on leaving the box) |
| **Submit evaluation ✓** | `markedCount >= minQuestion`, the student is not evaluated, and no save is in progress | Submit the student. When disabled, tooltip *"Mark at least {minQuestion} question(s) first."* |

For an evaluated student the whole panel is read-only and shows a green banner *"Evaluated on {evaluatedDate} — {mark} / {maxMark}"* instead of the Submit button.

### Unit complete
When no pending student is left, the right panel shows:

```
┌──────────────────────────────────────────────────────┐
│                          ✓                           │
│            All 3 students are evaluated              │
│                                                      │
│                [ Back to dashboard ]                 │
└──────────────────────────────────────────────────────┘
```

## Flow

### 1. Open the page
1. [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) → fill Academic Session; select the current intake.
2. [GET /assessment/resit-configs?academicIntakeGuid=…&page=1&pageSize=50](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) → fill Resit; select the active one.
3. [GET /resit-evaluations/units?intakeGuid=…&resitConfigGuid=…](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-units.md) → cards and tab badges. Open the **Pending** tab.

### 2. Change a filter
- **Academic Session** → reload Resit for the new intake, select its active resit (or the first), then reload the cards.
- **Resit** → reload the cards.
- No resit for the intake → empty tabs with *"No resit found for this academic session."*

### 3. Open a unit
1. **Start evaluating**, **Continue** or **View** on a card.
2. [GET /resit-evaluations/units/{courseUnitGuid}/students?intakeGuid=…&resitConfigGuid=…](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-students.md) — **without `status`**, so evaluated students are listed too. Keep `minQuestion`.
3. Select the first student that is not evaluated (from **View**: the first student).

### 4. Open a student
1. [GET /resit-evaluations/applications/{resitApplicationGuid}/questions](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-questions.md).
2. Show the first question without a mark (or question 1), the chips, *Marked* and *Total*.

### 5. Mark
- When the Mark box loses focus, or the lecturer changes question or student, and the value changed:
  [PUT /resit-evaluations/applications/{resitApplicationGuid}/answers/{answerGuid}/mark](../../../api/assessment-attendance-service/assessment/resit-evaluations/put-resit-evaluation-mark.md) with `{ "mark": <value> }`, or `{ "mark": null }` when the box was cleared.
- On success: *"✓ Saved"*; update the chip, *Marked*, *Total*, and the student's *"x/y marked"* in the list. No reload.
- On error: show the message under the Mark box and keep the value; don't move away until it is fixed or cleared.
- Check the mark on the client first (not negative, at most 2 decimals, not above `maxMark`) to avoid a round trip.

### 6. Submit a student
1. Wait for any save in progress.
2. [POST /resit-evaluations/applications/{resitApplicationGuid}/submit](../../../api/assessment-attendance-service/assessment/resit-evaluations/post-resit-evaluation-submit.md).
3. Success:
   - Toast *"Evaluation submitted — {totalMark} / {totalMaxMark}."*
   - Show the student as **✓** with the total in the list; update the header progress.
   - `remainingPendingCount > 0` → open the next student that is not evaluated.
   - `remainingPendingCount = 0` → **Unit complete** panel.
4. 400 *Minimum questions are not evaluated…* → show the message under the *Marked* line (the disabled button should already prevent this).
5. 409 *already evaluated* → toast, reload the students list, open the next pending student.

### 7. Back
**← Back** or **Back to dashboard** → Screen 1 and reload the cards (a finished unit moves to the **Evaluated** tab).

## Business logic notes
- Only units the lecturer is **planned to teach** in the academic session appear, and only their students can be opened. A unit with no planned lecturer is not evaluated through this page.
- Only students who **submitted** their resit coursework are listed.
- **Minimum questions** = the attempt counts of sections A + B + C in the resit coursework rule. A mark of **0 counts** as marked; an empty mark does not.
- **Total** = the best N marks in each section (N = attempt count), so a student who answers more questions than needed gets the best ones counted. **Max** = section mark × N, summed.
- Marks: `0` to the question's maximum, up to 2 decimal places. MCQ answers are marked automatically and are read-only.
- Once a student is submitted the marks are **locked** — save mark and submit both return 409.
- A question that is no longer in the question bank still shows the answer and can be marked against the section maximum.
- Saves and submits are recorded in the activity log.

## Validation
The page never sends missing guids. Mark rules are on the [save mark API page](../../../api/assessment-attendance-service/assessment/resit-evaluations/put-resit-evaluation-mark.md#validation); check them on the client before calling.

## Error handling
| Response | UI |
|---|---|
| 400 `validation_error` or `bad_request` on save mark | Red message under the Mark box; keep the value |
| 400 `bad_request` on submit (minimum questions) | Message under the *Marked* line |
| 400 `bad_request` — *Student details could not be loaded. Please try again.* | Toast with **Retry** |
| 404 `not_found` | Toast with the message; back to the dashboard and reload |
| 409 `conflict` | Toast with the message; reload the students list |
| 401 | Redirect to login |

## Empty states
| Case | Message |
|---|---|
| Pending tab empty, Evaluated has cards | *"All caught up — nothing pending for evaluation."* |
| Both tabs empty | *"You have no resit units to evaluate in this session."* |
| Search matches no card | *"No units match your search."* |
| Students list empty | *"No submissions for this unit."* and a **Back** button |

## APIs used
| Step | API | API ID |
|---|---|---|
| Academic Session dropdown | [GET /academic/intakes/dropdown](../../../api/academic-service/academic/intakes/get-intakes-dropdown.md) | `academic-service.academic.intakes.dropdown` |
| Resit dropdown | [GET /assessment/resit-configs](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md) | `assessment-attendance-service.assessment.resit-configs.list` |
| Unit cards and tab badges | [GET /resit-evaluations/units](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-units.md) | `assessment-attendance-service.assessment.resit-evaluations.list-units` |
| Student list with progress | [GET /resit-evaluations/units/{courseUnitGuid}/students](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-students.md) | `assessment-attendance-service.assessment.resit-evaluations.list-students` |
| Questions of a student | [GET /resit-evaluations/applications/{resitApplicationGuid}/questions](../../../api/assessment-attendance-service/assessment/resit-evaluations/get-resit-evaluation-questions.md) | `assessment-attendance-service.assessment.resit-evaluations.list-questions` |
| Save a mark | [PUT /resit-evaluations/applications/{resitApplicationGuid}/answers/{answerGuid}/mark](../../../api/assessment-attendance-service/assessment/resit-evaluations/put-resit-evaluation-mark.md) | `assessment-attendance-service.assessment.resit-evaluations.save-mark` |
| Submit a student | [POST /resit-evaluations/applications/{resitApplicationGuid}/submit](../../../api/assessment-attendance-service/assessment/resit-evaluations/post-resit-evaluation-submit.md) | `assessment-attendance-service.assessment.resit-evaluations.submit` |

## Permissions (when enabled)
| Permission | Grants |
|---|---|
| `assessment.resitevaluation.get` | Open the page; cards, students and questions |
| `assessment.resitevaluation.save` | Save marks and submit students |

## Related pages
| Page | Route |
|---|---|
| [Resit Apply Page](./resit-apply-page.md) | /assessment/resit-apply |
| [Resit Applications List Page](./resit-applications-list-page.md) | /assessment/resit-applications |
| [Resit Scheduling Page](./resit-scheduling-page.md) | /assessment/resit-scheduling |

## Changelog
| Date | Changed by | Change |
|---|---|---|
| 2026-09-29 | Vaishnav | Initial version created |
