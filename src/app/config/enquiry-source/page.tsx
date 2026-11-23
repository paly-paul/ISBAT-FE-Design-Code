'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { getEnquirySourcesPaged } from '@/lib/api/admission/enquirySource'
import { EnquirySourceFormModal } from '@/components/modals/config/EnquirySourceFormModal'
import { ViewEnquirySourceModal } from '@/components/modals/config/ViewEnquirySourceModal'
import { ENQUIRY_SOURCES_KEY, useCreateEnquirySource, useUpdateEnquirySource, useDeleteEnquirySource, EnquirySource } from '@/hooks/admission/useEnquirySources'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingSourceGuid, setEditingSourceGuid] = useState<string | null>(null)
  const [viewingSourceGuid, setViewingSourceGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnquirySource | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: ENQUIRY_SOURCES_KEY, fetchPage: getEnquirySourcesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createEnquirySource = useCreateEnquirySource()
  const updateEnquirySource = useUpdateEnquirySource()
  const deleteEnquirySource = useDeleteEnquirySource()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingSourceGuid(guid)
    openModal('edit-enquiry-source-modal')
  }

  function openViewModal(guid: string) {
    setViewingSourceGuid(guid)
    openModal('view-enquiry-source-modal')
    setSearch('')
  }

  function confirmDeleteEnquirySource() {
    if (!deleteTarget) return
    deleteEnquirySource.mutate(deleteTarget.isbatSourceGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Isbat enquiry source deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete Isbat enquiry source', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Isbat Enquiry Source Master</div>
            <div className="pg-sub">Manage the channels through which admission enquiries originate</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-enquiry-source-modal')}>
              <i className="lni lni-plus"></i> Add Isbat Enquiry Source
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-compass"></i></span> Isbat Enquiry Sources</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.isbatSourceGuid, primary: r.sourceName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(r) => openViewModal(r.id)}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Source Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.isbatSourceGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.isbatSourceGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.isbatSourceGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.sourceName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="enquiry sources" onPageChange={setPage} />
        </div>
      </div>
      <EnquirySourceFormModal
        mode="new"
        isOpen={openModals.has('new-enquiry-source-modal')}
        onClose={() => closeModal('new-enquiry-source-modal')}
        showToast={showToast}
        isbatSourceGuid={null}
        createEnquirySource={createEnquirySource}
        updateEnquirySource={updateEnquirySource}
      />
      <EnquirySourceFormModal
        mode="edit"
        isOpen={openModals.has('edit-enquiry-source-modal')}
        onClose={() => closeModal('edit-enquiry-source-modal')}
        showToast={showToast}
        isbatSourceGuid={editingSourceGuid}
        createEnquirySource={createEnquirySource}
        updateEnquirySource={updateEnquirySource}
      />
      <ViewEnquirySourceModal
        isOpen={openModals.has('view-enquiry-source-modal')}
        onClose={() => closeModal('view-enquiry-source-modal')}
        showToast={showToast}
        isbatSourceGuid={viewingSourceGuid}
        onEdit={() => {
          closeModal('view-enquiry-source-modal')
          openEditModal(viewingSourceGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.sourceName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this Isbat enquiry source. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteEnquirySource.isPending} onClick={confirmDeleteEnquirySource}>
                <i className="lni lni-trash-can"></i> {deleteEnquirySource.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
