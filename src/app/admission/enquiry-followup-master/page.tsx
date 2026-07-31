'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EnquiryAssignModal } from '@/components/modals/admission/EnquiryAssignModal'
import { NewFollowUpLogModal } from '@/components/modals/admission/NewFollowUpLogModal'
import { useEnquiryFollowUps, useCreateEnquiryFollowUp } from '@/hooks/admission/useEnquiryFollowUps'
import { useUpdateEnquiry } from '@/hooks/admission/useEnquiries'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { usePagination } from '@/hooks/usePagination'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Fetched once at a size large enough to cover the whole list (917 rows in
// the sample data, per useEnquiryFollowUps.ts) so the search box below can
// filter client-side across every follow-up, not just the current server
// page — same approach as batch-management/page.tsx.
const FETCH_ALL_PAGE_SIZE = 1000

function nameBadge(name: string | null, cls: string) {
  if (!name) return <span className="badge badge-grey">—</span>
  return <span className={`badge ${cls}`}>{name}</span>
}

export default function EnquiryFollowupMasterPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [viewingGuid, setViewingGuid] = useState<string | null>(null)

  const { data, isLoading } = useEnquiryFollowUps(1, FETCH_ALL_PAGE_SIZE)
  const allRows = data?.items ?? []
  const updateEnquiry = useUpdateEnquiry()
  const createFollowUp = useCreateEnquiryFollowUp()

  // programName comes back null on every row from the real API — resolve it
  // client-side, same fallback pattern as enquiry-list/page.tsx.
  const { data: programs = [] } = useProgramMasters()
  function resolveProgramName(row: { programGuid: string | null; programName: string | null }) {
    if (row.programName) return row.programName
    if (!row.programGuid) return '—'
    return programs.find(p => p.programGuid === row.programGuid)?.programName ?? '—'
  }

  const filteredRows = allRows.filter(r => {
    if (!search.trim()) return true
    const term = search.trim().toLowerCase()
    return `${r.enquiryCode} ${r.studentName} ${resolveProgramName(r)} ${r.enquiryStatusName ?? ''} ${r.followUpStatusName ?? ''} ${r.enquirySourceName ?? ''}`
      .toLowerCase()
      .includes(term)
  })
  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function openViewModal(guid: string) {
    setViewingGuid(guid)
    openModal('enquiry-assign-modal')
  }

  return (
    <div id="page-enquiry-followup-master">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry Followup Master</h1>
          <p className="text-sm text-g500 mt-0.5">Follow-up status &amp; next contact date across all enquiries</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-list')}><i className="lni lni-arrow-left" /> Back</button>
          {permissions.add && <button className="btn btn-primary" onClick={() => openModal('new-followup-log-modal')}><i className="lni lni-plus" /> Add Follow-up</button>}
        </div>
      </div>

      {/* Only Total Enquiries is wired to real data (totalCount) — the old
          Unallocated/Due Today/High Priority tiles depended on assignedTo
          and priority fields that don't exist on the real
          EnquiryFollowUpListDto, so they're dropped rather than faked. */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-users text-b500" /><span className="text-sm text-g500">Total Follow-ups</span></div>
          <p className="text-2xl font-semibold text-g900">{allRows.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Follow-up Register</h2>
          <div className="relative">
            <i className="lni lni-search-alt absolute left-2.5 top-1/2 -translate-y-1/2 text-g400 text-sm"></i>
            <input className="ctrl pl-8 w-56" placeholder="Search by name, ref, status…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Student Name</th><th>Programme Interest</th><th>Enquiry Status</th><th>Follow-up Status</th><th>Source</th><th>Next Follow-up</th></tr></thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={999} />
                : filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={!!search.trim()} onClearFilters={() => setSearch('')} />
                  : null}
              {pageItems.map(r => (
                <tr key={r.enquiryGuid}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-right" /> Convert</button>
                      {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.enquiryGuid)}><i className="lni lni-eye" /> View</button>}
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.enquiryCode}</td>
                  <td>{r.studentName}</td>
                  <td>{resolveProgramName(r)}</td>
                  <td>{nameBadge(r.enquiryStatusName, 'badge-amber')}</td>
                  <td>{nameBadge(r.followUpStatusName, 'badge-blue')}</td>
                  <td>{nameBadge(r.enquirySourceName, 'badge-grey')}</td>
                  <td className="text-sm text-g600">{r.nextFollowDate ? r.nextFollowDate.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-3" style={{ fontSize: 12.5, color: 'var(--g500)' }}>
            <span>Page {page} of {totalPages} · {totalCount.toLocaleString()} follow-ups</span>
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

      <EnquiryAssignModal
        isOpen={openModals.has('enquiry-assign-modal')}
        onClose={() => closeModal('enquiry-assign-modal')}
        showToast={showToast}
        enquiryGuid={viewingGuid}
        updateEnquiry={updateEnquiry}
      />
      {/* intEnquiry/followUpStatus/followUpMode/enquiryStatus/interestLevel
          are sent as list position, not a confirmed backend id — see the
          note on EnquiryFollowUpInput in lib/api/admission/enquiryFollowUp.ts. */}
      <NewFollowUpLogModal
        isOpen={openModals.has('new-followup-log-modal')}
        onClose={() => closeModal('new-followup-log-modal')}
        showToast={showToast}
        enquiries={allRows}
        createFollowUp={createFollowUp}
      />
      <Toast toast={toast} />
    </div>
  )
}
