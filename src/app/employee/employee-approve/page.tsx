'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { usePagination } from '@/hooks/usePagination'
import { useEmployees } from '@/hooks/employee/useEmployees'

const PAGE_SIZE = 10

interface ConfirmTarget { employeeGuid: string; name: string }
interface SuccessInfo { title: string; subtitle: string }

// Employee Approvals — a trimmed-down view over Employee Master's own list
// (see employee-master/page.tsx), scoped to isApproved === false, with a
// single Approve action per row instead of the full View/Edit/Assign
// ActionMenu. There is no confirmed approve endpoint yet (updateEmployee
// needs the full CreateEmployeeInput payload, which this lightweight list
// row doesn't carry — see employee.ts), so approving here is local-only:
// it just drops the row out of the pending view, same "UI-first prototype"
// convention as the rest of the app. Wire this to a real approve endpoint
// once one exists instead of useUpdateEmployee's full-payload update.
//
// The confirm step reuses bulk-intake-edit's confirm-popup markup/classes
// (confirm-modal-overlay/confirm-modal-pop, modal-hdr-blue) instead of a
// bare window.confirm — same look, just a simpler single-line body since
// there's no field diff to show here. On confirm, the same modal swaps its
// body over to SuccessPopup (same "stay open, swap to success" convention
// as bulk-intake-edit / the academic module's Edit/New modals) instead of
// just closing outright.
export default function Page() {
  const { data: rows = [], isLoading } = useEmployees()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [approvedGuids, setApprovedGuids] = useState<Set<string>>(new Set())
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const pendingRows = rows.filter(r => !r.isApproved && !approvedGuids.has(r.employeeGuid))

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(pendingRows, PAGE_SIZE)

  function confirmApprove() {
    if (!confirmTarget) return
    setApprovedGuids(prev => new Set(prev).add(confirmTarget.employeeGuid))
    showToast(`${confirmTarget.name} approved`, 'ok')
    setSuccessInfo({ title: 'Employee Approved!', subtitle: `${confirmTarget.name} now has access as an active employee.` })
  }

  function closeSuccess() {
    setConfirmTarget(null)
    setSuccessInfo(null)
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Employee Approvals</div><div className="pg-sub">Newly added employee records awaiting approval</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Pending Employees</div>
            <span className="badge badge-amber"><i className="lni lni-alarm-clock"></i> {totalCount} pending</span>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Short Code</th><th>Name</th><th>Sex</th><th>Status</th><th style={{ width: 120 }}></th></tr></thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} title="Nothing to approve" subtitle="Every employee record has been reviewed." />
                    : pageItems.map(r => (
                      <tr key={r.employeeGuid}>
                        <td className="font-mono text-b700">{r.shortCode}</td>
                        <td><strong>{r.title} {r.firstName} {r.surname}</strong></td>
                        <td>{r.sex === 1 ? 'Male' : 'Female'}</td>
                        <td><span className="badge badge-amber"><span className="bdot"></span>Pending</span></td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => setConfirmTarget({ employeeGuid: r.employeeGuid, name: `${r.firstName} ${r.surname}` })}>
                            <i className="lni lni-checkmark"></i> Approve
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="pending employees" onPageChange={setPage} />
        </div>
      </div>

      {confirmTarget && (
        <div className="modal-overlay open confirm-modal-overlay" onClick={successInfo ? undefined : () => setConfirmTarget(null)}>
          <div className="modal modal-sm confirm-modal-pop" onClick={e => e.stopPropagation()}>
            {successInfo ? (
              <SuccessPopup title={successInfo.title} subtitle={successInfo.subtitle} onClose={closeSuccess} />
            ) : (
              <>
                <div className="modal-hdr modal-hdr-blue">
                  <div className="modal-title">Confirm Approval</div>
                  <button className="modal-close" onClick={() => setConfirmTarget(null)}>
                    <i className="lni lni-close"></i>
                  </button>
                </div>
                <div style={{ padding: '18px 20px', fontSize: 13.5, color: 'var(--g700)', lineHeight: 1.6 }}>
                  Approve <strong>{confirmTarget.name}</strong>? They will gain access as an active employee.
                </div>
                <div className="modal-footer">
                  <button className="btn btn-neu" onClick={() => setConfirmTarget(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmApprove}>
                    <i className="lni lni-checkmark"></i> Confirm &amp; Approve
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </>
  )
}
