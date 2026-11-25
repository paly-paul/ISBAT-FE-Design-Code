'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EnquiryFormModal } from '@/components/modals/admission/EnquiryFormModal'
import { EnquiryAssignModal } from '@/components/modals/admission/EnquiryAssignModal'
import type { Enquiry } from '@/hooks/admission/useEnquiries'
import { useEnquiries, useEnquiryCounts, useUpdateEnquiry } from '@/hooks/admission/useEnquiries'
import { useEnquirySourceMastersDropdown } from '@/hooks/admission/useEnquirySourceMasters'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useEnquiryStatusesDropdown } from '@/hooks/config/useEnquiryStatuses'
import { useMenuPagePermissions, usePagePermissions } from '@/hooks/users/usePagePermissions'
import { useCountriesForPicker } from '@/hooks/config/useCountries'
import { formatEnquiryPhone } from '@/lib/api/admission/enquiry'

// Real server-side pagination — only DISPLAY_PAGE_SIZE rows are ever
// requested for the page currently on screen (see useEnquiries), not the
// whole ~11k-row table in one shot. Search, Intake and Status go to the
// server; only the Channel filter below still narrows just the rows already
// on the current page — a deliberate choice over the previous FETCH_SIZE
// = 12000 "fetch everything, filter client-side" approach, which meant a
// much heavier request on every page load.
const DISPLAY_PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

// enquiryStatusGuid resolves against the real Enquiry Status master
// (useEnquiryStatuses) — same client-side resolution pattern as
// resolveProgramName below, since the enquiry row itself doesn't carry the
// status name.
function statusBadge(statusName: string | undefined) {
  if (!statusName) return <span className="badge badge-grey">—</span>
  return <span className="badge badge-blue">{statusName}</span>
}

// Channel shows enquirySourceName (the Enquiry Source master, e.g.
// "Instagram"). The list response no longer carries sourceName at all
// (confirmed live 2026-10-16), so it's only a fallback now.
function sourceBadge(r: Enquiry) {
  return <span className="badge badge-grey">{r.enquirySourceName || r.sourceName || '—'}</span>
}

export default function EnquiryListPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  // Convert hands the enquiry to Application Payment to record its payment,
  // so it's offered only when that page is in the user's menu AND they can
  // add a payment there — otherwise it would land on a page they can't open,
  // or one with no form to submit.
  const paymentPermissions = useMenuPagePermissions('/admission/payment')
  const canConvert = !!paymentPermissions?.add
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [viewingGuid, setViewingGuid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  // Server-side filters (intakeGuid / enquiryStatusGuid on GET /enquiries) —
  // unlike Channel, they narrow the whole dataset and totalCount, so the
  // page count and Next/Previous follow the filtered set. '' = All (param
  // left out).
  const [statusGuid, setStatusGuid] = useState('')
  const [page, setPage] = useState(1)

  const searchTrimmed = search.trim()
  // Server-side search (see getEnquiries) — only actually queried once the
  // term clears MIN_SEARCH_CHARS, same gate TableSearch's own dropdown uses,
  // so a 1-character keystroke doesn't fire a request against the full ~11k
  // row table.
  const activeSearch = searchTrimmed.length >= MIN_SEARCH_CHARS ? searchTrimmed : ''
  const { data, isLoading: loading } = useEnquiries(page, DISPLAY_PAGE_SIZE, activeSearch, statusGuid, intakeGuid)
  const updateEnquiry = useUpdateEnquiry()
  const rows = data?.items ?? []
  // Dial codes for the Phone column (GET /countries/dropdown, cached).
  const { countries } = useCountriesForPicker()
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / DISPLAY_PAGE_SIZE))
  const hasActiveFilters = !!search.trim() || !!channel || !!intakeGuid || !!statusGuid

  // Stats-row summary — GET /api/v1/admissions/enquiries/counts, a separate
  // endpoint from the paginated list above (its own totalCount only ever
  // matches this one's totalCount by coincidence, not by being the same
  // field — both are wired independently). Confirmed to accept
  // intakeGuid/sourceGuid filters, so the cards track whatever's selected in
  // the Intake/Channel dropdowns below instead of always showing unfiltered
  // global totals.
  const { data: counts } = useEnquiryCounts({ intakeGuid: intakeGuid || undefined, sourceGuid: channel || undefined })

  // If programName is missing on any row, resolve it via lightweight dropdown lookup
  const needsProgramLookup = rows.some(r => !r.programName && !!r.programGuid)
  const { data: programs = [] } = useProgramDropdown(undefined, needsProgramLookup)
  function resolveProgramName(row: { programGuid: string | null; programName: string | null }) {
    if (row.programName) return row.programName
    if (!row.programGuid) return '—'
    return programs.find(p => p.programGuid === row.programGuid)?.programName ?? '—'
  }

  // GET /intakes/dropdown — one cached call, filtered in the browser.
  const { data: intakes = [], isLoading: intakesLoading } = useIntakesDropdown()
  const intakeOptions = [
    { value: '', label: 'All Intakes' },
    ...intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })),
  ]

  const { data: enquiryStatuses = [] } = useEnquiryStatusesDropdown()
  function resolveStatusName(enquiryStatusGuid: string | null) {
    if (!enquiryStatusGuid) return undefined
    return enquiryStatuses.find(s => s.enquiryStatusGuid === enquiryStatusGuid)?.enquiryStatusName
  }
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...enquiryStatuses.map(s => ({ value: s.enquiryStatusGuid, label: s.enquiryStatusName })),
  ]

  // `channel` stores the real enquirySourceGuid (not sourceName) so it can
  // double as the counts endpoint's `sourceGuid` filter above. Sourced from
  // the actual Enquiry Source master rather than derived from the
  // currently-loaded rows — with only DISPLAY_PAGE_SIZE rows loaded at a
  // time now (server-side pagination, see above), deriving from rows would
  // make the dropdown miss every channel not present on the current page.
  const { data: enquirySources = [] } = useEnquirySourceMastersDropdown()
  const channelOptions = [
    { value: '', label: 'All Channels' },
    ...enquirySources.map(s => ({ value: s.enquirySourceGuid, label: s.enquirySourceName })),
  ]
  // Search, Intake and Status are applied server-side (see useEnquiries
  // above). Channel stays client-side, narrowing only the current page's own
  // rows — GET /enquiries has no source filter (get-enquiries.md).
  const filteredRows = rows.filter(r => !channel || r.enquirySourceGuid === channel)
  // Rows are already server-paginated (see useEnquiries above) — filteredRows
  // just narrows the current page's own rows, it doesn't page through them
  // again client-side.
  const pageItems = filteredRows
  // Empty below MIN_SEARCH_CHARS, matching TableSearch's own minChars gate on
  // when the dropdown is even allowed to open.
  const searchMatches = searchTrimmed.length >= MIN_SEARCH_CHARS ? filteredRows.slice(0, 8) : []
  function clearFilters() { setSearch(''); setChannel(''); setIntakeGuid(''); setStatusGuid(''); setPage(1) }

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function openViewModal(guid: string) {
    setViewingGuid(guid)
    openModal('enquiry-assign-modal')
    setSearch('')
  }

  return (
    <div id="page-enquiry-list">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry List</h1>
          <p className="text-sm text-g500 mt-0.5">All enquiries across channels — walk-in, phone, online &amp; kiosk</p>
        </div>
        <div className="flex gap-2">
          {/* <button className="btn btn-ghost" onClick={() => router.push('/admission/dashboard')}><i className="lni lni-arrow-left" /> Back</button> */}
          {/* {permissions.add && <button className="btn btn-primary" onClick={() => openModal('enquiry-form-modal')}><i className="lni lni-plus" /> New Enquiry</button>} */}
        </div>
      </div>

      {/* Backed by GET /api/v1/admissions/enquiries/counts — a dedicated
          summary endpoint, independent of the paginated list query, and
          scoped live to the Intake/Channel filters below via
          intakeGuid/sourceGuid. 5 cards now (Closed added) — overrides the
          shared .stats-row's fixed 4-column grid just for this page rather
          than touching the class every other stats-row page relies on
          staying at 4. */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-users text-b500" /><span className="text-sm text-g500">Total Enquiries</span></div>
          <p className="text-2xl font-semibold text-g900">{(counts?.totalCount ?? totalCount).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-checkmark text-clr-green" /><span className="text-sm text-g500">Converted</span></div>
          <p className="text-2xl font-semibold text-g900">{counts ? counts.convertedCount.toLocaleString() : '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-timer text-clr-amber" /><span className="text-sm text-g500">Pending Follow-up</span></div>
          <p className="text-2xl font-semibold text-g900">{counts ? counts.pendingFollowUpCount.toLocaleString() : '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-world text-clr-purple" /><span className="text-sm text-g500">ODL Specific</span></div>
          <p className="text-2xl font-semibold text-g900">{counts ? counts.odelSourceCount.toLocaleString() : '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-close text-clr-red" /><span className="text-sm text-g500">Closed</span></div>
          <p className="text-2xl font-semibold text-g900">{counts ? counts.closedCount.toLocaleString() : '—'}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-g800">Enquiry Register</h2>
            <p className="text-xs text-g400 mt-0.5">{totalCount.toLocaleString()} total</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <TableSearch
              className="w-56"
              placeholder="Search enquiries…"
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              results={searchMatches.map(r => ({ id: r.enquiryGuid, primary: r.enquiryCode, secondary: r.studentName }))}
              minChars={MIN_SEARCH_CHARS}
              // View is edit-gated below (same as the row action) — a picker
              // without edit rights just fills the search box instead, same
              // as TableSearch's own default behavior.
              onSelect={(r) => openViewModal(r.id)}
            />
            <SearchSelect className="w-36" options={channelOptions} value={channel} onChange={v => { setChannel(v); setPage(1) }} />
            <SearchSelect
              className="w-40"
              options={intakeOptions}
              value={intakeGuid}
              onChange={v => { setIntakeGuid(v); setPage(1) }}
              isLoading={intakesLoading}
            />
            <SearchSelect className="w-40" options={statusOptions} value={statusGuid} onChange={v => { setStatusGuid(v); setPage(1) }} />
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Name</th><th>Phone</th><th>Email</th><th>Programme Interest</th><th>Channel</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {loading
                ? <TableLoadingState colSpan={999} />
                : pageItems.length === 0
                  ? <EmptyState colSpan={999} hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
                  : null}
              {pageItems.map(r => (
                <tr key={r.enquiryGuid}>
                  <td>
                    <ActionMenu>
                      {canConvert && <button className="btn btn-neu btn-sm" onClick={() => router.push(`/admission/payment?enquiryGuid=${r.enquiryGuid}`)}><i className="lni lni-arrow-right" /> Convert</button>}
                      <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.enquiryGuid)}><i className="lni lni-eye" /> View</button>
                      {/* No "Verify Email" here any more: email is verified before
                          an enquiry can be created (2026-10), and the per-enquiry
                          verify endpoints were removed. Older unverified rows keep
                          their warning flag in the Email column. */}
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.enquiryCode}</td>
                  <td>{r.studentName}</td>
                  <td className="text-sm text-g600">{formatEnquiryPhone(r, countries)}</td>
                  <td className="text-sm text-g600">
                    {r.email}
                    {r.email && r.emailVerified === true && <span className="eq-email-flag ok" title="Email verified" aria-label="Email verified"><i className="lni lni-checkmark-circle" /></span>}
                    {r.email && r.emailVerified === false && <span className="eq-email-flag no" title="Email not verified" aria-label="Email not verified"><i className="lni lni-warning" /></span>}
                  </td>
                  <td>{resolveProgramName(r)}</td>
                  <td>{sourceBadge(r)}</td>
                  <td className="text-sm text-g600">{r.enquiryDate.slice(0, 10)}</td>
                  <td>{statusBadge(resolveStatusName(r.enquiryStatusGuid))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-3" style={{ fontSize: 12.5, color: 'var(--g500)' }}>
            <span>
              Page {page} of {totalPages} · {totalCount.toLocaleString()} enquiries
              {hasActiveFilters && ` (search/filters only narrow this page's ${rows.length} rows)`}
            </span>
            <div className="flex gap-2">
              <button className="btn btn-neu btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <i className="lni lni-chevron-left" /> Previous
              </button>
              <button className="btn btn-neu btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <i className="lni lni-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {openModals.has('enquiry-form-modal') && (
        <EnquiryFormModal isOpen onClose={() => closeModal('enquiry-form-modal')} showToast={showToast} />
      )}
      {openModals.has('enquiry-assign-modal') && (
        <EnquiryAssignModal
          isOpen
          onClose={() => closeModal('enquiry-assign-modal')}
          canAssign={!!permissions.assign}
          showToast={showToast}
          enquiryGuid={viewingGuid}
          updateEnquiry={updateEnquiry}
        />
      )}
      <Toast toast={toast} />
    </div>
  )
}
