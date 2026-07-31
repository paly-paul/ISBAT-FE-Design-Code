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
import { NewReceiptBookModal } from '@/components/modals/finance/NewReceiptBookModal'
import { EditReceiptBookModal } from '@/components/modals/finance/EditReceiptBookModal'
import { useReceiptBooks, useCreateReceiptBook, useUpdateReceiptBook, useDeleteReceiptBook, ReceiptBook } from '@/hooks/finance/useReceiptBooks'
import { STATUS_LABELS, CATEGORY_LABELS, BOOK_CATEGORY_LABELS } from '@/lib/api/finance/receiptBook'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingBook, setEditingBook] = useState<ReceiptBook | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReceiptBook | null>(null)

  const { data: rows = [], isLoading } = useReceiptBooks()
  const createReceiptBook = useCreateReceiptBook()
  const updateReceiptBook = useUpdateReceiptBook()
  const deleteReceiptBook = useDeleteReceiptBook()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(book: ReceiptBook) {
    setEditingBook(book)
    openModal('edit-receipt-book-modal')
  }

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function confirmDeleteReceiptBook() {
    if (!deleteTarget) return
    deleteReceiptBook.mutate(deleteTarget.receiptBookGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Receipt book deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete receipt book', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Receipt Book Master</div>
            <div className="pg-sub">Manage numbered receipt books used for cash, bank, and online payments</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-receipt-book-modal')}>
              <i className="lni lni-plus"></i> Add Receipt Book
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-ticket"></i></span> Receipt Books</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Book Code</th>
                  <th>Prefix</th>
                  <th>Start — End No.</th>
                  <th>Current Receipt</th>
                  <th>Count</th>
                  <th>Category</th>
                  <th>Book Category</th>
                  <th>Copy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.receiptBookGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold uppercase">{r.bookCode}</td>
                    <td className="font-mono uppercase">{r.prefix || <span className="text-g400">—</span>}</td>
                    <td className="font-mono">{r.startNo} — {r.endNo ?? '—'}</td>
                    <td className="font-mono">{r.receipt ?? <span className="text-g400">—</span>}</td>
                    <td>{r.count ?? <span className="text-g400">—</span>}</td>
                    <td>{CATEGORY_LABELS[r.category] ?? <span className="text-g400">—</span>}</td>
                    <td>{r.bookCategory != null ? BOOK_CATEGORY_LABELS[r.bookCategory] : <span className="text-g400">—</span>}</td>
                    <td>{r.copy ?? <span className="text-g400">—</span>}</td>
                    <td>
                      {STATUS_LABELS[r.status] === 'Active'
                        ? <span className="badge badge-green"><i className="lni lni-checkmark"></i> Active</span>
                        : <span className="badge badge-grey">Inactive</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="receipt books" onPageChange={setPage} />
        </div>
      </div>
      <NewReceiptBookModal
        isOpen={openModals.has('new-receipt-book-modal')}
        onClose={() => closeModal('new-receipt-book-modal')}
        showToast={showToast}
        createReceiptBook={createReceiptBook}
      />
      <EditReceiptBookModal
        isOpen={openModals.has('edit-receipt-book-modal')}
        onClose={() => closeModal('edit-receipt-book-modal')}
        showToast={showToast}
        receiptBook={editingBook}
        updateReceiptBook={updateReceiptBook}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.bookCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this receipt book. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteReceiptBook.isPending} onClick={confirmDeleteReceiptBook}>
                <i className="lni lni-trash-can"></i> {deleteReceiptBook.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
