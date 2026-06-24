# Prompt Template: Build a New ERP Module from HTML Template

> Copy this prompt, fill in the `[placeholders]`, attach the HTML file, and submit as your first message.

---

```
# Task: Build [Module Name] Module for ISBAT University ERP

## 1. Source of Truth

Attached: `[module_name]_template.html` — the decoded single-file HTML template.

This HTML file IS the design spec. Every page, table, modal, button, badge,
pipeline, stat card, info-box, warning-box, and business rule visible in this
HTML must appear in the final React code. Do not invent UI not in this file.
Do not skip UI that is in this file.

Read the FULL HTML file before writing any code.

## 2. Reference Docs in the Repository

Before starting, read these existing docs for architecture context and patterns:

- `CLAUDE.md` — project commands, route architecture, design system tokens,
  component patterns, CSS variable naming, icon system, font setup
- `docs/ACADEMIC_MODULE_DEVELOPER_GUIDE.md` — complete breakdown of the
  Academic module (the first module built). Use this as the reference for:
  - State management pattern (page.tsx owns all state, passes via PageProps)
  - Sidebar structure (icon rail + collapsible panel sections)
  - Modal system (Set<string> for open modals, backdrop click to close)
  - Toast system (auto-dismiss after 3.5s)
  - File splitting strategy (pages-part1..N + modals.tsx)
  - How buttons should be wired (nav, openModal, showToast)
- `docs/api/04_academic_service_api.md` — API spec format reference. If
  an API spec is needed for the new module, follow this structure.
- `src/app/academic/` — reference implementation. Match the code patterns
  exactly (PageProps interface, sbItem/sbSection helpers, renderPage switch).
- `src/app/globals.css` — the design system. All CSS custom classes are
  defined here. Read this to know what classes exist before writing any code.

## 3. Tech Stack (exact versions)

```json
{
  "next": "^16.2.6",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "tailwindcss": "^3.4.6",
  "@tanstack/react-query": "^5.51.21",
  "zod": "^3.23.8",
  "jose": "^5.6.3",
  "typescript": "^5.5.3",
  "eslint-config-next": "^16.2.6"
}
```

- Next.js 16 App Router with `'use client'` components
- React 18 (not 19 — no `use()` hook, no server actions)
- Tailwind CSS 3.4 for ALL styling (see Section 5)
- All data is hardcoded mock data — no API calls
- `NEXT_PUBLIC_AUTH_MOCK=true` flag pattern from `src/lib/auth.ts`

## 4. Target File Structure

```
src/app/[module-name]/
├── page.tsx                    ← Shell: all state, sidebar, header, toast, modal container
└── components/
    ├── pages-part1.tsx         ← First group of pages (4-5 pages)
    ├── pages-part2.tsx         ← Second group (4-5 pages)
    ├── pages-partN.tsx         ← As many as needed
    └── modals.tsx              ← ModalsContainer with ALL modals
```

## 5. Styling Rules — Tailwind CSS ONLY

### MANDATORY: Use Tailwind CSS for ALL styling

Every visual property MUST be expressed as a Tailwind utility class. This
includes layout, spacing, typography, colors, borders, shadows, and effects.

**DO THIS:**
```tsx
<div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-g400">
```

**DO NOT DO THIS:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11px' }}>
```

### Allowed `style={{}}` exceptions (ONLY these)

1. CSS custom variable overrides that Tailwind cannot express:
   ```tsx
   style={{ '--b700': 'var(--amber)' } as React.CSSProperties}
   ```
2. Dynamic values computed at runtime (rare in mock data):
   ```tsx
   style={{ width: `${percentage}%` }}
   ```

That's it. No other inline styles. Zero.

### Tailwind ↔ Design System mapping

The project's `tailwind.config.ts` maps CSS variables to Tailwind names.
Use these Tailwind classes for the design system colors:

| CSS Variable | Tailwind Class | Use for |
|---|---|---|
| `--g100`…`--g900` | `text-g400`, `bg-g100`, `border-g200` | Greys |
| `--b50`…`--b900` | `text-b700`, `bg-b50`, `border-b200` | Blues (primary) |
| `--green` | `text-clr-green`, `bg-clr-green-bg`, `border-clr-green-bd` | Success |
| `--amber` | `text-clr-amber`, `bg-clr-amber-bg`, `border-clr-amber-bd` | Warning |
| `--red` | `text-clr-red`, `bg-clr-red-bg`, `border-clr-red-bd` | Error |
| `--cyan` | `text-clr-cyan`, `bg-clr-cyan-bg` | Info |
| `--purple` | `text-clr-purple`, `bg-clr-purple-bg` | Special |

Check `tailwind.config.ts` for the full mapping before writing code. If a
color or spacing value doesn't have a Tailwind mapping, ADD it to the config
rather than using inline styles.

### Component CSS classes (from globals.css) — use alongside Tailwind

These semantic component classes are defined in `globals.css` and should be
used as-is. DO NOT recreate them with Tailwind utilities:

- Layout: `.layout`, `.sidebar`, `.main`, `.page`
- Header: `.hdr`, `.hdr-brand`, `.hdr-body`, `.hdr-title`, `.hdr-sub`, `.hdr-right`, `.hdr-module-pill`, `.hdr-avatar`
- Sidebar: `.sb-rail`, `.sb-panel`, `.sb-item`, `.sb-icon`, `.sb-badge`, `.sb-chevron`, `.sb-group-hdr`, `.sb-collapse`
- Rail: `.rail-item`, `.rail-icon`, `.rail-dot`, `.rail-tooltip`, `.rail-divider`
- Page: `.pg-hdr`, `.pg-title`, `.pg-sub`
- Cards: `.card`, `.card-hdr`, `.card-title`, `.ctitle-icon`
- Buttons: `.btn`, `.btn-primary`, `.btn-neu`, `.btn-danger`, `.btn-amber`, `.btn-success`, `.btn-sm`, `.btn-lg`
- Badges: `.badge`, `.badge-blue`, `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-grey`, `.badge-purple`, `.badge-cyan`
- Pills: `.pill`, `.pill-blue`, `.pill-cyan`
- Tables: `.tbl-wrap`, `table`, `.selected-row`, `.flagged`
- Pipeline: `.pipeline`, `.pip-step`, `.pip-circle`, `.pip-line`, `.pip-info`, `.pip-label`, `.pip-desc`
- Stats: `.stat-card`, `.stat-lbl`, `.stat-num`, `.stat-sub`
- Alerts: `.warn-box`, `.info-box`, `.danger-box`, `.success-box`, `.undefined-box`
- Modals: `.modal-overlay`, `.modal`, `.modal-md`, `.modal-lg`, `.modal-hdr`, `.modal-title`, `.modal-footer`
- Forms: `.fg`, `.lbl`, `.ctrl`, `.req`, `.inp-wrap`, `.inp-icon`, `.file-zone`
- Toggles: `.tgl-group`, `.tgl-btn`, `.tgl-active`
- Timeline: `.timeline`, `.tl-item`, `.tl-dot`, `.tl-content`
- Grids: `.g2`, `.g3`, `.g4` (responsive column grids)
- Other: `.sec-divider`, `.bdot`, `.font-bold`, `.text-blue`, `.text-green`, `.text-muted`, `.flex`, `.gap-2`

**Rule of thumb:** If a class exists in `globals.css`, use it. For everything
else (spacing, typography fine-tuning, one-off layouts), use Tailwind utilities.

## 6. HTML → JSX Conversion Rules

| HTML | JSX |
|---|---|
| `class="..."` | `className="..."` |
| `onclick="fn()"` | `onClick={() => fn()}` |
| `style="font-size:12px; color:red"` | Convert to Tailwind: `className="text-xs text-red-500"` |
| `readonly` | `readOnly` |
| `for="id"` | `htmlFor="id"` |
| `<br>`, `<hr>`, `<input ...>` | Self-close: `<br />`, `<hr />`, `<input ... />` |
| `&amp;` | `&amp;` or literal `&` in JSX |
| Apostrophes in text (`Dean's`) | Use `&apos;` or rephrase |
| `<img>` | `<img />` (next/image `no-img-element` rule is disabled) |

Do NOT use `dangerouslySetInnerHTML`.

## 7. State Pattern (copy exactly from Academic module)

```tsx
// page.tsx owns ALL shared state:
const [currentPage, setCurrentPage] = useState('[module]-dashboard')
const [openModals, setOpenModals] = useState<Set<string>>(new Set())
const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

// Functions passed to all pages:
function nav(id: string) {
  setCurrentPage(id)
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}
function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
function closeModal(id: string) {
  setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s })
}
function showToast(msg: string, type = '') {
  setToast({ msg, type })
  setTimeout(() => setToast(null), 3500)
}

// PageProps interface (same in every component file):
interface PageProps {
  nav: (id: string) => void
  openModal: (id: string) => void
  closeModal: (id: string) => void
  showToast: (msg: string, type?: string) => void
  openModals: Set<string>
}
```

## 8. File Splitting Rules

- Maximum **600 lines** per component file (prevents 32K output token limit)
- Split by **logical module grouping**, not arbitrary line count
- Each file re-declares the `PageProps` interface (no shared types file)
- Each file starts with `'use client'`
- Export **named functions**, not default exports (except `page.tsx`)
- `modals.tsx` can go up to ~1100 lines if needed (single file for all modals)

## 9. Button Wiring Rules — NO dead buttons

Every interactive element in the HTML must have a handler. No exceptions.

| Button Type | Required Handler |
|---|---|
| Sidebar nav items | `onClick={() => nav('page-id')}` |
| "New / Add / Create" buttons | `onClick={() => openModal('modal-id')}` |
| Table row "Edit" buttons | `onClick={() => openModal('edit-modal-id')}` |
| Table row "View" buttons | `onClick={() => openModal('view-modal-id')}` or `nav('detail-page')` |
| "Delete / Remove" buttons | `onClick={() => showToast('Confirm delete?', 'warn')}` |
| "Export" buttons | `onClick={() => showToast('Exporting...', 'info')}` |
| "Publish / Confirm" actions | `onClick={() => showToast('Action description', 'success')}` |
| Form "Save / Submit" buttons | `onClick={() => { closeModal('modal-id'); showToast('Saved.', 'success') }}` |
| Navigation links ("← Back") | `onClick={() => nav('previous-page-id')}` |
| Filter dropdowns | `onChange` handlers (at minimum a toast feedback) |

If the HTML has a button, the JSX must have an `onClick`.

## 10. Sidebar Structure

Extract directly from the HTML file:

- **Icon rail** (left 66px column): Module icons, dividers, locked items with "Coming Soon" tooltips
- **Panel** (228px): Collapsible sections using `sbSection()` helper, nav items using `sbItem()` helper
- Copy the `sbItem()` and `sbSection()` helper functions from the Academic module's `page.tsx`

Every page shown in the HTML MUST be:
1. Listed in the sidebar (or documented as a drill-through destination)
2. Handled in the `renderPage()` switch
3. Exported from a component file

## 11. Modal Pattern

```tsx
// In modals.tsx:
interface ModalsProps {
  openModals: Set<string>
  closeModal: (id: string) => void
  showToast: (msg: string, type?: string) => void
  nav: (id: string) => void
}

export function ModalsContainer({ openModals, closeModal, showToast, nav }: ModalsProps) {
  return (
    <>
      {openModals.has('modal-id') && (
        <div className="modal-overlay" onClick={() => closeModal('modal-id')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Title</div>
              <button className="modal-x" onClick={() => closeModal('modal-id')}>&times;</button>
            </div>
            {/* form content using Tailwind for layout */}
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('modal-id')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                closeModal('modal-id')
                showToast('Saved successfully.', 'success')
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

## 12. Delivery Order (strict sequence)

1. **Read** the FULL HTML file. List every page and every modal you find.
   Post the inventory before writing any code.
2. **Read** `CLAUDE.md`, `docs/ACADEMIC_MODULE_DEVELOPER_GUIDE.md`,
   `src/app/globals.css`, and `tailwind.config.ts` for patterns and tokens.
3. **Write `page.tsx`** — shell, sidebar, header, all state, renderPage switch,
   toast, ModalsContainer import. This is the skeleton everything hangs on.
4. **Write component files** (`pages-part1.tsx` through `pages-partN.tsx`)
   in parallel. Each file ≤ 600 lines.
5. **Write `modals.tsx`** — all modals in one file. Must reference modal IDs
   that match the `openModal('id')` calls in the page components.
6. **Run `npm run build`** and fix ALL errors. Common issues:
   - Unescaped `'` in JSX text → use `&apos;`
   - Missing `key` props on mapped elements
   - Import/export mismatches
   - TypeScript type errors
7. **Run `npm run lint`** and fix any errors.
8. **Commit and push** to the designated branch.

## 13. Quality Checklist (verify before reporting done)

- [ ] `npm run build` passes with ZERO errors
- [ ] `npm run lint` passes
- [ ] Every page in the HTML has a matching React component
- [ ] Every modal in the HTML has a matching entry in `modals.tsx`
- [ ] Every sidebar item navigates to the correct page
- [ ] Every button has an `onClick` handler (no dead buttons)
- [ ] ZERO `style={{}}` usage except CSS variable overrides
- [ ] All layout/spacing/typography uses Tailwind utility classes
- [ ] All design system components use `globals.css` classes
- [ ] All data is hardcoded mock data
- [ ] No `display: 'none'` DOM hacks — use `useState<boolean>` for visibility
- [ ] No `document.getElementById` — use React state for all dynamic behavior
- [ ] ESLint `react/no-unescaped-entities` is disabled in `.eslintrc.json`
- [ ] ESLint `@next/next/no-img-element` is disabled in `.eslintrc.json`
```

---

## Quick Reference: Common Tailwind Conversions

| Inline CSS (DON'T) | Tailwind (DO) |
|---|---|
| `fontSize: '11px'` | `text-[11px]` or `text-xs` |
| `fontSize: '12px'` | `text-xs` |
| `fontSize: '12.5px'` | `text-[12.5px]` |
| `fontSize: '14px'` | `text-sm` |
| `fontWeight: 700` | `font-bold` |
| `fontWeight: 800` | `font-extrabold` |
| `textTransform: 'uppercase'` | `uppercase` |
| `letterSpacing: '.08em'` | `tracking-wider` |
| `fontFamily: 'monospace'` | `font-mono` |
| `marginBottom: '8px'` | `mb-2` |
| `marginBottom: '12px'` | `mb-3` |
| `marginBottom: '14px'` | `mb-3.5` |
| `marginBottom: '18px'` | `mb-[18px]` or `mb-4` |
| `padding: '12px'` | `p-3` |
| `padding: '16px'` | `p-4` |
| `padding: '6px 10px'` | `px-2.5 py-1.5` |
| `gap: '8px'` | `gap-2` |
| `gap: '10px'` | `gap-2.5` |
| `gap: '16px'` | `gap-4` |
| `display: 'flex'` | `flex` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `flexDirection: 'column'` | `flex-col` |
| `flexWrap: 'wrap'` | `flex-wrap` |
| `borderRadius: '6px'` | `rounded-md` |
| `borderRadius: 'var(--rsm)'` | `rounded-[var(--rsm)]` |
| `textAlign: 'center'` | `text-center` |
| `opacity: '.7'` | `opacity-70` |
| `color: 'var(--g400)'` | `text-g400` |
| `color: 'var(--b700)'` | `text-b700` |
| `color: 'var(--amber)'` | `text-clr-amber` |
| `background: 'var(--b50)'` | `bg-b50` |
| `background: 'var(--green-bg)'` | `bg-clr-green-bg` |
| `border: '1.5px solid var(--b100)'` | `border-[1.5px] border-b100` |
| `border: '1px solid var(--green-bd)'` | `border border-clr-green-bd` |
| `background: 'linear-gradient(...)'` | `style={{}}` exception — or add to globals.css |
| `background: 'rgba(255,255,255,.15)'` | `bg-white/15` |

---

## Lessons Learned from Academic Module Build

| Problem | Root Cause | Prevention |
|---|---|---|
| Full rewrite after HTML uploaded | Code written without the HTML spec | Attach HTML file in FIRST message |
| 594 inline `style={{}}` objects | No Tailwind enforcement in prompt | Section 5 above — zero tolerance |
| 18 dead buttons (no onClick) | No explicit wiring rules | Section 9 — every button must have a handler |
| Agent hit 32K token limit | Tried to write entire module in one file | Section 8 — max 600 lines per file |
| ESLint build failures | Unescaped apostrophes and img elements | Disable rules upfront in .eslintrc.json |
| DOM hacks (getElementById) | Copied vanilla JS patterns from HTML | Section 13 — use useState for all visibility |
| 10 pages not in sidebar | No requirement to audit sidebar completeness | Section 10 — every page must be accessible |
