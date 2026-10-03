# Resit Apply Page

**Route:** /assessment/resit-apply
**Module:** Assessment

## Purpose
Lets exam/academic office staff apply for a resit **on behalf of a student**, and view, edit or delete the student's existing resit applications.

A student can resit a unit they **failed** (IA or UE below 50%), and each unit can be applied for once per resit configuration. Staff work under the **current intake's active resit configuration**, and — unlike students on the portal — are **not** restricted by the configuration's Start/End dates.

## Layout
The page has two views.

**View 1 — Student list**
- Search box (placeholder: *Student Number / Registration Number / Student Name*), **Search** and **Clear** buttons.
- Grid, 10 rows per page, with pager: **Student No** (`studentRegNo`) · **Student Name** · **Program** · **Batch** · **Semester** (`semesterName`, e.g. *Year Two - Semester Two*) · **View** action.

**View 2 — Student resit form** (opened with **View**)
- Header (read-only): Student No, Student Name, Program, Batch, Semester — taken from the list row, no extra API call.
- Apply form: **Course Unit** dropdown · **IA** checkbox · **UE** checkbox · **Theory / Practical** choice (hidden by default) · **Apply** · **Cancel**.
- Applied Units grid: **Code** · **Name** · **Type** · **IA** (Yes/No) · **UE** (Yes/No) · **Status** · **Payment** (Paid/Not Paid) · **Edit** · **Delete**.
- **Back** to the student list.

## Flow

### 1. Load the student list
1. On page load → [GET /resit-application/students?page=1&pageSize=10](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-eligible-students.md). The list shows every student who currently has something to resit; no search is needed.
2. **Search** → same API with `search=<text>&page=1`. Matches an exact Student Number or Registration Number, or part of the name. **Clear** → empty the box and reload page 1.
3. Pager → same API with the new `page`; keep the current `search`.
4. `items: []` → show *"No students have pending resit units."* This covers: no resit configuration is active for the current intake, everyone has already applied, or the search matched nobody.

### 2. Open a student (View)
1. Keep the row (`studentGuid` + display fields) and switch to View 2.
2. Call in parallel:
   - [GET /students/{studentGuid}/dropdown](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-dropdown.md) → fill Course Unit with `displayName` (value `courseUnitGuid`), plus a *"-- Select --"* placeholder.
   - [GET /students/{studentGuid}/applied-units](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-applied-units.md) → fill the Applied Units grid.
3. Initial form state: nothing selected, IA/UE unticked and **disabled**, Theory/Practical hidden, Apply disabled.
4. Dropdown empty → show *"No units left to apply for."* under the dropdown and keep the form disabled. The grid can still be used for Edit/Delete.

### 3. Select a course unit
1. Placeholder selected → reset the form to the initial state (step 2.3).
2. A unit selected → [GET /students/{studentGuid}/checkbox-state?courseUnitGuid=…](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-checkbox-state.md), then apply these rules:

| Response | IA checkbox | UE checkbox | Theory/Practical |
|---|---|---|---|
| `iaPassed: true` | unticked, **disabled** | — | — |
| `iaPassed: false` | enabled | — | — |
| `uePassed: true` | — | unticked, **disabled** | — |
| `uePassed: false` | — | enabled | — |
| `hasResult: false` | enabled | enabled | — |
| `isTheoryPracticalUnit: true` | — | — | **shown**, default **Theory** (`0`) |
| `isTheoryPracticalUnit: false` | — | — | hidden, send `ueType: 0` |

3. Always reset both checkboxes to unticked and Theory/Practical to Theory when the unit changes.

### 4. Theory / Practical (only when shown)
- **Practical** (`1`) → untick and **disable IA**. A practical resit is UE only.
- **Theory** (`0`) → re-enable IA **unless** `iaPassed` is `true`.

### 5. Apply
1. **Apply** is enabled only when a unit is selected **and** at least one of IA/UE is ticked.
2. On click → [POST /students/{studentGuid}/submit](../../../api/assessment-attendance-service/assessment/resit-application/post-resit-submit.md) with `{ courseUnitGuid, cw: <IA ticked>, ue: <UE ticked>, ueType }`.
3. `200` → toast *"Resit applied successfully."*, reset the form, reload the **dropdown** (the unit disappears from it) and the **Applied Units** grid (or insert the returned row).
4. `400 validation_error` → show every message in `errors`. These should not happen if the step 3–5 UI rules are followed (e.g. *Select at least one of IA or UE.*).
5. `400 bad_request` → show `errors[0]` as-is. Possible messages:
   - *No current intake is configured.* / *No active resit configuration found.* → the resit period has been closed; disable the form.
   - *This unit is not eligible for a resit application.* → the student's results changed; reload the dropdown.
   - *Application saved but could not be retrieved.* → the save worked; reload the grid.

### 6. Edit an application
1. **Edit** on a grid row → [GET /{resitApplicationGuid}/edit](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-application-for-edit.md) and [checkbox-state](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-checkbox-state.md) for the row's `courseUnitGuid` (in parallel).
2. Put the form in **edit mode**:
   - Course Unit shows `displayName` and is **locked**. The unit is not in the dropdown because it is already applied, and changing the unit would create a new application instead of editing this one.
   - IA/UE ticked from `cw`/`ue`, then apply the step 3 rules; Theory/Practical shown when `isTheoryPracticalUnit`, set from `ueType`, then apply step 4.
   - **Apply** reads **Update**; **Cancel** leaves edit mode and resets the form.
3. **Update** → the same [submit](../../../api/assessment-attendance-service/assessment/resit-application/post-resit-submit.md) call with the locked `courseUnitGuid`. The existing application is updated (same `resitApplicationGuid`; status and payment unchanged). Handle responses as in step 5; toast *"Application updated."*
4. `404` from edit (*Resit application not found.*) → the application was deleted meanwhile; reload the grid.

### 7. Delete an application
1. **Delete** is **disabled when `feePaid` is `true`** (tooltip: *"Paid applications cannot be deleted."*).
2. Otherwise confirm (*"Delete the resit application for <Unit Name>?"*) → [POST /{resitApplicationGuid}/delete](../../../api/assessment-attendance-service/assessment/resit-application/post-resit-application-delete.md).
3. The API returns **200 in every case** — read `data.deleted`:
   - `true` → toast `message`, reload the grid **and** the dropdown (the unit becomes available again). If the form was in edit mode for this application, leave edit mode.
   - `false` → show `message` (*Cannot delete an application after fee payment.* or *Application not found.*) and reload the grid.

### 8. Back to the list
**Back** → View 1, re-fetch the current list page. A student who has now applied for every failed unit drops out of the list; a student whose application was deleted may reappear.

## Business logic notes
- **Who appears in the list:** active students with at least one unit whose **latest** published result is a fail and which is not yet applied for under the active resit configuration. Full rule on the [list API](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-eligible-students.md).
- **Fail = IA or UE below 50%** of its maximum, or the mark is missing. A student who passed IA but failed UE sees the unit with **IA disabled** — they can only resit UE, and vice versa.
- **Latest result wins:** if a unit was failed and later passed, it does not appear.
- **One application per unit per resit configuration.** Once applied, the unit leaves the dropdown; deleting the application makes it available again.
- **Status** `2` is displayed as **Pending**.
- **Payment status** (`feePaid`) is updated by the fee payment process, never by this page. Show **Paid** / **Not Paid**.
- **Paid applications:** Delete is refused. Edit is allowed by the API but can change what the student has paid for — disable Edit when `feePaid` is `true` unless the business decides otherwise.
- **Type column** shows the unit category (`Core`, `Elective`, `Specialization`, `Professional`, `Requisite`).
- **Theory/Practical** only applies to units that have separate theory and practical exams, so for most units only the IA and UE checkboxes are shown.
- **The server does not re-check the checkbox rules.** It accepts IA for a unit whose IA was passed, or IA together with Practical. The UI rules in steps 3–4 are the only guard — do not skip them.
- **No date restriction for staff:** nothing on this page is blocked by the resit configuration's Start/End dates. The page stops working only when no resit configuration is active for the current intake.
- **Theory and Practical of the same unit** cannot be two separate applications; saving the other type updates the existing application.
- **No fee amount** is shown on this page.
- Field-level validation rules live on the API pages — don't duplicate them here.

## Edge cases checklist
| Case | Expected UI |
|---|---|
| No active resit configuration / no current intake | List empty with the generic message; submit returns *No active resit configuration found.* |
| Student has failed units but all are already applied | Student not in the list; if opened from a stale list, the dropdown is empty and the grid shows the applications |
| Both IA and UE already passed for the unit (possible in edit mode after results change) | Both disabled → Update disabled; show *"Nothing left to resit for this unit."* |
| Unit with no published result | Both checkboxes enabled |
| Theory/Practical unit, Practical selected | IA unticked and disabled |
| Double-click Apply | Disable the button while the request is in flight |
| Double-click Delete | Second call returns `deleted: false`, *Application not found.* — reload the grid |
| Application deleted or paid by someone else meanwhile | Edit → 404; Delete → `deleted: false` with the reason; reload the grid |
| Search with only spaces | Treated as no search |
| Page beyond the last page | Empty `items`, real `totalCount` — go back to the last page |
| Session expired | 401 → redirect to login |

## APIs used
| Step | API | API ID | Notes |
|---|---|---|---|
| Student list / search / paging | [GET /resit-application/students](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-eligible-students.md) | `assessment-attendance-service.assessment.resit-application.list-students` | |
| Course Unit dropdown | [GET /resit-application/students/{studentGuid}/dropdown](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-dropdown.md) | `assessment-attendance-service.assessment.resit-application.list-units` | On View, after Apply, after Delete |
| IA/UE/Practical state | [GET /resit-application/students/{studentGuid}/checkbox-state](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-checkbox-state.md) | `assessment-attendance-service.assessment.resit-application.get-checkbox-state` | On unit change and on Edit |
| Applied Units grid | [GET /resit-application/students/{studentGuid}/applied-units](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-applied-units.md) | `assessment-attendance-service.assessment.resit-application.list-applied` | On View, after Apply/Update/Delete |
| Apply / Update | [POST /resit-application/students/{studentGuid}/submit](../../../api/assessment-attendance-service/assessment/resit-application/post-resit-submit.md) | `assessment-attendance-service.assessment.resit-application.submit` | Field-level validation rules live on the API page |
| Load for edit | [GET /resit-application/{resitApplicationGuid}/edit](../../../api/assessment-attendance-service/assessment/resit-application/get-resit-application-for-edit.md) | `assessment-attendance-service.assessment.resit-application.get-for-edit` | |
| Delete | [POST /resit-application/{resitApplicationGuid}/delete](../../../api/assessment-attendance-service/assessment/resit-application/post-resit-application-delete.md) | `assessment-attendance-service.assessment.resit-application.delete` | Always 200 — check `deleted` |

## Related pages
- Resit Configuration — creates and activates the resit configuration this page depends on; API: [GET /resit-configs](../../../api/assessment-attendance-service/assessment/resit-configs/get-resit-configs.md).
- Student portal Resit Application — the student-side equivalent (restricted to the resit configuration's dates, shows the fee).

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-09-25 | Vaishnav | Initial version created |
