'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EnquiryAssignModal } from '@/components/modals/admission/EnquiryAssignModal'
import { useEnquiryFollowUpsByAdvisor } from '@/hooks/admission/useEnquiryFollowUps'
import { useUpdateEnquiry } from '@/hooks/admission/useEnquiries'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'

const PAGE_SIZE = 10

function nameBadge(name: string | null, cls: string) {
  if (!name) return <span className="badge badge-grey">—</span>
  return <span className={`badge ${cls}`}>{name}</span>
}

export default function EnquiryFollowupPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [viewingGuid, setViewingGuid] = useState<string | null>(null)

  const { data, isLoading } = useEnquiryFollowUpsByAdvisor(page, PAGE_SIZE)
  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const updateEnquiry = useUpdateEnquiry()

  // programName comes back null on every row from the real API — resolve it
  // client-side, same fallback pattern as enquiry-list/enquiry-followup-master.
  const { data: programs = [] } = useProgramMasters()
  function resolveProgramName(row: { programGuid: string | null; programName: string | null }) {
    if (row.programName) return row.programName
    if (!row.programGuid) return '—'
    return programs.find(p => p.programGuid === row.programGuid)?.programName ?? '—'
  }

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function openViewModal(guid: string) {
    setViewingGuid(guid)
    openModal('enquiry-assign-modal')
  }

  return (
    <div id="page-enquiry-followup">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry Followup</h1>
          <p className="text-sm text-g500 mt-0.5">Track &amp; log follow-ups allocated to staff</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-followup-master')}><i className="lni lni-arrow-left" /> Back to Allocation</button>
        </div>
      </div>

      {/* Only Total Follow-ups is wired to real data (totalCount) — the old
          Overdue/Due Today/Upcoming/Completed tiles depended on a
          client-only status bucket that doesn't exist on the real
          EnquiryFollowUpListDto, so they're dropped rather than faked. */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-users text-b500" /><span className="text-sm text-g500">Total Follow-ups</span></div>
          <p className="text-2xl font-semibold text-g900">{totalCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Allocated Follow-ups</h2>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Student Name</th><th>Programme Interest</th><th>Enquiry Status</th><th>Follow-up Status</th><th>Source</th><th>Next Follow-up</th></tr></thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={999} />
                : rows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                  : null}
              {rows.map(r => (
                <tr key={r.enquiryGuid}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-right" /> Convert</button>
                      <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.enquiryGuid)}><i className="lni lni-eye" /> View</button>
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
      <Toast toast={toast} />
    </div>
  )
}
