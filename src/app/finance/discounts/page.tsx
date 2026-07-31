'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewDiscountModal } from '@/components/modals/finance/NewDiscountModal'
import { EditDiscountModal } from '@/components/modals/finance/EditDiscountModal'
import { useDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount, Discount } from '@/hooks/finance/useDiscounts'
import { CALC_TYPE_LABELS, CALC_TYPE_VALUES } from '@/lib/api/finance/discount'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingDiscountGuid, setEditingDiscountGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null)

  const { data: rows = [], isLoading } = useDiscounts()
  const createDiscount = useCreateDiscount()
  const updateDiscount = useUpdateDiscount()
  const deleteDiscount = useDeleteDiscount()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingDiscountGuid(guid)
    openModal('edit-discount-modal')
  }

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function confirmDeleteDiscount() {
    if (!deleteTarget) return
    deleteDiscount.mutate(deleteTarget.discountGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Discount deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete discount', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Discount Master</div>
            <div className="pg-sub">Manage discounts applied to student fee structures</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-discount-modal')}>
              <i className="lni lni-plus"></i> Add Discount
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-tag"></i></span> Discounts</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Discount Code</th>
                  <th>Discount Name</th>
                  <th>Calculation Type</th>
                  <th>Amount / Percentage</th>
                  <th>Carry Forward</th>
                  <th>COP</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.discountGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                      <ActionMenu>
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.discountGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>}
                        {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>}
                      </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold uppercase">{r.discountCode}</td>
                    <td><strong>{r.discountName}</strong></td>
                    <td>{r.calcType != null ? CALC_TYPE_LABELS[r.calcType] : <span className="text-g400">—</span>}</td>
                    <td>
                      {r.amtPer != null
                        ? r.calcType === CALC_TYPE_VALUES.Percentage ? `${r.amtPer}%` : r.amtPer
                        : <span className="text-g400">—</span>}
                    </td>
                    <td>
                      {r.carry === 1
                        ? <span className="badge badge-green"><i className="lni lni-checkmark"></i> Yes</span>
                        : <span className="badge badge-grey">No</span>
                      }
                    </td>
                    <td>{r.cop ?? <span className="text-g400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="discounts" onPageChange={setPage} />
        </div>
      </div>
      <NewDiscountModal
        isOpen={openModals.has('new-discount-modal')}
        onClose={() => closeModal('new-discount-modal')}
        showToast={showToast}
        createDiscount={createDiscount}
      />
      <EditDiscountModal
        isOpen={openModals.has('edit-discount-modal')}
        onClose={() => closeModal('edit-discount-modal')}
        showToast={showToast}
        discountGuid={editingDiscountGuid}
        updateDiscount={updateDiscount}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.discountName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this discount. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteDiscount.isPending} onClick={confirmDeleteDiscount}>
                <i className="lni lni-trash-can"></i> {deleteDiscount.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
