# Menu Routes, Icons & Page Events — for Backend (Menu API)

Reference for the permission-driven sidebar menu API, `GET /api/v1/users/me/menu`.
Each node has the shape `{ name, icon, url, permissions, children }`.

**Last updated: 2026-11-27.** The tree below matches the frontend's mock menu
(`mockMenu` in `src/lib/api/users/menu.ts`), which follows the v7 menu hierarchy
(`ERP_Menu_Hierarchy_Verified_v7.md`): module order, section names and page order are
the menu API's, including the **General** section that holds each module's dashboard,
and the two central modules **Analytics** (every report) and **Configuration** (every
master). It lists every page that is in the sidebar today. The events on each page
come from reading the buttons and actions in that page's code.

**The frontend no longer adds pages to the menu (since 2026-10-28).** In real mode the
sidebar shows exactly what `/me/menu` returns. A page that isn't in the response is
hidden from the sidebar, and opening its URL shows the Access Denied screen. Every page
in this doc must be registered in the menu API for a role to reach it. The frontend
still removes and renames a few entries itself (see
[Pages hidden from the sidebar](#pages-hidden-from-the-sidebar) and the change notes).
The last two pages it used to add itself (ODeL Application and Exam Schedule Report)
are no longer added (2026-11-20), so nothing is added client-side any more.

## Node shapes

- **Module / section** (has children): `icon` is the module's rail icon for modules
  and `null` for sections. `url` and `permissions` are `null`.
- **Page** (leaf, `children: []`): `icon`, `url` and a `permissions` bag.
  A page with `url: null` is a visible nav entry with no page behind it yet, and its
  bag is `{}`.

## Icon format

Icon library: **[LineIcons 4.0](https://lineicons.com/icons)**, loaded from a CDN in
`src/app/layout.tsx`. The `icon` value is the **full class string**
(`lni lni-calendar`). Copy it as-is.

## `url` format

Full path from the app root (`/config/faculty-master`). The frontend also accepts a
bare slug (`payment-console`), which it resolves against the module name
(`/finance/payment-console`). Every page in this doc now uses a full path. Full paths
are preferred.

Send each page's URL **as listed here**, even for a page that sits under a different
module than its URL (for example Discount Report under Analytics keeps
`/finance/reports/discount`). The frontend shows those pages at an address under their
menu module itself; see
[Pages shown under their menu module's address](#pages-shown-under-their-menu-modules-address).

## `permissions` — page events

Every key is lowercase and `true` when the user may do that event. Leave a key out (or
send `false`) to deny it. `get` means the user can open the page and see its list and
details. Every page with a URL has `get`.

| Key | Event |
|---|---|
| `get` | Open the page and view its list and details |
| `add` | Create a new record |
| `edit` | Change an existing record |
| `delete` | Delete or remove a record |
| `approve` | Approve or confirm a request |
| `reject` | Reject a request |
| `hold` | Put a request on hold |
| `cancel` | Cancel something already in effect (a discount, an exam attempt) |
| `assign` | Assign something to a person (counsellor, permissions, specialization) |
| `verify` | Verify (an email, an exam) |
| `submit` | Submit work forward for review or approval |
| `send` | Send a message or credentials |
| `execute` | Run a one-way operation (transfer, session movement, termination) |
| `register` | Register an applicant as a student |
| `import` | Upload or import data from a file |
| `export` | Export or download a report or list |
| `print` | Print a document |
| `download` | Download a template or document |
| `generate` | Generate a document or result |
| `publish` | Publish or push results and marks |
| `withdraw` | Withdraw published results from students |

Student Master also uses its own per-row flags: `view`, `learningmode`, `refugee` and
`sponsor`. The page already reads these keys, so they keep their existing names. Note
the frontend reads **`learningmode` in lowercase**; a camelCase `learningMode` key is
ignored and the button falls back to `edit`.

### How the frontend reads the bag

- **Aliases.** `add` and `create` are the same permission, as are `edit` and
  `update`, and `get` and `view`. Sending either key of a pair grants both.
- **`approve` falls back to `edit`.** If the bag has no `approve` key at all, the
  frontend uses the `edit` value for it. To deny approving to a role that can edit,
  send `"approve": false` explicitly.
- **Some buttons stay visible.** On a few pages (Payment Console, Payment History,
  Student Statement, and the Discount, Transaction, Outstanding,
  Enquiry, Application Status, Students in Programme and Exam Schedule reports) the print/export button is always shown, and
  clicking it without the permission shows a "You don't have permission…" message
  instead of running it.
- **Menu call fails:** nothing is granted. The sidebar shows "Couldn't load menu" and
  every page shows "Couldn't check your access" with a Retry button. There is no
  fallback menu anymore.
- **Page missing from the response, or sent with `get: false`:** the page shows
  Access Denied. A whole module missing from the response blocks every page under it.
  Routes that aren't menu pages (profile, detail pages such as `/student/profile`) are
  always allowed; their APIs still authorize each call.

### Frontend checks today: please read before changing keys

Each module table has a **Frontend checks today** column listing the keys that page's
code actually reads right now. Most pages read the same keys as their events. On
**17 pages** the code still gates an event on an older generic key. For example,
Learning Mode Approval's Approve button checks `edit`, not `approve`.

On those pages, **send both the event keys and the keys in "Frontend checks today"**
until the frontend is switched to the new keys. Otherwise the button disappears. A
page whose column says `none` doesn't hide any buttons by permission yet. It is open
to everyone who has the page.

The pages that need this are:

| Page | URL | Frontend checks | Events |
|---|---|---|---|
| Vetting Desk | `/admission/vetting` | `edit` | `approve` `reject` `hold` |
| Registrar's Desk | `/admission/registration` | `add` | `register` `print` |
| Payment Reconciliation | `/academic/odl-reconciliation` | `edit` `delete` | `approve` `reject` |
| Student Master | `/student/student-master` | `learningmode` `refugee` `sponsor`, with `edit` as fallback | `view` `learningmode` `refugee` `sponsor` |
| Batch Transfer | `/student/batch-transfer` | `edit` | `execute` |
| Programme Transfer | `/student/prog-transfer` | `edit` | `execute` |
| Learning Mode | `/student/learning-mode` | `edit` | `submit` |
| Learning Mode Approval | `/student/learning-mode-approval` | `edit` | `approve` `download` |
| Refugee Status Approval | `/student/refugee-approval` | `edit` | `approve` `download` |
| Dropout Rejoin | `/student/intake-transfer` | `edit` | `execute` |
| Fee Structure Transfer | `/student/fee-structure-transfer` | `edit` | `execute` |
| Terminate Student | `/student/terminate-student` | `add` | `execute` |
| Passout Confirmation | `/student/passout-confirmation` | `edit` | `approve` |
| Send Communication | `/student/communications` | `add` | `send` |
| Specialization Management | `/student/specialization` | `edit` | `assign` |
| UE Material Print | `/assessment/university-exam-material-print` | `add` | `print` |
| UE QP/Booklet Print | `/assessment/university-exam-qp-booklet-print` | `add` `delete` | `print` `generate` `delete` |

Hiding a button only changes the UI. Real access control still has to be enforced by
each API.

## Rail (top-level module) icons

| Rail | Icon class |
|---|---|
| Student | `lni lni-user` |
| Finance | `lni lni-dollar` |
| Academic | `lni lni-graduation` |
| Admission | `lni lni-clipboard` |
| Employee | `lni lni-briefcase` |
| Attendance | `lni lni-alarm-clock` |
| Assessment | `lni lni-pencil-alt` |
| Analytics | `lni lni-bar-chart` |
| Configuration | `lni lni-cog` |

---

## Student

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| Student Records | Student Master | `/student/student-master` | `get` `view` `learningmode` `refugee` `sponsor` | `get` `view` `edit` `learningmode` `refugee` `sponsor` | row actions use their own flags: View, Learning Mode, Refugee Status, Sponsor |
| Student Records | Student Profile | `/student/profile` | `get` `edit` `send` `print` `download` | `edit` | `print`/`download` = ID card; `send` = credentials via email/WhatsApp |
| Transfers | Batch Transfer | `/student/batch-transfer` | `get` `execute` | `edit` |  |
| Transfers | Programme Transfer | `/student/prog-transfer` | `get` `execute` | `edit` |  |
| Transfers | Dropout Rejoin | `/student/intake-transfer` | `get` `execute` | `edit` | `execute` = rejoin student |
| Transfers | Fee Structure Transfer | `/student/fee-structure-transfer` | `get` `execute` | `edit` |  |
| Approvals | Learning Mode Approval | `/student/learning-mode-approval` | `get` `approve` `download` | `edit` |  |
| Approvals | Refugee Status Approval | `/student/refugee-approval` | `get` `approve` `download` | `edit` |  |
| Approvals | Passout Confirmation | `/student/passout-confirmation` | `get` `approve` | `edit` | `approve` = confirm passout |
| Operations | Learning Mode | `/student/learning-mode` | `get` `submit` | `edit` | `submit` = raise change request for approval |
| Operations | Terminate Student | `/student/terminate-student` | `get` `execute` | `add` | `execute` = terminate |
| Student Services | Service Tickets | `/student/service-tickets` | `get` `edit` | — | Staff triage of student service tickets: change a ticket's category or status and write a response (`edit`). The page doesn't check menu events itself; its APIs check `students.serviceticket.manage`. Section must not be named `Services` (the frontend drops a Student section with that name) |
| Communications | Send Communication | `/student/communications` | `get` `send` | `add` |  |

```json
{
  "name": "Student",
  "icon": "lni lni-user",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Student Records",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Student Master",
          "icon": "lni lni-graduation",
          "url": "/student/student-master",
          "permissions": { "get": true, "view": true, "learningmode": true, "refugee": true, "sponsor": true },
          "children": []
        },
        {
          "name": "Student Profile",
          "icon": "lni lni-user",
          "url": "/student/profile",
          "permissions": { "get": true, "edit": true, "send": true, "print": true, "download": true },
          "children": []
        }
      ]
    },
    {
      "name": "Transfers",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Batch Transfer",
          "icon": "lni lni-shuffle",
          "url": "/student/batch-transfer",
          "permissions": { "get": true, "execute": true },
          "children": []
        },
        {
          "name": "Programme Transfer",
          "icon": "lni lni-graduation",
          "url": "/student/prog-transfer",
          "permissions": { "get": true, "execute": true },
          "children": []
        },
        {
          "name": "Dropout Rejoin",
          "icon": "lni lni-calendar",
          "url": "/student/intake-transfer",
          "permissions": { "get": true, "execute": true },
          "children": []
        },
        {
          "name": "Fee Structure Transfer",
          "icon": "lni lni-dollar",
          "url": "/student/fee-structure-transfer",
          "permissions": { "get": true, "execute": true },
          "children": []
        }
      ]
    },
    {
      "name": "Approvals",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Learning Mode Approval",
          "icon": "lni lni-checkmark-circle",
          "url": "/student/learning-mode-approval",
          "permissions": { "get": true, "approve": true, "download": true },
          "children": []
        },
        {
          "name": "Refugee Status Approval",
          "icon": "lni lni-checkmark-circle",
          "url": "/student/refugee-approval",
          "permissions": { "get": true, "approve": true, "download": true },
          "children": []
        },
        {
          "name": "Passout Confirmation",
          "icon": "lni lni-graduation",
          "url": "/student/passout-confirmation",
          "permissions": { "get": true, "approve": true },
          "children": []
        }
      ]
    },
    {
      "name": "Operations",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Learning Mode",
          "icon": "lni lni-display",
          "url": "/student/learning-mode",
          "permissions": { "get": true, "submit": true },
          "children": []
        },
        {
          "name": "Terminate Student",
          "icon": "lni lni-shield",
          "url": "/student/terminate-student",
          "permissions": { "get": true, "execute": true },
          "children": []
        }
      ]
    },
    {
      "name": "Student Services",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Service Tickets",
          "icon": "lni lni-ticket",
          "url": "/student/service-tickets",
          "permissions": { "get": true, "edit": true },
          "children": []
        }
      ]
    },
    {
      "name": "Communications",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Send Communication",
          "icon": "lni lni-envelope",
          "url": "/student/communications",
          "permissions": { "get": true, "send": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Finance

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| General | Dashboard | `/finance/dashboard` | `get` | none |  |
| General | Student Statement | `/finance/student-statements` | `get` `print` | `print` |  |
| Payment Collection | Payment Console | `/finance/payment-console` | `get` `add` `edit` `print` | `add` `edit` `print` | `add` = save payment / apply advance; `edit` = edit a saved payment |
| Payment Collection | Payment Refund | `/finance/payment-refund` | `get` `add` | `add` | `add` = submit refund |
| Payment Collection | NCHE & Guild Payment | `/finance/nche-guild-payment` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Payment Collection | Discount Allocation | `/finance/discount-allocation` | `get` `add` `edit` `cancel` | `add` `edit` `cancel` | `cancel` = cancel discount (now or from next semester) |
| Payment Collection | Refugee Status | `/finance/refugee-status` | `get` `add` `edit` `delete` | `add` `edit` `delete` | `add` = grant status; `delete` = remove status |
| Payment Collection | Ledger Adjustments | `/finance/ledger-adjustments` | `get` `edit` | `edit` | `edit` = adjust ledger line |
| Payment Collection | Advanced Payments | `/finance/advanced-payments` | `get` `add` | `create` (same as `add`) | `add` = new deposit |

```json
{
  "name": "Finance",
  "icon": "lni lni-dollar",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "General",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/finance/dashboard",
          "permissions": { "get": true },
          "children": []
        },
        {
          "name": "Student Statement",
          "icon": "lni lni-files",
          "url": "/finance/student-statements",
          "permissions": { "get": true, "print": true },
          "children": []
        }
      ]
    },
    {
      "name": "Payment Collection",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Payment Console",
          "icon": "lni lni-credit-cards",
          "url": "/finance/payment-console",
          "permissions": { "get": true, "add": true, "edit": true, "print": true },
          "children": []
        },
        {
          "name": "Payment Refund",
          "icon": "lni lni-reload",
          "url": "/finance/payment-refund",
          "permissions": { "get": true, "add": true },
          "children": []
        },
        {
          "name": "NCHE & Guild Payment",
          "icon": "lni lni-graduation",
          "url": "/finance/nche-guild-payment",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Discount Allocation",
          "icon": "lni lni-tag",
          "url": "/finance/discount-allocation",
          "permissions": { "get": true, "add": true, "edit": true, "cancel": true },
          "children": []
        },
        {
          "name": "Refugee Status",
          "icon": "lni lni-shield",
          "url": "/finance/refugee-status",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Ledger Adjustments",
          "icon": "lni lni-lock",
          "url": "/finance/ledger-adjustments",
          "permissions": { "get": true, "edit": true },
          "children": []
        },
        {
          "name": "Advanced Payments",
          "icon": "lni lni-wallet",
          "url": "/finance/advanced-payments",
          "permissions": { "get": true, "add": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Academic

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| General | Dashboard | `/academic/acad-dashboard` | `get` `export` | none |  |
| Academic Core | Intake Master | `/academic/intake-master` | `get` `add` `edit` `delete` `export` | `get` `add` `edit` `delete` |  |
| Academic Core | Bulk Intake Edit | `/academic/bulk-intake-edit` | `get` `edit` | `get` `edit` |  |
| Academic Core | Batch Management | `/academic/batch-management` | `get` `add` `edit` `delete` | `add` `edit` `delete` | Includes the former Batch Summary (2026-10-21): head count is a column in the batch table (2026-10-28), with the summary stat tiles on top |
| Academic Core | Session Movement | `/academic/session-movement` | `get` `execute` | none | `execute` = single and bulk Move Session |
| Course Unit Master | Repetition Tag | `/academic/repetition-tag` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Course Unit Master | Course Units | `/academic/course-units` | `get` `add` `edit` `delete` `export` | `add` `edit` `delete` |  |
| Course Unit Master | Course Allocation | `/academic/course-allocation` | `get` `add` `edit` `delete` | `add` `edit` `delete` | `edit` = update an allocation; `delete` = remove allocation |
| Programme Master | Programme Master | `/academic/programme-master` | `get` `add` `edit` `delete` `export` | `add` `edit` `delete` | `edit` also covers Renew; `add` covers New Version |
| Programme Master | Fee Structure | `/academic/fee-structure` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Programme Master | Programme Approval | `/academic/programme-approval` | `get` `delete` `approve` | `approve` `delete` |  |
| Timetable | Schedule Timetable | `/academic/timetable` | `get` `add` `edit` `delete` | `add` `edit` `delete` | Current or next intake only. Print uses the browser. Bulk Import is shown disabled (no API), so `import` is no longer used |
| Timetable | Lecturer View | `/academic/timetable-lecturer` | `get` `export` | none | `export` = PDF (browser print) |
| Timetable | Batch View | `/academic/timetable-batch` | `get` `export` | none | `export` = PDF (browser print) |
| Timetable | Time Slot Audit | `/academic/timetable-slot-audit` | `get` `export` | none | `export` = PDF (browser print) and Excel (CSV built in the browser) |
| ODL Applications | ODL Applications | `/academic/odl-applications` | `get` `export` | none |  |
| ODL Applications | Payment Reconciliation | `/academic/odl-reconciliation` | `get` `approve` `reject` | `edit` `delete` | `approve` = confirm reconciliation |
| Events and Announcements | Event Management | `/student/event-management` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Events and Announcements | Announcement Management | `/student/announcement-management` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |

```json
{
  "name": "Academic",
  "icon": "lni lni-graduation",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "General",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/academic/acad-dashboard",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Academic Core",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Intake Master",
          "icon": "lni lni-calendar",
          "url": "/academic/intake-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true, "export": true },
          "children": []
        },
        {
          "name": "Bulk Intake Edit",
          "icon": "lni lni-layers",
          "url": "/academic/bulk-intake-edit",
          "permissions": { "get": true, "edit": true },
          "children": []
        },
        {
          "name": "Batch Management",
          "icon": "lni lni-users",
          "url": "/academic/batch-management",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Session Movement",
          "icon": "lni lni-reload",
          "url": "/academic/session-movement",
          "permissions": { "get": true, "execute": true },
          "children": []
        }
      ]
    },
    {
      "name": "Course Unit Master",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Repetition Tag",
          "icon": "lni lni-reload",
          "url": "/academic/repetition-tag",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Course Units",
          "icon": "lni lni-book",
          "url": "/academic/course-units",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true, "export": true },
          "children": []
        },
        {
          "name": "Course Allocation",
          "icon": "lni lni-agenda",
          "url": "/academic/course-allocation",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "Programme Master",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Programme Master",
          "icon": "lni lni-graduation",
          "url": "/academic/programme-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true, "export": true },
          "children": []
        },
        {
          "name": "Fee Structure",
          "icon": "lni lni-dollar",
          "url": "/academic/fee-structure",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Programme Approval",
          "icon": "lni lni-check-box",
          "url": "/academic/programme-approval",
          "permissions": { "get": true, "delete": true, "approve": true },
          "children": []
        }
      ]
    },
    {
      "name": "Timetable",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Schedule Timetable",
          "icon": "lni lni-calendar",
          "url": "/academic/timetable",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Lecturer View",
          "icon": "lni lni-user",
          "url": "/academic/timetable-lecturer",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Batch View",
          "icon": "lni lni-users",
          "url": "/academic/timetable-batch",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Time Slot Audit",
          "icon": "lni lni-alarm-clock",
          "url": "/academic/timetable-slot-audit",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "ODL Applications",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "ODL Applications",
          "icon": "lni lni-world",
          "url": "/academic/odl-applications",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Payment Reconciliation",
          "icon": "lni lni-credit-cards",
          "url": "/academic/odl-reconciliation",
          "permissions": { "get": true, "approve": true, "reject": true },
          "children": []
        }
      ]
    },
    {
      "name": "Events and Announcements",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Event Management",
          "icon": "lni lni-calendar",
          "url": "/student/event-management",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Announcement Management",
          "icon": "lni lni-bullhorn",
          "url": "/student/announcement-management",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Admission

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| General | Dashboard | `/admission/dashboard` | `get` | none |  |
| Enquiry | On-Desk Enquiry | `/admission/ondesk-enquiry` | `get` `add` | `add` |  |
| Enquiry | Enquiry List | `/admission/enquiry-list` | `get` `add` `edit` `assign` `verify` | `add` `edit` | `assign` = assign counsellor; `verify` = verify enquirer email |
| Enquiry | Enquiry Followup Master | `/admission/enquiry-followup-master` | `get` `add` `edit` `assign` | `add` `edit` | `add` = log follow-up; `assign` = assign counsellor |
| Enquiry | Enquiry Status | `/config/enquiry-status` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Enquiry | Isbat Enquiry Source | `/config/enquiry-source` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Enquiry | Enquiry Followup | `/admission/enquiry-followup` | `get` `edit` `assign` | `edit` | `assign` = assign counsellor |
| Other | Online Enquiry | `/admission/online-enquiry` | `get` `add` | `add` |  |
| Other | Self-Service Kiosk | `/admission/kiosk-enquiry` | `get` `add` | `add` |  |
| Admission Flow | Application Payment | `/admission/payment` | `get` `add` `import` `print` | `add` | `import` = from Enquiry / ODeL / CRM; `print` = receipt PDF after saving (normal payments only, not exemptions) |
| Admission Flow | Application Filing | `/admission/filing` | `get` `add` `delete` `submit` | `add` `delete` | `submit` = submit application for vetting |
| Admission Flow | Vetting Desk | `/admission/vetting` | `get` `approve` `reject` `hold` | `edit` | `hold` = Wait (awaiting original documents) |
| Admission Flow | Registrar's Desk | `/admission/registration` | `get` `register` `print` | `add` | `print` = onboarding print-out |
| Records | All Applicants | `/admission/applicants` | `get` `export` | none |  |
| Records | Paid Students | `/admission/paid-students` | `get` `print` | none | Paid / exempted applicants per intake with their application stage; `print` = reprint the application payment receipt PDF (paid rows with a receipt only) |

```json
{
  "name": "Admission",
  "icon": "lni lni-clipboard",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "General",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/admission/dashboard",
          "permissions": { "get": true },
          "children": []
        }
      ]
    },
    {
      "name": "Enquiry",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "On-Desk Enquiry",
          "icon": "lni lni-pencil-alt",
          "url": "/admission/ondesk-enquiry",
          "permissions": { "get": true, "add": true },
          "children": []
        },
        {
          "name": "Enquiry List",
          "icon": "lni lni-folder",
          "url": "/admission/enquiry-list",
          "permissions": { "get": true, "add": true, "edit": true, "assign": true, "verify": true },
          "children": []
        },
        {
          "name": "Enquiry Followup Master",
          "icon": "lni lni-calendar",
          "url": "/admission/enquiry-followup-master",
          "permissions": { "get": true, "add": true, "edit": true, "assign": true },
          "children": []
        },
        {
          "name": "Enquiry Status",
          "icon": "lni lni-flag",
          "url": "/config/enquiry-status",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Isbat Enquiry Source",
          "icon": "lni lni-compass",
          "url": "/config/enquiry-source",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Enquiry Followup",
          "icon": "lni lni-phone",
          "url": "/admission/enquiry-followup",
          "permissions": { "get": true, "edit": true, "assign": true },
          "children": []
        }
      ]
    },
    {
      "name": "Other",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Online Enquiry",
          "icon": "lni lni-display",
          "url": "/admission/online-enquiry",
          "permissions": { "get": true, "add": true },
          "children": []
        },
        {
          "name": "Self-Service Kiosk",
          "icon": "lni lni-tab",
          "url": "/admission/kiosk-enquiry",
          "permissions": { "get": true, "add": true },
          "children": []
        }
      ]
    },
    {
      "name": "Admission Flow",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Application Payment",
          "icon": "lni lni-credit-cards",
          "url": "/admission/payment",
          "permissions": { "get": true, "add": true, "import": true, "print": true },
          "children": []
        },
        {
          "name": "Application Filing",
          "icon": "lni lni-pencil-alt",
          "url": "/admission/filing",
          "permissions": { "get": true, "add": true, "delete": true, "submit": true },
          "children": []
        },
        {
          "name": "Vetting Desk",
          "icon": "lni lni-search-alt",
          "url": "/admission/vetting",
          "permissions": { "get": true, "approve": true, "reject": true, "hold": true },
          "children": []
        },
        {
          "name": "Registrar's Desk",
          "icon": "lni lni-graduation",
          "url": "/admission/registration",
          "permissions": { "get": true, "register": true, "print": true },
          "children": []
        }
      ]
    },
    {
      "name": "Records",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "All Applicants",
          "icon": "lni lni-users",
          "url": "/admission/applicants",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Paid Students",
          "icon": "lni lni-wallet",
          "url": "/admission/paid-students",
          "permissions": { "get": true, "print": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Employee

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| Employee Records | Employee Master | `/employee/employee-master` | `get` `add` `edit` `assign` | `add` `edit` `assign` | `assign` = assign/edit employee permissions |
| Employee Records | Employee Approvals | `/employee/employee-approve` | `get` `approve` | `approve` |  |
| Access Control | Permission Master | `/config/permission-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` | `delete` = delete a permission group |

```json
{
  "name": "Employee",
  "icon": "lni lni-briefcase",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Employee Records",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Employee Master",
          "icon": "lni lni-user",
          "url": "/employee/employee-master",
          "permissions": { "get": true, "add": true, "edit": true, "assign": true },
          "children": []
        },
        {
          "name": "Employee Approvals",
          "icon": "lni lni-checkmark-circle",
          "url": "/employee/employee-approve",
          "permissions": { "get": true, "approve": true },
          "children": []
        }
      ]
    },
    {
      "name": "Access Control",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Permission Master",
          "icon": "lni lni-lock",
          "url": "/config/permission-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Attendance

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| Class Attendance | Record Attendance | `/attendance/record` | `get` `add` `edit` | `add` `edit` | `add` = save attendance for a new session (or skip it with a reason); `edit` = change an already recorded session |
| Class Attendance | Pending Outlines | `/attendance/pending-outlines` | `get` | none | Sessions still waiting for attendance; each row links to Record Attendance |
| Management | Attendance Sessions | `/attendance/sessions` | `get` `edit` `delete` | `edit` `delete` | `edit` opens the session in Record Attendance; automated and cancelled sessions can't be edited |

```json
{
  "name": "Attendance",
  "icon": "lni lni-alarm-clock",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Class Attendance",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Record Attendance",
          "icon": "lni lni-checkmark-circle",
          "url": "/attendance/record",
          "permissions": { "get": true, "add": true, "edit": true },
          "children": []
        },
        {
          "name": "Pending Outlines",
          "icon": "lni lni-list",
          "url": "/attendance/pending-outlines",
          "permissions": { "get": true },
          "children": []
        }
      ]
    },
    {
      "name": "Management",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Attendance Sessions",
          "icon": "lni lni-calendar",
          "url": "/attendance/sessions",
          "permissions": { "get": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Assessment

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| General | Assessment Dashboard | `/assessment/dashboard` | `get` `export` | none |  |
| Assessment Structure | Question Bank Upload | `/assessment/cw-qbank` | `get` `add` `edit` `delete` `import` `download` | none | `import` = Excel import; `download` = template |
| Assessment Structure | Bulk Exam Scheduler | `/assessment/bulk-exam-scheduler` | `get` `add` | none |  |
| Assessment Structure | Assessment Scheduler | `/assessment/ia-creation` | `get` `add` `edit` | none | Formerly IA Creation. `add` = create structure; `edit` = edit CW/CT/UE schedule |
| IA Internal Assessment | IA Evaluation | `/assessment/ia-evaluation` | `get` `edit` `submit` | none | `edit` = save marks; `submit` = finalize |
| IA Internal Assessment | CW Rectification | `/assessment/cw-rectify` | `get` `edit` `delete` | none | `edit` = reopen / re-evaluate attempt |
| IA Internal Assessment | Project Proposals | `/assessment/project-proposals` | `get` `add` `edit` `delete` | none |  |
| IA Internal Assessment | Project Reviews | `/assessment/project-reviews` | `get` `add` `edit` `delete` | none |  |
| IA Internal Assessment | Exam Cancel | `/assessment/exam-cancel` | `get` `edit` `cancel` | none | `cancel` = cancel attempt; `edit` = extra time |
| University Exam (UE) | Question Paper Vetting | `/assessment/qp-vetting` | `get` `add` `edit` `approve` | none | `approve` = vetting committee sign-off |
| University Exam (UE) | UE Practical QBank | `/assessment/question-bank-practical` | `get` `delete` `import` `download` | none |  |
| University Exam (UE) | Hall Ticket Issuance | `/assessment/hall-ticket` | `get` `add` `hallticketprint.get` `hallticketprint.print` `hallticketprintall.get` `hallticketprintall.print` | `get` `add` `edit` and the four `hallticketprint*` keys | One page with three tabs: Issue, Print and Print All. `add` = issue (single or bulk). The scoped keys gate the Print and Print All tabs and their buttons; see the 2026-11-27 change notes for the two ways to send them |
| University Exam (UE) | UE Material Print | `/assessment/university-exam-material-print` | `get` `print` | `add` |  |
| University Exam (UE) | UE QP/Booklet Print | `/assessment/university-exam-qp-booklet-print` | `get` `print` `generate` `delete` | `add` `delete` | `delete` = delete a Practical QP; both print buttons check `add` today |
| University Exam (UE) | UE Practical QP Print | `/assessment/university-exam-practical-qp-print` | `get` `delete` `print` `download` `generate` | none |  |
| University Exam (UE) | UE Project Booklet Print | `/assessment/university-exam-project-booklet-print` | `get` `print` `download` | none |  |
| University Exam (UE) | UE Attendance | `/assessment/ue-attendance` | `get` `edit` | none |  |
| University Exam (UE) | UE Mark Import | `/assessment/ue-mark-import` | `get` `import` | none |  |
| University Exam (UE) | Mark Entry — UE | `/assessment/mark-ue` | `get` `edit` | `get` `edit` | `edit` = save a student's marks |
| University Exam (UE) | Mark Verify — UE | `/assessment/mark-ue-verify` | `get` `edit` `verify` | `get` `edit` | `edit` = correct a mark; `verify` = verify the exam (locks it for mark entry) |
| University Exam (UE) | Exam Mark Import | `/assessment/exam-mark-import` | `get` `import` `download` `publish` | none |  |
| Results & Graduation | Result & Moderation | `/assessment/moderation` | `get` `edit` | none |  |
| Results & Graduation | Generate Result | `/assessment/generate-result` | `get` `generate` `publish` `withdraw` `delete` | `get` `generate` `publish` `withdraw` `delete` | Per programme / semester / batch. `withdraw` = take published results back. A missing `generate`, `publish` or `withdraw` key counts as allowed, so send `false` to deny; a missing `delete` follows `edit` |
| Results & Graduation | Transcript Print | `/assessment/transcript-print` | `get` `print` | none |  |
| Results & Graduation | Graduate Transcript | `/assessment/graduate-transcript` | `get` `generate` | none |  |
| Results & Graduation | HEC Graduate Transcript | `/assessment/hec-graduate-transcript` | `get` `generate` | none |  |
| Results & Graduation | Transcript Collection | `/assessment/graduate-transcript/collection` | `get` `add` | none | `add` = record collection |
| Results & Graduation | Gown Collection | `/assessment/gown-collection` | `get` `add` | none | `add` = record collection |
| Resit | Resit Master | `/assessment/resit-configs` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Resit | Resit Question Print | `/assessment/resit-question-print` | `get` `delete` `print` `generate` | none |  |
| Resit | Resit Applications | `/assessment/resit-applications` | `get` | none |  |
| Resit | Resit Apply | `/assessment/resit-apply` | `get` `add` `edit` `delete` | none |  |
| Resit | Resit Scheduling | `/assessment/resit-scheduling` | `get` `add` `edit` | none |  |
| Resit | Resit IA Evaluation | `/assessment/resit-evaluation` | `get` `submit` | none | `submit` = submit evaluation |
| Resit | Resit IA Result | `/assessment/resit-ia-results` | `get` `export` | none |  |
| Resit | Resit UE Mark Import | `/assessment/resit-ue-mark-import` | `get` `import` `download` | none |  |
| Resit | Resit Mark Update | `/assessment/resit-mark-update` | `get` `publish` | none | `publish` = push marks |
| Exam Grievances | Exam Grievances | `/assessment/exam-grievances` | `get` `edit` | none | `edit` = respond (save & email) |

```json
{
  "name": "Assessment",
  "icon": "lni lni-pencil-alt",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "General",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Assessment Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/assessment/dashboard",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Assessment Structure",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Question Bank Upload",
          "icon": "lni lni-upload",
          "url": "/assessment/cw-qbank",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true, "import": true, "download": true },
          "children": []
        },
        {
          "name": "Bulk Exam Scheduler",
          "icon": "lni lni-calendar",
          "url": "/assessment/bulk-exam-scheduler",
          "permissions": { "get": true, "add": true },
          "children": []
        },
        {
          "name": "Assessment Scheduler",
          "icon": "lni lni-graduation",
          "url": "/assessment/ia-creation",
          "permissions": { "get": true, "add": true, "edit": true },
          "children": []
        }
      ]
    },
    {
      "name": "IA Internal Assessment",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "IA Evaluation",
          "icon": "lni lni-checkmark-circle",
          "url": "/assessment/ia-evaluation",
          "permissions": { "get": true, "edit": true, "submit": true },
          "children": []
        },
        {
          "name": "CW Rectification",
          "icon": "lni lni-reload",
          "url": "/assessment/cw-rectify",
          "permissions": { "get": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Project Proposals",
          "icon": "lni lni-folder",
          "url": "/assessment/project-proposals",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Project Reviews",
          "icon": "lni lni-folder",
          "url": "/assessment/project-reviews",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Exam Cancel",
          "icon": "lni lni-timer",
          "url": "/assessment/exam-cancel",
          "permissions": { "get": true, "edit": true, "cancel": true },
          "children": []
        }
      ]
    },
    {
      "name": "University Exam (UE)",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Question Paper Vetting",
          "icon": "lni lni-upload",
          "url": "/assessment/qp-vetting",
          "permissions": { "get": true, "add": true, "edit": true, "approve": true },
          "children": []
        },
        {
          "name": "UE Practical QBank",
          "icon": "lni lni-upload",
          "url": "/assessment/question-bank-practical",
          "permissions": { "get": true, "delete": true, "import": true, "download": true },
          "children": []
        },
        {
          "name": "Hall Ticket Issuance",
          "icon": "lni lni-ticket",
          "url": "/assessment/hall-ticket",
          "permissions": { "get": true, "add": true, "hallticketprint.get": true, "hallticketprint.print": true, "hallticketprintall.get": true, "hallticketprintall.print": true },
          "children": []
        },
        {
          "name": "UE Material Print",
          "icon": "lni lni-printer",
          "url": "/assessment/university-exam-material-print",
          "permissions": { "get": true, "print": true },
          "children": []
        },
        {
          "name": "UE QP/Booklet Print",
          "icon": "lni lni-printer",
          "url": "/assessment/university-exam-qp-booklet-print",
          "permissions": { "get": true, "print": true, "generate": true, "delete": true },
          "children": []
        },
        {
          "name": "UE Practical QP Print",
          "icon": "lni lni-printer",
          "url": "/assessment/university-exam-practical-qp-print",
          "permissions": { "get": true, "delete": true, "print": true, "download": true, "generate": true },
          "children": []
        },
        {
          "name": "UE Project Booklet Print",
          "icon": "lni lni-printer",
          "url": "/assessment/university-exam-project-booklet-print",
          "permissions": { "get": true, "print": true, "download": true },
          "children": []
        },
        {
          "name": "UE Attendance",
          "icon": "lni lni-users",
          "url": "/assessment/ue-attendance",
          "permissions": { "get": true, "edit": true },
          "children": []
        },
        {
          "name": "UE Mark Import",
          "icon": "lni lni-upload",
          "url": "/assessment/ue-mark-import",
          "permissions": { "get": true, "import": true },
          "children": []
        },
        {
          "name": "Mark Entry — UE",
          "icon": "lni lni-pencil-alt",
          "url": "/assessment/mark-ue",
          "permissions": { "get": true, "edit": true },
          "children": []
        },
        {
          "name": "Mark Verify — UE",
          "icon": "lni lni-shield",
          "url": "/assessment/mark-ue-verify",
          "permissions": { "get": true, "edit": true, "verify": true },
          "children": []
        },
        {
          "name": "Exam Mark Import",
          "icon": "lni lni-upload",
          "url": "/assessment/exam-mark-import",
          "permissions": { "get": true, "import": true, "download": true, "publish": true },
          "children": []
        }
      ]
    },
    {
      "name": "Results & Graduation",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Result & Moderation",
          "icon": "lni lni-bar-chart",
          "url": "/assessment/moderation",
          "permissions": { "get": true, "edit": true },
          "children": []
        },
        {
          "name": "Generate Result",
          "icon": "lni lni-cogs",
          "url": "/assessment/generate-result",
          "permissions": { "get": true, "generate": true, "publish": true, "withdraw": true, "delete": true },
          "children": []
        },
        {
          "name": "Transcript Print",
          "icon": "lni lni-printer",
          "url": "/assessment/transcript-print",
          "permissions": { "get": true, "print": true },
          "children": []
        },
        {
          "name": "Graduate Transcript",
          "icon": "lni lni-certificate",
          "url": "/assessment/graduate-transcript",
          "permissions": { "get": true, "generate": true },
          "children": []
        },
        {
          "name": "HEC Graduate Transcript",
          "icon": "lni lni-certificate",
          "url": "/assessment/hec-graduate-transcript",
          "permissions": { "get": true, "generate": true },
          "children": []
        },
        {
          "name": "Transcript Collection",
          "icon": "lni lni-check-box",
          "url": "/assessment/graduate-transcript/collection",
          "permissions": { "get": true, "add": true },
          "children": []
        },
        {
          "name": "Gown Collection",
          "icon": "lni lni-check-box",
          "url": "/assessment/gown-collection",
          "permissions": { "get": true, "add": true },
          "children": []
        }
      ]
    },
    {
      "name": "Resit",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Resit Master",
          "icon": "lni lni-cogs",
          "url": "/assessment/resit-configs",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Resit Question Print",
          "icon": "lni lni-printer",
          "url": "/assessment/resit-question-print",
          "permissions": { "get": true, "delete": true, "print": true, "generate": true },
          "children": []
        },
        {
          "name": "Resit Applications",
          "icon": "lni lni-folder",
          "url": "/assessment/resit-applications",
          "permissions": { "get": true },
          "children": []
        },
        {
          "name": "Resit Apply",
          "icon": "lni lni-pencil-alt",
          "url": "/assessment/resit-apply",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Resit Scheduling",
          "icon": "lni lni-calendar",
          "url": "/assessment/resit-scheduling",
          "permissions": { "get": true, "add": true, "edit": true },
          "children": []
        },
        {
          "name": "Resit IA Evaluation",
          "icon": "lni lni-checkmark-circle",
          "url": "/assessment/resit-evaluation",
          "permissions": { "get": true, "submit": true },
          "children": []
        },
        {
          "name": "Resit IA Result",
          "icon": "lni lni-bar-chart",
          "url": "/assessment/resit-ia-results",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Resit UE Mark Import",
          "icon": "lni lni-upload",
          "url": "/assessment/resit-ue-mark-import",
          "permissions": { "get": true, "import": true, "download": true },
          "children": []
        },
        {
          "name": "Resit Mark Update",
          "icon": "lni lni-reload",
          "url": "/assessment/resit-mark-update",
          "permissions": { "get": true, "publish": true },
          "children": []
        }
      ]
    },
    {
      "name": "Exam Grievances",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Exam Grievances",
          "icon": "lni lni-files",
          "url": "/assessment/exam-grievances",
          "permissions": { "get": true, "edit": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Analytics

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| Student | Students in Programme Report | `/student/reports/students-in-programme` | `get` `export` | `export` | Every student of one programme, filtered by semester / intake / status; preview + Excel export; exports land in the shared Downloads list. The APIs check `student.studentsinprogrammereport.get` (preview) and `.export` |
| Finance | Payment History | `/finance/payment-history` | `get` `edit` `print` | `edit` `print` |  |
| Finance | Discount Report | `/finance/reports/discount` | `get` `export` | `export` | Preview + Excel export; each user sees only their own exports. Downloads icon lives in the app header |
| Finance | Transaction Report | `/finance/reports/transaction` | `get` `export` | `export` | Same preview + Excel export flow as Discount Report; exports land in the shared Downloads list |
| Finance | Outstanding Report | `/finance/reports/outstanding` | `get` `export` | `export` | Same preview + Excel export flow as Discount Report; exports land in the shared Downloads list |
| Admission | Enquiry Report | `/admission/reports/enquiry` | `get` `export` | `export` | Preview + Excel export; exports land in the shared Downloads list |
| Admission | Application Status Report | `/admission/reports/application-status` | `get` `export` | `export` | Preview with count per stage + Excel export; exports land in the shared Downloads list |
| Attendance | Attendance by Date | `/attendance/reports/by-date` | `get` `export` | `export` | Sessions of one timetable slot with summary + Download PDF (`export`). Wired to `/attendance/reports/by-date/{preview,pdf}`; the API itself checks `assessment.attendancereport.get` |
| Attendance | Student Attendance % | `/attendance/reports/student-pct` | `get` `export` | `export` | Students' attendance for an intake + term, optionally by lecturer / course unit, + Download PDF (`export`). Wired to `/attendance/reports/*-pct/{preview,pdf}`; the API itself checks `assessment.attendancereport.get` |
| Attendance | Faculty Attendance % | `/attendance/reports/faculty-pct` | `get` `export` | `export` | Sessions conducted vs scheduled per lecturer and course unit for an intake + term, optionally one lecturer, + Download PDF (`export`). Wired to `/attendance/reports/*-pct/{preview,pdf}`; the API itself checks `assessment.attendancereport.get` |
| Assessment | Exam Schedule Report | `/assessment/reports/exam-schedule` | `get` `export` | `export` | Scheduled UE, coursework, test, mock and resit exams, filtered by type, intake, dates, programme, semester, course unit, status and mode; preview + Excel export; exports land in the shared Downloads list. The APIs check `assessment.examschedulereport.get` (preview) |
| Assessment | IA Evaluation Report | `/assessment/reports/ia-evaluation` | `get` `export` | `export` | Preview + Excel export; the Export button is hidden without `export` |
| Employee | Activity Log | `/activity-log/logs` | `get` | none |  |

```json
{
  "name": "Analytics",
  "icon": "lni lni-bar-chart",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Student",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Students in Programme Report",
          "icon": "lni lni-bar-chart",
          "url": "/student/reports/students-in-programme",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Finance",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Payment History",
          "icon": "lni lni-bar-chart",
          "url": "/finance/payment-history",
          "permissions": { "get": true, "edit": true, "print": true },
          "children": []
        },
        {
          "name": "Discount Report",
          "icon": "lni lni-tag",
          "url": "/finance/reports/discount",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Transaction Report",
          "icon": "lni lni-list",
          "url": "/finance/reports/transaction",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Outstanding Report",
          "icon": "lni lni-alarm-clock",
          "url": "/finance/reports/outstanding",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Admission",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Enquiry Report",
          "icon": "lni lni-bar-chart",
          "url": "/admission/reports/enquiry",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Application Status Report",
          "icon": "lni lni-bar-chart",
          "url": "/admission/reports/application-status",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Attendance",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Attendance by Date",
          "icon": "lni lni-calendar",
          "url": "/attendance/reports/by-date",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Student Attendance %",
          "icon": "lni lni-users",
          "url": "/attendance/reports/student-pct",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "Faculty Attendance %",
          "icon": "lni lni-library",
          "url": "/attendance/reports/faculty-pct",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Assessment",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Exam Schedule Report",
          "icon": "lni lni-bar-chart",
          "url": "/assessment/reports/exam-schedule",
          "permissions": { "get": true, "export": true },
          "children": []
        },
        {
          "name": "IA Evaluation Report",
          "icon": "lni lni-bar-chart",
          "url": "/assessment/reports/ia-evaluation",
          "permissions": { "get": true, "export": true },
          "children": []
        }
      ]
    },
    {
      "name": "Employee",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Activity Log",
          "icon": "lni lni-list",
          "url": "/activity-log/logs",
          "permissions": { "get": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Configuration

| Section | Page | URL | Events | Frontend checks today | Notes |
|---|---|---|---|---|---|
| Student | Specialization Management | `/student/specialization` | `get` `assign` | `edit` | `assign` = assign specialization to students |
| Student | Termination Reason Master | `/student/termination-reasons` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Student | Feedback Master | `/student/feedback-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Student | Student Category Master | `/config/student-category-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Student | Service Category Master | `/config/service-category-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Exchange Rates | `/finance/exchange-rates` | `get` `add` `edit` `delete` | `add` `edit` `delete` | `edit` = save rates |
| Finance | Cooperates | `/finance/cooperates` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Discounts | `/finance/discounts` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Ledgers | `/finance/ledgers` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Other Ledgers | `/finance/ledger-others` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Currency Master | `/finance/currency-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Receipt Books | `/finance/receipt-books` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | General Settings | `/finance/gen-sets` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Banks | `/finance/banks` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Bank Branches | `/finance/bank-branches` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Proc Banks | `/finance/proc-banks` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Finance | Proc GL Accounts | `/finance/proc-gl-accounts` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Faculty Master | `/config/faculty-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Campus Master | `/config/campus-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Skill Management | `/academic/skill-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Room Management | `/academic/room-management` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Programme Level | `/academic/programme-level` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Programme Group | `/academic/programme-group` | `get` `add` `edit` `delete` `export` | `add` `edit` `delete` |  |
| Academic | Specialization | `/config/specialization` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Skill Master | `/config/skill` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Unit Type Master | `/config/unit-type` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Unit Category Master | `/config/unit-category` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Weekdays | `/config/weekdays` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Academic | Batch Times | `/config/batch-times` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Admission | Enquiry Source | `/config/enquiry-source-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Admission | Followup Status | `/config/followup-status` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Admission | Followup Mode | `/config/followup-mode` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Admission | Interest Level | `/config/interest-level` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Assessment | Fee Clearance Master | `/assessment/assessment-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Assessment | Exam Rules Master | `/assessment/exam-rules` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| Assessment | Question FAQs | `/assessment/question-faqs` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| General | Department Master | `/config/department-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| General | Designation Master | `/config/designation-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| General | Course Level Master | `/config/course-level-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |
| General | Country Master | `/config/country-master` | `get` `add` `edit` `delete` | `add` `edit` `delete` |  |

```json
{
  "name": "Configuration",
  "icon": "lni lni-cog",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Student",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Specialization Management",
          "icon": "lni lni-graduation",
          "url": "/student/specialization",
          "permissions": { "get": true, "assign": true },
          "children": []
        },
        {
          "name": "Termination Reason Master",
          "icon": "lni lni-shield",
          "url": "/student/termination-reasons",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Feedback Master",
          "icon": "lni lni-comments",
          "url": "/student/feedback-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Student Category Master",
          "icon": "lni lni-users",
          "url": "/config/student-category-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Service Category Master",
          "icon": "lni lni-list",
          "url": "/config/service-category-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "Finance",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Exchange Rates",
          "icon": "lni lni-world",
          "url": "/finance/exchange-rates",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Cooperates",
          "icon": "lni lni-handshake",
          "url": "/finance/cooperates",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Discounts",
          "icon": "lni lni-tag",
          "url": "/finance/discounts",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Ledgers",
          "icon": "lni lni-book",
          "url": "/finance/ledgers",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Other Ledgers",
          "icon": "lni lni-book",
          "url": "/finance/ledger-others",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Currency Master",
          "icon": "lni lni-dollar",
          "url": "/finance/currency-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Receipt Books",
          "icon": "lni lni-ticket",
          "url": "/finance/receipt-books",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "General Settings",
          "icon": "lni lni-cog",
          "url": "/finance/gen-sets",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Banks",
          "icon": "lni lni-coin",
          "url": "/finance/banks",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Bank Branches",
          "icon": "lni lni-map-marker",
          "url": "/finance/bank-branches",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Proc Banks",
          "icon": "lni lni-wallet",
          "url": "/finance/proc-banks",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Proc GL Accounts",
          "icon": "lni lni-calculator",
          "url": "/finance/proc-gl-accounts",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "Academic",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Faculty Master",
          "icon": "lni lni-library",
          "url": "/config/faculty-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Campus Master",
          "icon": "lni lni-home",
          "url": "/config/campus-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Skill Management",
          "icon": "lni lni-bulb",
          "url": "/academic/skill-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Room Management",
          "icon": "lni lni-home",
          "url": "/academic/room-management",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Programme Level",
          "icon": "lni lni-layers",
          "url": "/academic/programme-level",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Programme Group",
          "icon": "lni lni-folder",
          "url": "/academic/programme-group",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true, "export": true },
          "children": []
        },
        {
          "name": "Specialization",
          "icon": "lni lni-certificate",
          "url": "/config/specialization",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Skill Master",
          "icon": "lni lni-bulb",
          "url": "/config/skill",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Unit Type Master",
          "icon": "lni lni-tag",
          "url": "/config/unit-type",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Unit Category Master",
          "icon": "lni lni-tag",
          "url": "/config/unit-category",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Weekdays",
          "icon": "lni lni-calendar",
          "url": "/config/weekdays",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Batch Times",
          "icon": "lni lni-timer",
          "url": "/config/batch-times",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "Admission",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Enquiry Source",
          "icon": "lni lni-volume",
          "url": "/config/enquiry-source-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Followup Status",
          "icon": "lni lni-phone",
          "url": "/config/followup-status",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Followup Mode",
          "icon": "lni lni-comments",
          "url": "/config/followup-mode",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Interest Level",
          "icon": "lni lni-signal",
          "url": "/config/interest-level",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "Assessment",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Fee Clearance Master",
          "icon": "lni lni-list",
          "url": "/assessment/assessment-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Exam Rules Master",
          "icon": "lni lni-files",
          "url": "/assessment/exam-rules",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Question FAQs",
          "icon": "lni lni-comments",
          "url": "/assessment/question-faqs",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    },
    {
      "name": "General",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Department Master",
          "icon": "lni lni-briefcase",
          "url": "/config/department-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Designation Master",
          "icon": "lni lni-tag",
          "url": "/config/designation-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Course Level Master",
          "icon": "lni lni-graduation",
          "url": "/config/course-level-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        },
        {
          "name": "Country Master",
          "icon": "lni lni-world",
          "url": "/config/country-master",
          "permissions": { "get": true, "add": true, "edit": true, "delete": true },
          "children": []
        }
      ]
    }
  ]
}
```

---
## Pages shown under their menu module's address

These pages sit under a different module in the menu than their URL. The frontend shows
each one at an address under its menu module, so the browser's address bar follows the
menu (Discount Report, under Analytics, opens at `/analytics/reports/discount`). It
rewrites the URL as the menu loads and checks permissions against the new address. The
old address still opens the page.

**Nothing changes for the menu API.** Keep sending the URL in the **URL sent** column,
as in the module tables above. The list is generated from the menu by
`scripts/menu-routes.mjs` (`src/lib/menuRoutes.generated.ts`); if a page moves module
in the menu, the frontend reruns it.

| Menu path | URL sent | Address in the app |
|---|---|---|
| Academic › Events and Announcements › Event Management | `/student/event-management` | `/academic/event-management` |
| Academic › Events and Announcements › Announcement Management | `/student/announcement-management` | `/academic/announcement-management` |
| Employee › Access Control › Permission Master | `/config/permission-master` | `/employee/permission-master` |
| Analytics › Student › Students in Programme Report | `/student/reports/students-in-programme` | `/analytics/reports/students-in-programme` |
| Analytics › Finance › Payment History | `/finance/payment-history` | `/analytics/payment-history` |
| Analytics › Finance › Discount Report | `/finance/reports/discount` | `/analytics/reports/discount` |
| Analytics › Finance › Transaction Report | `/finance/reports/transaction` | `/analytics/reports/transaction` |
| Analytics › Finance › Outstanding Report | `/finance/reports/outstanding` | `/analytics/reports/outstanding` |
| Analytics › Admission › Enquiry Report | `/admission/reports/enquiry` | `/analytics/reports/enquiry` |
| Analytics › Admission › Application Status Report | `/admission/reports/application-status` | `/analytics/reports/application-status` |
| Analytics › Attendance › Attendance by Date | `/attendance/reports/by-date` | `/analytics/reports/by-date` |
| Analytics › Attendance › Student Attendance % | `/attendance/reports/student-pct` | `/analytics/reports/student-pct` |
| Analytics › Attendance › Faculty Attendance % | `/attendance/reports/faculty-pct` | `/analytics/reports/faculty-pct` |
| Analytics › Assessment › Exam Schedule Report | `/assessment/reports/exam-schedule` | `/analytics/reports/exam-schedule` |
| Analytics › Assessment › IA Evaluation Report | `/assessment/reports/ia-evaluation` | `/analytics/reports/ia-evaluation` |
| Analytics › Employee › Activity Log | `/activity-log/logs` | `/analytics/logs` |
| Configuration › Student › Specialization Management | `/student/specialization` | `/config/specialization-management` |
| Configuration › Student › Termination Reason Master | `/student/termination-reasons` | `/config/termination-reasons` |
| Configuration › Student › Feedback Master | `/student/feedback-master` | `/config/feedback-master` |
| Configuration › Finance › Exchange Rates | `/finance/exchange-rates` | `/config/exchange-rates` |
| Configuration › Finance › Cooperates | `/finance/cooperates` | `/config/cooperates` |
| Configuration › Finance › Discounts | `/finance/discounts` | `/config/discounts` |
| Configuration › Finance › Ledgers | `/finance/ledgers` | `/config/ledgers` |
| Configuration › Finance › Other Ledgers | `/finance/ledger-others` | `/config/ledger-others` |
| Configuration › Finance › Currency Master | `/finance/currency-master` | `/config/currency-master` |
| Configuration › Finance › Receipt Books | `/finance/receipt-books` | `/config/receipt-books` |
| Configuration › Finance › General Settings | `/finance/gen-sets` | `/config/gen-sets` |
| Configuration › Finance › Banks | `/finance/banks` | `/config/banks` |
| Configuration › Finance › Bank Branches | `/finance/bank-branches` | `/config/bank-branches` |
| Configuration › Finance › Proc Banks | `/finance/proc-banks` | `/config/proc-banks` |
| Configuration › Finance › Proc GL Accounts | `/finance/proc-gl-accounts` | `/config/proc-gl-accounts` |
| Configuration › Academic › Skill Management | `/academic/skill-master` | `/config/skill-master` |
| Configuration › Academic › Room Management | `/academic/room-management` | `/config/room-management` |
| Configuration › Academic › Programme Level | `/academic/programme-level` | `/config/programme-level` |
| Configuration › Academic › Programme Group | `/academic/programme-group` | `/config/programme-group` |
| Configuration › Assessment › Fee Clearance Master | `/assessment/assessment-master` | `/config/assessment-master` |
| Configuration › Assessment › Exam Rules Master | `/assessment/exam-rules` | `/config/exam-rules` |
| Configuration › Assessment › Question FAQs | `/assessment/question-faqs` | `/config/question-faqs` |

## Pages hidden from the sidebar

These pages still exist in the code but are deliberately left out of the menu. Don't
add them to the menu response. If they are sent, the frontend removes Student Lookup,
Weight Configuration, Assessment Schedule, the four Resit pages and the two Hall
Ticket print pages itself (`stripUnintegratedPages`, which also drops a section left
empty), and removes any "Lecturer Master" / "Lecture Master" node
(`stripLectureMaster`).

The two Hall Ticket print pages are the exception to "don't send": their permissions
are still read. See the 2026-11-27 change notes.

| Module | Page | URL |
|---|---|---|
| Academic | Student Lookup | `/academic/student-lookup` (was Academic › Cross-Module, the section's only page) |
| Academic | Batch Summary | `/academic/batch-summary` (redirects to Batch Management's Head Count tab; dropped by `removeBatchSummary`) |
| Student | Learning Mode Report | `/student/learning-mode-report` |
| Student | Student Services | `/student/services` |
| Assessment | Weight Configuration | `/assessment/weight-config` |
| Assessment | Assessment Schedule | `/assessment/schedule` |
| Assessment | CW Overview | `/assessment/cw-overview` |
| Assessment | CW Submissions | `/assessment/cw-submissions` |
| Assessment | CBT Overview | `/assessment/cbt-overview` |
| Assessment | CBT Question Upload | `/assessment/cbt-qupload` |
| Assessment | CBT Monitor | `/assessment/cbt-monitor` |
| Assessment | UE Schedule | `/assessment/ue-schedule` |
| Assessment | Mark Entry — CW | `/assessment/mark-cw` |
| Assessment | Mark Entry — CBT | `/assessment/mark-cbt` |
| Assessment | Resit Calendar | `/assessment/resit-calendar` |
| Assessment | Resit Seating Allocator | `/assessment/resit-seating` |
| Assessment | CW Reevaluation | `/assessment/reeval` |
| Assessment | CW Recheck Hub | `/assessment/recheck` |
| Assessment | Pending QP Upload | `/assessment/rpt-pending-qp` |
| Assessment | Faculty Summary | `/assessment/rpt-faculty` |
| Assessment | Hall Ticket Print | `/assessment/hall-print` (now the Print tab of Hall Ticket Issuance; the URL redirects there) |
| Assessment | Hall Ticket Print All | `/assessment/hall-ticket-print-all` (now the Print All tab of Hall Ticket Issuance; the URL redirects there) |
| Admission | ODeL Application | `/admission/odel-application` (not in the v7 hierarchy) |

## Changes since the previous version (2026-11-17)

**The menu now follows the v7 hierarchy.** Every module table above was rebuilt in v7
order. Each page's events, frontend checks and permission bag carry over unchanged
unless listed below; most pages only changed section or module.

- **New modules Analytics and Configuration** (rail icons `lni lni-bar-chart` and
  `lni lni-cog`). **Config** and **Activity Log** are gone as modules.
  - **Analytics** holds every report: Student (Students in Programme), Finance
    (Payment History, Discount, Transaction, Outstanding), Admission (Enquiry,
    Application Status), Attendance (by Date, Student %, Faculty %), Assessment (Exam
    Schedule, IA Evaluation) and Employee (Activity Log).
  - **Configuration** holds every master: Student, Finance (the former Finance Core
    and Banking pages, plus Exchange Rates), Academic (Faculty and Campus Master, the
    former Academic Setup pages, plus Skill and Room Management, Programme Level and
    Group), Admission (the enquiry masters),
    Assessment (Fee Clearance, Exam Rules, Question FAQs) and General (Department,
    Designation, Country, Course Level).
- **Each module's dashboard is now under a General section** (Academic, Admission,
  Finance, Assessment). Finance › General also holds Student Statement.
- **Other moves within modules:**
  - **Student:** split into Student Records, Transfers, Approvals and Operations.
    Settings moved to Configuration › Student.
  - **Academic:** gains Events and Announcements (from Student).
  - **Admission:** Enquiry Status and Isbat Enquiry Source join Admission › Enquiry,
    and Online Enquiry and Self-Service Kiosk move to a new Admission › Other section.
  - **Employee:** gains Access Control › Permission Master (from Config).
  - **Assessment:** sections are now General, Assessment Structure, IA Internal
    Assessment, University Exam (UE), Results & Graduation, Resit and Exam Grievances.
- **Finance URLs are full paths now** (`/finance/payment-console`), no longer bare
  slugs (`payment-console`). Both still work.
- **New pages, please register:**
  - **Analytics › Assessment › IA Evaluation Report** (`/assessment/reports/ia-evaluation`):
    events `get` `export`. The Export button is hidden without `export`.
  - **Configuration › General › Course Level Master** (`/config/course-level-master`):
    events `get` `add` `edit` `delete`.
- **Hall Ticket Issuance now has three tabs: Issue, Print and Print All.** Hall Ticket
  Print and Hall Ticket Print All are no longer separate sidebar pages, and their URLs
  redirect to the tabs. Their permissions still matter. Either form works:
  1. **Keep sending the three nodes as today** (the live menu does). The frontend
     folds Print and Print All into Issuance's bag as `hallticketprint.get` /
     `hallticketprint.print` and `hallticketprintall.get` / `hallticketprintall.print`
     (from each node's `get` and `print`), and hides the two from the sidebar. A role
     with only a print page still gets the Hall Ticket link, opening on its tab.
  2. **Send one Hall Ticket Issuance node** with those four scoped keys in its bag,
     next to `get` and `add`. When the bag has them and the two print nodes are
     absent, the frontend uses it as-is.
  Without any print keys, Print and Print All follow `add` (issue).
- **Renamed (v7 names):** UE Theory QP Print → **UE Material Print**
  (`/assessment/university-exam-material-print`); UE Material Print → **UE QP/Booklet
  Print** (`/assessment/university-exam-qp-booklet-print`); Mark Entry UE / Mark Verify
  UE → **Mark Entry — UE** / **Mark Verify — UE**. The sidebar still shows "Mark Entry
  UE" and "Mark Verify UE".
- **Icons:** Attendance by Date `lni lni-bar-chart` → `lni lni-calendar`; Faculty
  Attendance % `lni lni-briefcase` → `lni lni-library`.
- **Removed:** Admission › Records › Receipts and Reports (no page behind them), and
  Admission › ODeL Application, which isn't in v7. The frontend no longer adds it, and
  the page now appears under
  [Pages hidden from the sidebar](#pages-hidden-from-the-sidebar).
- **New section:** [Pages shown under their menu module's address](#pages-shown-under-their-menu-modules-address).
  The menu API sends the same URLs as before.
- **Where the live `/me/menu` (2026-11-26) still differs from this doc:**
  - **Not sent yet:** Academic › ODL Applications (ODL Applications,
    `/academic/odl-applications`, and Payment Reconciliation,
    `/academic/odl-reconciliation`), Admission › Other (Online Enquiry and
    Self-Service Kiosk) and Assessment › University Exam (UE) › UE Practical QBank
    (`/assessment/question-bank-practical`). They show once the response includes them.
  - **Sent elsewhere:** Enquiry Status and Isbat Enquiry Source come under
    Configuration › Admission; v7 puts them in Admission › Enquiry.
  - **Named differently:** Admission › Records › Paid Students
    (`/admission/paid-students`) is sent as "Application Payment Status".

## Changes in the 2026-11-17 version (since 2026-11-11)

- **Added Assessment › Reports › Exam Schedule Report**
  (`/assessment/reports/exam-schedule`, icon `lni lni-bar-chart`), events `get`
  `export`. It's a new **Reports** section at the end of Assessment, after Resit &
  Disputes. **Please register it in the menu API.** Until the response includes it, the
  frontend adds it itself with full permissions, so every role that can open Assessment
  sees it. Once it's registered, the role's own permissions apply. Pending QP Upload and
  Faculty Summary stay hidden.
- **New event key `withdraw`**, used by **Generate Result**. The page was reworked to
  act per programme, semester or batch, and its Withdraw button now checks `withdraw`
  instead of `publish`. Its events are now `get` `generate` `publish` `withdraw`
  `delete`; `edit` (apply moderation) and `export` are no longer used by the page and
  can be dropped from its bag. A missing `generate`, `publish` or `withdraw` key counts
  as allowed, so send `false` to deny one.

## Changes in the 2026-11-11 version (since 2026-11-10)

- **Removed Finance › Reports & Statements › Financial Reports**
  (`/finance/financial-reports`). The page showed fixed sample figures and called no
  API (there was no backend endpoint or page doc for it), so it has been deleted; its
  real equivalents are on the Finance Dashboard (Collection Trends, Outstanding,
  Student clearance). The URL now shows the 404 page. **Please remove it from the menu
  response** (the live `/me/menu` still sends it); until then the frontend strips it
  itself so the sidebar doesn't link to a missing page. Its permissions (View Financial
  Reports, Export Financial Report) can be retired with it. The rest of Reports &
  Statements (Discount, Transaction and Outstanding reports, Student Statement) is
  unchanged.

## Changes in the 2026-11-10 version (since 2026-11-02)

- **Service Tickets moved to Student › Student Services › Service Tickets**
  (`/student/service-tickets`, icon `lni lni-ticket`), with `get` and `edit`. It's a new
  **Student Services** section between Reports and Communications. Please register it
  in the menu API; until then it's hidden and shows Access Denied.
  - It was **Assessment › Student Services › Service Tickets**
    (`/assessment/service-tickets`), hidden from the sidebar since 2026-10-15. That URL
    no longer exists, so remove any registration for it.
  - The frontend no longer hides this page, so it's off the
    [Pages hidden from the sidebar](#pages-hidden-from-the-sidebar) list.
  - Don't name the section `Services`. The frontend drops a Student section with that
    exact name, which belonged to the old hidden Student Services page
    (`/student/services`). That page is still hidden; it's not this one.

## Changes in the 2026-11-02 version (since 2026-10-30)

- **Added Student › Reports › Students in Programme Report**
  (`/student/reports/students-in-programme`, icon `lni lni-bar-chart`), with `get` and
  `export`. It's a new **Reports** section between Operations and Communications.
  Please register it in the menu API; until then it's hidden and shows Access Denied.
  Its APIs check `student.studentsinprogrammereport.get` (preview) and
  `student.studentsinprogrammereport.export` (Excel export). Like the other reports, its
  Export button always shows, and clicking it without `export` shows a "You don't have
  permission…" message. Learning Mode Report stays hidden (see
  [Pages hidden from the sidebar](#pages-hidden-from-the-sidebar)); don't add it to this
  section.
- **My Profile (`/profile`) needs no menu entry.** It now loads the signed-in staff
  member's details from `GET /api/v1/users/employees/me`, but it isn't a menu page: it's
  reached from the header's profile dropdown and is always allowed.

## Changes in the 2026-10-30 version (since 2026-10-21)

- **The frontend no longer adds pages to the menu.** Until now it inserted pages the
  menu API hadn't registered yet (the "until then the frontend adds it" notes below).
  That stopped on 2026-10-28, because it gave every role holding a module or section
  full access to all the added pages. **Please register every page in this doc in the
  menu API**, in particular the ones the older notes below say the frontend was adding:
  Paid Students, Enquiry Report, Application Status Report, Transaction Report,
  Outstanding Report, Mark Verify — UE, and the Lecturer View, Batch View and Time Slot
  Audit timetable pages. Until they are registered they're hidden and show Access
  Denied. The frontend still renames IA Creation → Assessment Scheduler and Timetable →
  Schedule Timetable, and still removes the pages listed under
  [Pages hidden from the sidebar](#pages-hidden-from-the-sidebar).
- **Added the Attendance module** (`lni lni-alarm-clock`, between Student and
  Employee) with **Record Attendance**, **Pending Outlines**, **Attendance
  Sessions**, and a **Reports** section (**Attendance by Date**, **Student Attendance
  %**, **Faculty Attendance %**). The old locked "Attendance · Coming Soon" and "Analytics · Coming Soon"
  rail placeholders are gone.
- **Pages are now blocked, not just hidden.** Opening a menu page the response leaves
  out (or sends with `get: false`) shows Access Denied. A failed menu call grants
  nothing and shows a Retry screen; there is no fallback menu anymore. See
  [How the frontend reads the bag](#how-the-frontend-reads-the-bag).
- **Key aliases.** `add`/`create`, `edit`/`update` and `get`/`view` are now treated as
  the same key, and a missing `approve` falls back to `edit`. Send `"approve": false`
  to deny approving to a role that can edit.
- **Frontend checks updated.** Programme Approval and Employee Approvals now check
  `approve`, Discount Allocation checks `cancel`, and Payment Console, Payment History,
  Student Statement and the Finance and Admission reports now check `print` /
  `export`. NCHE & Guild Payment, Refugee Status, Intake Master and Bulk Intake Edit
  now gate their buttons too. Vetting Desk (`edit`) and Registrar's Desk (`add`) are
  added to the "send both keys" list; Programme Approval, Discount Allocation, Advanced
  Payments and Employee Approvals are off it.
- **Events added** for buttons that exist on the page: Course Allocation `edit`
  (update an allocation), Permission Master `delete` (delete a group) and UE QP/Booklet
  Print `delete` (delete a Practical QP).
- **Hid Academic › Cross-Module › Student Lookup** (`/academic/student-lookup`) from
  the sidebar. The page still exists. Please remove it (and the now-empty Cross-Module
  section) from the menu response; until then the frontend strips it itself.
- **Student Master's Learning Mode key is `learningmode` (lowercase)**, matching what
  the page reads. A camelCase `learningMode` key is ignored.
- **Batch Management's Head Count tab is gone.** Head count is now a column in the one
  batch table. `/academic/batch-summary` redirects to plain `/academic/batch-management`
  (no `?tab=headcount`). The page's events are unchanged.
- **Student Master's Learning Mode row action now raises a change request** instead of
  changing the mode directly. Like Refugee Status, it takes remarks and a required
  supporting document (`POST /students/learning-mode/{studentGuid}/apply`), then opens
  Learning Mode Approval with that student's request in review. The frontend no longer
  calls `PUT /students/learning-mode/{studentGuid}`. The row's `learningmode` key is
  unchanged.

## Changes in the 2026-10-21 version (since 2026-10-19)

- **Academic › Academic Core › Batch Summary** is removed from the menu. It is now
  the **Head Count** tab of **Batch Management** (`/academic/batch-management`),
  with the summary stat tiles on top. Please remove the Batch Summary page from the
  menu API and its permissions. `/academic/batch-summary` only redirects to
  `/academic/batch-management?tab=headcount`, and the frontend drops the leaf if the
  menu still sends it (`removeBatchSummary`).
- **Assessment › Assessment Structure › IA Creation** is renamed **Assessment
  Scheduler** (same URL, `/assessment/ia-creation`, same events). Please rename it in
  the menu API; until then the frontend renames it (`renameIaCreation`).
- Added **Assessment › Mark Entry & Results › Mark Verify — UE**
  (`/assessment/mark-ue-verify`), right after Mark Entry — UE, with `get` `edit`
  `verify`. Please register it in the menu API; until then the frontend adds it.
- Corrected **Mark Entry — UE**'s events to `get` `edit`. It was listed with `verify`,
  but verifying is done on the new Mark Verify — UE page; mark entry only saves marks.

## Changes in the 2026-10-19 version (since 2026-10-15)

- **Academic › Timetable** now has four pages (from the timetable design,
  `timetable-page.md`). Please register them in the menu API; until then the frontend
  renames the existing leaf and adds the other three after it:
  - The existing **Timetable** leaf (`/academic/timetable`) is renamed **Schedule
    Timetable**. Its events are now `get` `add` `edit` `delete`; `import` is no longer
    used (Bulk Import has no API and is shown disabled).
  - Added **Lecturer View** (`/academic/timetable-lecturer`), **Batch View**
    (`/academic/timetable-batch`) and **Time Slot Audit**
    (`/academic/timetable-slot-audit`), each with `get` and `export`.
- Added **Admission › Records › Paid Students** (`/admission/paid-students`), with `get`
  and `print` (reprint the application payment receipt). Please register it in the
  menu API; until then the frontend adds it to the end of the Records section, after
  Application Status Report.

## Changes in the 2026-10-15 version (since 2026-10-09)

- Hid **Assessment › Assessment Structure › Weight Configuration**
  (`/assessment/weight-config`) and **Assessment Schedule** (`/assessment/schedule`),
  and **Assessment › Student Services › Service Tickets**
  (`/assessment/service-tickets`), from the sidebar (2026-10-15). The pages still exist.
  Please remove them from the menu response; until then the frontend strips them
  itself, and drops the now-empty Student Services section.
- Added **Finance › Reports & Statements › Transaction Report**
  (`/finance/reports/transaction`) and **Outstanding Report**
  (`/finance/reports/outstanding`), both with `get` and `export`. Please register them
  in the menu API; until then the frontend adds them to the sidebar itself, after
  Discount Report.
- Application Payment's `print` event now does something: it opens the application
  payment receipt PDF after saving. No change to its events.
- Added **Admission › Enquiry › Enquiry Report** (`/admission/reports/enquiry`), with
  `get` and `export`. Please register it in the menu API; until then the frontend adds
  it to the end of the Enquiry section itself.
- Added **Admission › Records › Application Status Report**
  (`/admission/reports/application-status`), with `get` and `export`. Please register
  it in the menu API; until then the frontend adds it to the end of the Records section.

## Changes in the 2026-10-09 version (since 2026-09-07)

- Module names now match the frontend rails: **Admission, Academic, Finance, Student,
  Employee, Assessment, Config, Activity Log**. The old "Academics", "Admissions" and
  "Administration" groupings are gone.
- Added the full **Student**, **Employee**, **Assessment**, **Config** and
  **Activity Log** trees, which weren't documented before.
- Moved Faculty Master from Academic Core to Config › Organization.
- Removed Lecturer Master, Admission › Settings and Online Preview, and Finance's
  Payment Console Adjustments (now a tab inside Payment Console).
- Added Batch Summary, Course Allocation, Refugee Status, Enquiry Followup Master and
  Enquiry Followup, and everything under Student Operations, Assessment and Config.
- Replaced the generic `add`/`edit`/`delete`/`get` bag on every page with each page's
  real events.
