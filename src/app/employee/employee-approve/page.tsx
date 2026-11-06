'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { usePendingEmployees, useApproveEmployee } from '@/hooks/employee/useEmployees'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { normalizeTitle } from '@/components/modals/employee/EmployeeFormModal'
import { ViewEmployeeModal } from '@/components/modals/employee/ViewEmployeeModal'

const PAGE_SIZE = 10

interface ConfirmTarget { employeeGuid: string; name: string }
interface SuccessInfo { title: string; subtitle: string }

export default function Page() {
  const permissions = usePagePermissions()
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePendingEmployees(page, PAGE_SIZE)
  const approveEmployee = useApproveEmployee()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)
  const [viewingEmployeeGuid, setViewingEmployeeGuid] = useState<string | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pageItems = data?.items ?? []

  function confirmApprove() {
    if (!confirmTarget) return
    approveEmployee.mutate(confirmTarget.employeeGuid, {
      onSuccess: () => setSuccessInfo({ title: 'Employee Approved!', subtitle: `${confirmTarget.name} now has access as an active employee.` }),
      onError: (error: Error) => showToast(error.message || 'Failed to approve employee', 'error'),
    })
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
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Name</th>
                  <th>Sex</th>
                  <th>Status</th>
                  <th style={{ width: 170 }} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} title="Nothing to approve" subtitle="Every employee record has been reviewed." />
                    : pageItems.map(r => (
                      <tr key={r.employeeGuid}>
                        <td className="font-mono text-b700">{r.shortCode}</td>
                        <td><strong>{normalizeTitle(r.title)} {r.firstName} {r.surname}</strong></td>
                        <td>{r.sex === 1 ? 'Male' : 'Female'}</td>
                        <td><span className="badge badge-amber"><span className="bdot"></span>Pending</span></td>
                        <td className="whitespace-nowrap text-right">
                          <button className="btn btn-neu btn-sm mr-2" onClick={() => setViewingEmployeeGuid(r.employeeGuid)}>
                            <i className="lni lni-eye"></i> View
                          </button>
                          {permissions.approve && (
                            <button className="btn btn-primary btn-sm" onClick={() => setConfirmTarget({ employeeGuid: r.employeeGuid, name: `${r.firstName} ${r.surname}` })}>
                              <i className="lni lni-checkmark"></i> Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="pending employees" onPageChange={setPage} />
        </div>
      </div>

      <ViewEmployeeModal
        isOpen={!!viewingEmployeeGuid}
        onClose={() => setViewingEmployeeGuid(null)}
        showToast={showToast}
        employeeGuid={viewingEmployeeGuid}
        canEdit={false}
      />

      {confirmTarget && (
        <div className="modal-overlay open confirm-modal-overlay">
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
                  <button className="btn btn-primary" disabled={approveEmployee.isPending} onClick={confirmApprove}>
                    <i className="lni lni-checkmark"></i> {approveEmployee.isPending ? 'Approving…' : 'Confirm & Approve'}
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
