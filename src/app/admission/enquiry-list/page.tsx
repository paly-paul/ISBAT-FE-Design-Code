'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EnquiryFormModal } from '@/components/modals/admission/EnquiryFormModal'
import { EnquiryAssignModal } from '@/components/modals/admission/EnquiryAssignModal'
import { useEnquiries, useUpdateEnquiry } from '@/hooks/admission/useEnquiries'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useEnquiryStatuses } from '@/hooks/config/useEnquiryStatuses'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

// enquiryStatusGuid resolves against the real Enquiry Status master
// (useEnquiryStatuses) — same client-side resolution pattern as
// resolveProgramName below, since the enquiry row itself doesn't carry the
// status name.
function statusBadge(statusName: string | undefined) {
  if (!statusName) return <span className="badge badge-grey">—</span>
  return <span className="badge badge-blue">{statusName}</span>
}

// sourceName (from the Enquiry Source master, set via the create form's
// "Enquiry Source" dropdown) is already a real resolved string — no need to
// fall back to the raw enquirySourceGuid.
function sourceBadge(sourceName: string | null) {
  return <span className="badge badge-grey">{sourceName ?? '—'}</span>
}

export default function EnquiryListPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [viewingGuid, setViewingGuid] = useState<string | null>(null)

  const { data, isLoading } = useEnquiries(page, PAGE_SIZE)
  const updateEnquiry = useUpdateEnquiry()
  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // programName comes back null on every row from the real API — resolve it
  // client-side the same way faculty.ts's deanName fallback does.
  const { data: programs = [] } = useProgramMasters()
  function resolveProgramName(row: { programGuid: string | null; programName: string | null }) {
    if (row.programName) return row.programName
    if (!row.programGuid) return '—'
    return programs.find(p => p.programGuid === row.programGuid)?.programName ?? '—'
  }

  const { data: enquiryStatuses = [] } = useEnquiryStatuses()
  function resolveStatusName(enquiryStatusGuid: string | null) {
    if (!enquiryStatusGuid) return undefined
    return enquiryStatuses.find(s => s.enquiryStatusGuid === enquiryStatusGuid)?.enquiryStatusName
  }

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function openViewModal(guid: string) {
    setViewingGuid(guid)
    openModal('enquiry-assign-modal')
  }

  return (
    <div id="page-enquiry-list">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry List</h1>
          <p className="text-sm text-g500 mt-0.5">All enquiries across channels — walk-in, phone, online &amp; kiosk</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/dashboard')}><i className="lni lni-arrow-left" /> Back</button>
          {permissions.add && <button className="btn btn-primary" onClick={() => openModal('enquiry-form-modal')}><i className="lni lni-plus" /> New Enquiry</button>}
        </div>
      </div>

      {/* Only Total Enquiries is wired to real data (totalCount) — the other
          three depend on enquiryStatus's unconfirmed enum values, so they
          stay as placeholder figures until that mapping is confirmed. */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-users text-b500" /><span className="text-sm text-g500">Total Enquiries</span></div>
          <p className="text-2xl font-semibold text-g900">{totalCount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-checkmark text-clr-green" /><span className="text-sm text-g500">Converted</span></div>
          <p className="text-2xl font-semibold text-g900">—</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-timer text-clr-amber" /><span className="text-sm text-g500">Pending Follow-up</span></div>
          <p className="text-2xl font-semibold text-g900">—</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-world text-clr-purple" /><span className="text-sm text-g500">ODL Specific</span></div>
          <p className="text-2xl font-semibold text-g900">—</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Enquiry Register</h2>
          <div className="flex gap-2">
            <input className="ctrl w-52" placeholder="Search enquiries..." />
            <SearchSelect className="w-36" options={['All Channels', 'Walk-in', 'Phone', 'Online', 'Kiosk']} />
            <button className="btn btn-ghost"><i className="lni lni-download" /> Export</button>
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Name</th><th>Phone</th><th>Email</th><th>Programme Interest</th><th>Channel</th><th>Date</th><th>Status</th></tr></thead>
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
                      {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.enquiryGuid)}><i className="lni lni-eye" /> View</button>}
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.enquiryCode}</td>
                  <td>{r.studentName}</td>
                  <td className="text-sm text-g600">{r.mobile}</td>
                  <td className="text-sm text-g600">{r.email}</td>
                  <td>{resolveProgramName(r)}</td>
                  <td>{sourceBadge(r.sourceName)}</td>
                  <td className="text-sm text-g600">{r.enquiryDate.slice(0, 10)}</td>
                  <td>{statusBadge(resolveStatusName(r.enquiryStatusGuid))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-3" style={{ fontSize: 12.5, color: 'var(--g500)' }}>
            <span>Page {page} of {totalPages} · {totalCount.toLocaleString()} enquiries</span>
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

      <EnquiryFormModal isOpen={openModals.has('enquiry-form-modal')} onClose={() => closeModal('enquiry-form-modal')} showToast={showToast} />
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
