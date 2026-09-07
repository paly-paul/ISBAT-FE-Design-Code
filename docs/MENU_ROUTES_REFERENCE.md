# Menu Routes & Icons Reference — for Backend (Menu API)

Companion doc for the permission-driven sidebar menu API (`GET` response with
`{ name, icon, url, permissions, children }` nodes). Below is the same JSON
you sent, with `icon` and `url` filled in for every node.

## Icon format

Icon library: **[LineIcons 4.0](https://lineicons.com/icons)**, loaded via
CDN in `src/app/layout.tsx`. The frontend renders an icon as:

```html
<i class="lni lni-{icon}"></i>
```

The `icon` value below is the **full class string** (`lni lni-calendar`),
not just the LineIcons name — copy it as-is into the `icon` field.

## `url` format

Full path from the app root (e.g. `/config/faculty-master`), not a bare
slug.

---

## Academics

```json
{
  "name": "Academics",
  "icon": null,
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Overview",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/academic/acad-dashboard",
          "permissions": { "get": true },
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
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Bulk Intake Edit",
          "icon": "lni lni-layers",
          "url": "/academic/bulk-intake-edit",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Faculty Master",
          "icon": "lni lni-library",
          "url": "/config/faculty-master",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Lecturer Master",
          "icon": null,
          "url": null,
          "permissions": {},
          "children": []
        },
        {
          "name": "Skill Management",
          "icon": "lni lni-bulb",
          "url": "/academic/skill-master",
          "permissions": {},
          "children": []
        },
        {
          "name": "Batch Management",
          "icon": "lni lni-users",
          "url": "/academic/batch-management",
          "permissions": {},
          "children": []
        },
        {
          "name": "Room Management",
          "icon": "lni lni-home",
          "url": "/academic/room-management",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Session Movement",
          "icon": "lni lni-reload",
          "url": "/academic/session-movement",
          "permissions": {},
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
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Course Units",
          "icon": "lni lni-book",
          "url": "/academic/course-units",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
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
          "name": "Programme Level",
          "icon": "lni lni-layers",
          "url": "/academic/programme-level",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Programme Group",
          "icon": "lni lni-folder",
          "url": "/academic/programme-group",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Programme Master",
          "icon": "lni lni-graduation",
          "url": "/academic/programme-master",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Programme Approval",
          "icon": "lni lni-check-box",
          "url": "/academic/programme-approval",
          "permissions": { "get": true, "approve": true },
          "children": []
        },
        {
          "name": "Fee Structure",
          "icon": "lni lni-dollar",
          "url": "/academic/fee-structure",
          "permissions": {},
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
          "name": "Timetable",
          "icon": "lni lni-calendar",
          "url": "/academic/timetable",
          "permissions": {},
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
          "permissions": {},
          "children": []
        },
        {
          "name": "Payment Reconciliation",
          "icon": "lni lni-credit-cards",
          "url": "/academic/odl-reconciliation",
          "permissions": {},
          "children": []
        }
      ]
    },
    {
      "name": "Cross-Module",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Student Lookup",
          "icon": "lni lni-user",
          "url": "/academic/student-lookup",
          "permissions": {},
          "children": []
        }
      ]
    }
  ]
}
```

---

## Admissions

```json
{
  "name": "Admissions",
  "icon": null,
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Enquiry",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Online Enquiry",
          "icon": "lni lni-display",
          "url": "/admission/online-enquiry",
          "permissions": {},
          "children": []
        },
        {
          "name": "Self-Service Kiosk",
          "icon": "lni lni-tab",
          "url": "/admission/kiosk-enquiry",
          "permissions": {},
          "children": []
        },
        {
          "name": "On-Desk Enquiry",
          "icon": "lni lni-pencil-alt",
          "url": "/admission/ondesk-enquiry",
          "permissions": {},
          "children": []
        },
        {
          "name": "Enquiry List",
          "icon": "lni lni-folder",
          "url": "/admission/enquiry-list",
          "permissions": {},
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
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/admission/dashboard",
          "permissions": {},
          "children": []
        },
        {
          "name": "Application Payment",
          "icon": "lni lni-credit-cards",
          "url": "/admission/payment",
          "permissions": {},
          "children": []
        },
        {
          "name": "Application Filing",
          "icon": "lni lni-pencil-alt",
          "url": "/admission/filing",
          "permissions": {},
          "children": []
        },
        {
          "name": "Vetting Desk",
          "icon": "lni lni-search-alt",
          "url": "/admission/vetting",
          "permissions": {},
          "children": []
        },
        {
          "name": "Registrar's Desk",
          "icon": "lni lni-graduation",
          "url": "/admission/registration",
          "permissions": {},
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
          "permissions": {},
          "children": []
        },
        {
          "name": "Receipts",
          "icon": "lni lni-files",
          "url": null,
          "permissions": {},
          "children": []
        },
        {
          "name": "Reports",
          "icon": "lni lni-bar-chart",
          "url": null,
          "permissions": {},
          "children": []
        }
      ]
    },
    {
      "name": "Settings",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Programmes",
          "icon": null,
          "url": null,
          "permissions": {},
          "children": []
        },
        {
          "name": "Fee Structures",
          "icon": null,
          "url": null,
          "permissions": {},
          "children": []
        }
      ]
    },
    {
      "name": "Online Preview",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "ODel Student Preview",
          "icon": null,
          "url": "/academic/odel-student-preview",
          "permissions": {},
          "children": []
        }
      ]
    }
  ]
}
```

---

## Finance

Not yet implemented on the real backend as of this writing — the frontend currently
falls back to a client-side mock tree for this module (`src/lib/api/users/menu.ts`),
which is where this section was generated from. That fallback's own `url` values are
**bare slugs** (`"payment-console"`, not `"/finance/payment-console"`), confirmed against
a real `/me/menu` response for the modules that *are* already live — worth flagging in
case Finance ends up shipped the same way despite this doc's own full-path convention.
`permissions` below is a placeholder shape (full CRUD on every master page, empty
elsewhere matching this doc's existing convention for non-CRUD workflow pages) — Finance
has no real per-action permission model defined yet either.

"Ledger Adjustments" is currently hidden from the sidebar client-side (no backing
"ledger adjustment" endpoint exists yet) even though it's listed below — the frontend
filters it out of whatever this API returns rather than expecting it to be omitted here.

```json
{
  "name": "Finance",
  "icon": "lni lni-dollar",
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "Payment Collection",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Dashboard",
          "icon": "lni lni-dashboard",
          "url": "/finance/dashboard",
          "permissions": {},
          "children": []
        },
        {
          "name": "Payment Console",
          "icon": "lni lni-credit-cards",
          "url": "/finance/payment-console",
          "permissions": {},
          "children": []
        },
        {
          "name": "Payment Console Adjustments",
          "icon": "lni lni-pencil-alt",
          "url": "/finance/payment-console-adjustments",
          "permissions": {},
          "children": []
        },
        {
          "name": "Payment Refund",
          "icon": "lni lni-reload",
          "url": "/finance/payment-refund",
          "permissions": {},
          "children": []
        },
        {
          "name": "NCHE & Guild Payment",
          "icon": "lni lni-graduation",
          "url": "/finance/nche-guild-payment",
          "permissions": {},
          "children": []
        },
        {
          "name": "Discount Allocation",
          "icon": "lni lni-tag",
          "url": "/finance/discount-allocation",
          "permissions": {},
          "children": []
        },
        {
          "name": "Payment History",
          "icon": "lni lni-bar-chart",
          "url": "/finance/payment-history",
          "permissions": {},
          "children": []
        },
        {
          "name": "Ledger Adjustments",
          "icon": "lni lni-lock",
          "url": "/finance/ledger-adjustments",
          "permissions": {},
          "children": []
        },
        {
          "name": "Exchange Rates",
          "icon": "lni lni-world",
          "url": "/finance/exchange-rates",
          "permissions": {},
          "children": []
        },
        {
          "name": "Advanced Payments",
          "icon": "lni lni-wallet",
          "url": "/finance/advanced-payments",
          "permissions": {},
          "children": []
        }
      ]
    },
    {
      "name": "Finance Core",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Cooperates",
          "icon": "lni lni-handshake",
          "url": "/finance/cooperates",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Discounts",
          "icon": "lni lni-tag",
          "url": "/finance/discounts",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Ledgers",
          "icon": "lni lni-book",
          "url": "/finance/ledgers",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Other Ledgers",
          "icon": "lni lni-book",
          "url": "/finance/ledger-others",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Currency Master",
          "icon": "lni lni-dollar",
          "url": "/finance/currency-master",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Receipt Books",
          "icon": "lni lni-ticket",
          "url": "/finance/receipt-books",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "General Settings",
          "icon": "lni lni-cog",
          "url": "/finance/gen-sets",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        }
      ]
    },
    {
      "name": "Banking",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Banks",
          "icon": "lni lni-coin",
          "url": "/finance/banks",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Bank Branches",
          "icon": "lni lni-map-marker",
          "url": "/finance/bank-branches",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Proc Banks",
          "icon": "lni lni-wallet",
          "url": "/finance/proc-banks",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Proc GL Accounts",
          "icon": "lni lni-calculator",
          "url": "/finance/proc-gl-accounts",
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        }
      ]
    },
    {
      "name": "Reports & Statements",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Financial Reports",
          "icon": "lni lni-bar-chart",
          "url": "/finance/financial-reports",
          "permissions": {},
          "children": []
        },
        {
          "name": "Student Statements",
          "icon": "lni lni-files",
          "url": "/finance/student-statements",
          "permissions": {},
          "children": []
        }
      ]
    }
  ]
}
```

---

## Administration

```json
{
  "name": "Administration",
  "icon": null,
  "url": null,
  "permissions": null,
  "children": [
    {
      "name": "User Management",
      "icon": null,
      "url": null,
      "permissions": null,
      "children": [
        {
          "name": "Employees",
          "icon": "lni lni-user",
          "url": null,
          "permissions": { "add": true, "approve": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Roles",
          "icon": null,
          "url": null,
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Skills",
          "icon": "lni lni-bulb",
          "url": null,
          "permissions": { "add": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Permission Groups",
          "icon": "lni lni-lock",
          "url": "/config/permission-master",
          "permissions": { "add": true, "assign": true, "delete": true, "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Menu",
          "icon": "lni lni-list",
          "url": null,
          "permissions": { "edit": true, "get": true },
          "children": []
        },
        {
          "name": "Audit Log",
          "icon": "lni lni-file-text",
          "url": null,
          "permissions": { "get": true },
          "children": []
        }
      ]
    }
  ]
}
```

---

## Rail (top-level module) icons

| Rail | Icon class |
|---|---|
| Admission | `lni lni-clipboard` |
| Academic | `lni lni-graduation` |
| Finance | `lni lni-dollar` |
| Student | `lni lni-user` |
| Employee | `lni lni-briefcase` |
| Config | `lni lni-cog` |

Assessment and Activity Log rails also exist in the frontend (`Sidebar.tsx`'s
`RAIL_DEFS`) but aren't documented anywhere in this file yet — out of scope for this
pass, flagging so they aren't mistaken for intentionally omitted.
