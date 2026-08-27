# Student Module — API Integration Status

For the backend team. Generated 2026-08-25 by cross-referencing the actual frontend
code (`src/app/student/*`, `src/lib/api/student/*`, `src/hooks/student/*`) against
every endpoint documented in this repo's `students/` folder, then verified live
against the dev backend (`erp-dev-alb-...`) via a scripted Playwright pass logged
in as a real staff account. Anywhere this doc says "confirmed live," that means an
actual request/response was captured, not just read from the docs.

---

## 1. Integrated — 12 of 38 documented endpoints

| Endpoint | API ID | Page(s) | Notes |
|---|---|---|---|
| `GET /api/v1/students` | `students.students.list` | Student Master, Student Statement, and every "Operations" page via the shared student-lookup search bar (Profile, Batch Transfer, Programme Transfer, Learning Mode, Intake Transfer) | Confirmed live, 200 |
| `GET /api/v1/students/{guid}` | `students.students.get` | Student Profile (identity fields; the Discount display also reads off this response's `discountStatus`/`calcType`/`amtPer` fields rather than calling a separate endpoint) | Confirmed live, 200 |
| `GET /api/v1/students/id-cards/{guid}` | `id-cards.details` | Profile → ID Card tab | **Response shape did not match the docs** — see §3 |
| `POST /api/v1/students/id-cards` | `id-cards.issue-or-renew` | Profile → ID Card tab (issue/renew) | Confirmed live, 200/201 |
| `PUT /api/v1/students/id-cards/{cardIssueId}` | `id-cards.update-dates` | Profile → ID Card tab (edit dates) | Confirmed live, 200. Note: the path param is `cardIssueId` on the real wire (see §3), not `cardIssueGuid` as the docs name it |
| `GET /api/v1/students/id-cards/{guid}/qr-image` | `id-cards.qr-image` | Profile → ID Card tab (QR box) | Confirmed live, 200, valid PNG |
| `GET /api/v1/students/sponsor-assignment/{guid}/sponsor-details` | `sponsor-assignment.details` | Profile → Sponsor field | **Confirmed live 401** on every real student tried — see §3 |
| `POST /api/v1/students/sponsor-assignment/{guid}/sponsor-assignment` | `sponsor-assignment.assign` | Profile → Sponsor field (inline edit) | Not yet exercised against a student where the 401 above doesn't apply |
| `GET /api/v1/students/sponsor-categories` | `sponsor-categories.list` | Category Masters → Student Category Master; feeds Profile's sponsor-category dropdown | Confirmed live, 200. **`mandatoryFeeCheck` returns as the string `"Yes"`/`"No"`** — see §3 |
| `POST /api/v1/students/sponsor-categories` | `sponsor-categories.create` | Category Masters → Add | Confirmed live, 201 |
| `PUT /api/v1/students/sponsor-categories/{guid}` | `sponsor-categories.update` | Category Masters → Edit | Confirmed live, 200 |
| `DELETE /api/v1/students/sponsor-categories/{guid}` | `sponsor-categories.delete` | Category Masters → Delete | Confirmed live, 200 |

---

## 2. Pending — 26 of 38 endpoints

Grouped by why, not by folder — the reason varies a lot per group.

### No frontend consumer exists for the concept at all
| Endpoint | Why it's not connected |
|---|---|
| `POST /students/register` | Docs themselves say prefer the registrar-desk endpoint instead; this one's flagged internal/back-fill only |
| `GET /students/applications/{guid}/documents` | No Student-module page has a reason to show application documents |
| `GET /students/application-guids-by-term` | No Student-module page needs this lookup |
| `POST /students/maintenance/backfill-batch-guids` | Docs explicitly say don't wire this into the UI |

### Endpoint exists, but the page around it is still fully mock
| Endpoint | Why it's not connected |
|---|---|
| `POST /students/counts-by-batch` | Batch Summary page has no other real endpoint backing it yet — wiring just this one wouldn't make the page real |

### Redundant given what's already wired
| Endpoint | Why it's not connected |
|---|---|
| `GET /students/id-cards/search` | Profile's ID Card tab gets its student from the page's own lookup, not this one |
| `GET /students/sponsor-categories/{guid}` | The list endpoint already covers both consumers (Masters, Profile's dropdown) |

### Needs a UI that doesn't exist yet, but reasonably could (small–medium lift)
| Endpoint | What integrating it would need |
|---|---|
| `POST /students/search/search` (14-filter search) | A new "Advanced Search" panel — Student Master only exposes the simple search box today |
| `GET /students/id-cards/qr/{guid}` (scan-result) | A scan/verify screen (paste or camera-scan a GUID) — no such screen exists |
| `GET /students/refugee/eligible`, `GET /students/refugee`, `GET /students/refugee/{guid}`, `POST /students/refugee/{guid}`, `DELETE /students/refugee/{guid}` (5) | A 4th Profile tab, mirroring the already-built ID Card tab's pattern (eligible-list awareness, assign with document upload, view, remove) |
| `GET /students/{guid}/discount`, `POST /students/{guid}/discount`, `PUT /students/{guid}/discount`, `POST /students/{guid}/discount/cancel`, `GET /students/discounts/{guid}/active-assignment-count` (5) | Profile already displays discount info read-only (piggybacking on `GET /students/{guid}`) — extending it to assign/edit/cancel is the smallest remaining lift, same inline-edit pattern already proven for Sponsor |

### Brand new resources — no frontend footprint at all yet
| Endpoint | Notes |
|---|---|
| `GET /students/dropout-rejoin` (list) | |
| `GET /students/dropout-rejoin/{guid}/candidate` | |
| `POST /students/dropout-rejoin/{guid}/rejoin` | |
| `GET /students/resume/{guid}/candidate` | |
| `POST /students/resume/{guid}/resume` | |

Worth flagging: unlike every other doc in this folder (all of which say *"no page docs reference this yet"*), these five already list **expected frontend routes** — `/students/dropout-rejoin`, `/students/dropout-rejoin/{studentGuid}`, `/students/resume/{studentGuid}`. None of those routes exist in the frontend yet. Read as: the backend is ready and expecting these pages to be built, not documenting something already live. Building these means two new pages plus new sidebar entries, with real conditional logic worth implementing carefully — `canRejoin` eligibility filtering, rejoin's semester restricted to current/current+1 vs. resume's unrestricted semester choice, and resume's fee-clearance gate that can reject the whole action server-side.

---

## 3. Discrepancies found during live testing — for backend awareness

These came out of a scripted Playwright pass against the real dev backend, not just doc review. Flagging in case any are unintended.

### `GET /students/id-cards/{guid}` response shape doesn't match its own docs
The docs describe "the card currently issued... and the issue history." The real response has no `current`/`history` split at all — it's a single object with a `cardHistory[]` array (each entry keyed `cardIssueId`, not `cardIssueGuid` as the docs' prose says), plus a large set of student/programme/campus/company context fields the docs don't mention. Frontend has been updated to match the real shape; flagging in case the docs should be corrected instead, or in case `cardIssueId` vs `cardIssueGuid` is an unintended inconsistency with the `PUT` endpoint's own path-param naming.

### `GET /students/sponsor-categories` returns `mandatoryFeeCheck` as a string, not the documented byte
Docs describe it as a "nullable byte flag." Live response returns the string `"Yes"`/`"No"`. The `POST`/`PUT` create/update endpoints still accept it as a `0`/`1` number per the docs' request examples, and that continues to work — so the read and write shapes for this one field are asymmetric. Frontend now normalizes this defensively, but worth knowing the two directions don't match.

### `GET /students/sponsor-assignment/{guid}/sponsor-details` returns a real 401, contradicting its own docs
The docs say "no fine-grained permission beyond being an authenticated user," but the endpoint returned a live `401` on every real student tested, with the message *"You are not authorized to view sponsor details for students in this campus."* This reads as an intentional campus-scoped authorization check that exists on the backend but isn't documented. Frontend now surfaces this as "Restricted" (distinct from "no assignment," which is a `404`) rather than silently misreading it as unassigned — but worth confirming with whoever owns this endpoint whether that 401 is intended for every account, or specific to test accounts used so far.

### Route moves already handled, noted for completeness
Two endpoints moved paths on 2026-08-24 (both already updated on the frontend, no longer an issue):
- `studentsponsorassignment/...` → `students/sponsor-assignment/...`
- `studentsearch/search` → `students/search/search`

---

## 4. Summary

**12 endpoints integrated**, all confirmed working live except the sponsor-details 401 above. **26 pending**, split roughly: 4 with no clear frontend need yet, 1 blocked on a mock page getting rebuilt, 2 redundant, 10 needing new-but-buildable UI (smallest: Discount management on Profile), and 5 brand-new (Dropout Rejoin + Student Resuming) that the backend's own docs suggest are the next expected build.
