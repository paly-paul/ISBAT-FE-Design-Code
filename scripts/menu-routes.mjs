#!/usr/bin/env node
// Menu-driven addresses: works out each page's address from the menu
// hierarchy (module → section → page name) instead of the code's folders.
//
// Input defaults to menu-response.txt (a saved GET /me/menu response:
// { data: [module, …] }, each node { name, url, children }).

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const [command = 'plan', menuArg = 'menu-response.txt', outArg] = process.argv.slice(2).filter(a => !a.startsWith('--'))

// "NCHE & Guild Payment" → "nche-and-guild-payment",
// "Student Attendance %" → "student-attendance-percent".
export function slugify(name) {
  return name
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')            // "Registrar's Desk" → "registrars-desk"
    .replace(/&/g, ' and ')
    .replace(/%/g, ' percent ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Every leaf page (a node with a url), with the names of its ancestors.
export function menuPages(menu) {
  const pages = []
  ;(function walk(nodes, trail) {
    for (const n of nodes ?? []) {
      const names = [...trail, n.name]
      if (n.url) pages.push({ names, url: normaliseUrl(n.url) })
      walk(n.children, names)
    }
  })(menu, [])
  return pages
}

// Same rules as the app's normalizeHref (usePagePermissions.ts): an absolute
// url is used as-is; a relative one sits under its module's lower-cased name.
function normaliseUrl(url) {
  return '/' + url.trim().replace(/^\/+|\/+$/g, '').toLowerCase()
}

// --no-sections: module + page name only (/analytics/transaction-report)
// instead of module + section + page (/analytics/finance/transaction-report).
const SKIP_SECTIONS = process.argv.includes('--no-sections')

export function hierarchyAddress(names) {
  const parts = SKIP_SECTIONS && names.length > 2 ? [names[0], names[names.length - 1]] : names
  return '/' + parts.map(slugify).join('/')
}

// --module-only: keep each address as it is, except a page now listed under
// a different module, whose first segment becomes that module's
// (/student/announcement-management under Academic → /academic/announcement-management).
const MODULE_ONLY = process.argv.includes('--module-only')

// The app's own folder for each menu module (railId); Configuration is /config.
const MODULE_SEGMENT = { configuration: 'config' }
export function moduleSegment(moduleName) {
  const slug = slugify(moduleName)
  return MODULE_SEGMENT[slug] ?? slug
}

function newAddress(p) {
  if (!MODULE_ONLY) return hierarchyAddress(p.names)
  const [, first, ...rest] = p.url.split('/')
  const target = moduleSegment(p.names[0])
  return first === target ? p.url : '/' + [target, ...rest].join('/')
}

function pageFileFor(url) {
  const base = path.join(ROOT, 'src', 'app', ...url.split('/').filter(Boolean))
  return ['page.tsx', 'page.ts', 'page.jsx'].map(f => path.join(base, f)).find(f => fs.existsSync(f)) ?? null
}

function plan(menuFile, outFile) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, menuFile), 'utf8'))
  const pages = menuPages(raw.data ?? raw).map(p => ({
    ...p,
    address: newAddress(p),
    file: pageFileFor(p.url),
  }))

  const byAddress = new Map()
  for (const p of pages) byAddress.set(p.address, [...(byAddress.get(p.address) ?? []), p])
  const clashes = [...byAddress.values()].filter(list => list.length > 1)
  const byUrl = new Map()
  for (const p of pages) byUrl.set(p.url, [...(byUrl.get(p.url) ?? []), p])
  const sharedScreens = [...byUrl.values()].filter(list => list.length > 1)
  const missing = pages.filter(p => !p.file)
  const oddNames = pages.filter(p => p.names.some(n => slugify(n) === '' || /[^\w\s&%\-/(),.']/.test(n)))
  const unchanged = pages.filter(p => p.address === p.url)

  const rel = f => path.relative(ROOT, f).replace(/\\/g, '/')
  const lines = []
  lines.push('# Menu addresses: review list', '')
  lines.push(`Source: \`${menuFile}\` · ${pages.length} pages · ${pages.length - unchanged.length} change · ${unchanged.length} unchanged`, '')
  lines.push('## Needs a decision', '')
  lines.push(`- **Address clashes** (two pages would get the same address): ${clashes.length}`)
  for (const list of clashes) lines.push(`  - \`${list[0].address}\` ← ${list.map(p => p.names.join(' → ')).join(' | ')}`)
  lines.push(`- **Menu pages with no page file in the code** (no screen to show): ${missing.length}`)
  for (const p of missing) lines.push(`  - ${p.names.join(' → ')} · \`${p.url}\``)
  lines.push(`- **One screen under several menu entries** (each would get its own address): ${sharedScreens.length}`)
  for (const list of sharedScreens) lines.push(`  - \`${list[0].url}\` ← ${list.map(p => p.names.join(' → ')).join(' | ')}`)
  lines.push(`- **Names with unusual characters** (check the slug reads well): ${oddNames.length}`)
  for (const p of oddNames) lines.push(`  - ${p.names.join(' → ')} → \`${p.address}\``)
  lines.push('')

  const modules = [...new Set(pages.map(p => p.names[0]))]
  for (const m of modules) {
    const list = pages.filter(p => p.names[0] === m)
    lines.push(`## ${m} (${list.length})`, '')
    lines.push('| Menu path | Address today | New address | Page file |', '|---|---|---|---|')
    for (const p of list) {
      lines.push(`| ${p.names.slice(1).join(' → ')} | \`${p.url}\` | \`${p.address}\` | ${p.file ? rel(p.file) : '**missing**'} |`)
    }
    lines.push('')
  }

  const out = outFile ? path.resolve(ROOT, outFile) : null
  if (out) fs.writeFileSync(out, lines.join('\n'))
  console.log(`pages ${pages.length} · change ${pages.length - unchanged.length} · clashes ${clashes.length} · missing files ${missing.length} · shared screens ${sharedScreens.length} · odd names ${oddNames.length}`)
  if (out) console.log(`review list: ${out}`)
}

// ── generate ────────────────────────────────────────────────────────────────
// For every page the menu lists under a different module than its folder,
// adds a one-line route at /<menu module>/<rest of the path> that shows the
// existing page, and writes the old → new table the app reads
// (src/lib/menuRoutes.generated.ts). Existing folders are never moved or
// edited, and the old address keeps working.
//
// A new address that is already taken (by another menu page or a hand-written
// page) falls back to /<menu module>/<slug of the page name>; if that is taken
// too, generation stops and names the pages. Generated files carry MARKER on
// their first line, so a rerun can tell them apart from hand-written ones and
// delete the ones no longer needed.

const MARKER = '// GENERATED by scripts/menu-routes.mjs'
const APP_DIR = path.join(ROOT, 'src', 'app')
const TABLE_FILE = path.join(ROOT, 'src', 'lib', 'menuRoutes.generated.ts')

const routeFile = address => path.join(APP_DIR, ...address.split('/').filter(Boolean), 'page.tsx')
const isGenerated = file => fs.existsSync(file) && fs.readFileSync(file, 'utf8').startsWith(MARKER)

function findGeneratedPages(dir = APP_DIR, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findGeneratedPages(full, found)
    else if (entry.name === 'page.tsx' && isGenerated(full)) found.push(full)
  }
  return found
}

function removeEmptyDirs(dir) {
  while (dir.startsWith(APP_DIR) && dir !== APP_DIR && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir)
    dir = path.dirname(dir)
  }
}

function generate(menuFile) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, menuFile), 'utf8'))
  const pages = menuPages(raw.data ?? raw)
  const menuUrls = new Set(pages.map(p => p.url))
  const problems = []

  const moves = []
  const taken = new Map()   // address → what claims it
  for (const p of pages) {
    const [, first, ...rest] = p.url.split('/')
    const target = moduleSegment(p.names[0])
    if (first === target) continue
    if (!pageFileFor(p.url)) { problems.push(`No page file for ${p.names.join(' → ')} (${p.url}).`); continue }

    const free = a => !menuUrls.has(a) && !taken.has(a) && (!fs.existsSync(routeFile(a)) || isGenerated(routeFile(a)))
    const preferred = '/' + [target, ...rest].join('/')
    const fallback = `/${target}/${slugify(p.names[p.names.length - 1])}`
    const address = free(preferred) ? preferred : free(fallback) ? fallback : null
    if (!address) {
      problems.push(`${p.names.join(' → ')} (${p.url}): both ${preferred} and ${fallback} are taken. Rename the page in the menu or add a manual exception.`)
      continue
    }
    taken.set(address, p)
    moves.push({ ...p, address })
  }

  // Every new address needs its module's layout (header + sidebar).
  const missingLayouts = [...new Set(moves.map(m => m.address.split('/')[1]))]
    .filter(seg => !fs.existsSync(path.join(APP_DIR, seg, 'layout.tsx')))
  for (const seg of missingLayouts) problems.push(`No layout for module folder src/app/${seg}/ — add src/app/${seg}/layout.tsx (copy another module's layout).`)

  if (problems.length) {
    console.error('menu-routes: cannot generate:\n  - ' + problems.join('\n  - '))
    process.exit(1)
  }

  // Write the routes, then delete generated ones that are no longer needed.
  const wanted = new Set()
  for (const m of moves) {
    const file = routeFile(m.address)
    wanted.add(path.normalize(file))
    const source = `@/app${m.url}/page`
    const body = [
      MARKER + ' from the saved menu — do not edit.',
      `// Menu: ${m.names.join(' → ')}`,
      `// The page at ${m.url}, at its menu module's address.`,
      `export { default } from '${source}'`,
      '',
    ].join('\n')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== body) fs.writeFileSync(file, body)
  }
  let removed = 0
  for (const file of findGeneratedPages()) {
    if (wanted.has(path.normalize(file))) continue
    fs.unlinkSync(file)
    removeEmptyDirs(path.dirname(file))
    removed++
  }

  const table = [
    MARKER + ' from the saved menu — do not edit.',
    '// Pages the menu lists under a different module than their folder:',
    '// folder address → address under the menu module. See src/lib/menuRoutes.ts.',
    'export const MENU_ROUTE_MOVES: Record<string, string> = {',
    ...moves.map(m => `  '${m.url}': '${m.address}', // ${m.names.join(' → ')}`),
    '}',
    '',
  ].join('\n')
  if (!fs.existsSync(TABLE_FILE) || fs.readFileSync(TABLE_FILE, 'utf8') !== table) fs.writeFileSync(TABLE_FILE, table)

  const fallbacks = moves.filter(m => m.address !== '/' + [moduleSegment(m.names[0]), ...m.url.split('/').slice(2)].join('/'))
  console.log(`menu-routes: ${moves.length} pages at their menu module's address · ${removed} old generated routes removed`)
  for (const m of fallbacks) console.log(`  name-based address (preferred one taken): ${m.url} → ${m.address}`)
}

if (command === 'plan') plan(menuArg, outArg)
else if (command === 'generate') generate(menuArg)
else {
  console.error(`Unknown command "${command}". Usage: node scripts/menu-routes.mjs <plan|generate> [menu.json] [out.md] [--module-only|--no-sections]`)
  process.exit(1)
}
