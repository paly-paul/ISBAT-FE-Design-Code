'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { NewPermissionModal } from '@/components/modals/academic/NewPermissionModal'
import { EditPermissionModal } from '@/components/modals/academic/EditPermissionModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { usePermissionGroups, useCreatePermissionGroup, useUpdatePermissionGroup, PermissionGroup } from '@/hooks/config/usePermissionGroups'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null)
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = usePermissionGroups()
  const sortedRows = [...rows].reverse()
  const createPermissionGroup = useCreatePermissionGroup()
  const updatePermissionGroup = useUpdatePermissionGroup()

  // Live preview shown in the search dropdown as the user types — matches
  // the same group/description test as the table's own search filter below.
  const searchMatches = search.trim()
    ? sortedRows.filter(r => `${r.group} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRows = sortedRows.filter(r =>
    !search.trim() || `${r.group} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(group: PermissionGroup) {
    setEditingGroup(group)
    openModal('edit-permission-modal')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Permission Master</div>
            <div className="pg-sub">Define permission groups and their access scope across the ERP</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-permission-modal')}>
              <i className="lni lni-plus"></i> Add Group
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-lock"></i></span> Permission Groups</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.id, primary: r.group, secondary: r.description }))}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Group Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={3} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={3} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {permissions.edit && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.group}</strong></td>
                    <td className="text-g600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="permission groups" onPageChange={setPage} />
        </div>
      </div>
      <NewPermissionModal
        isOpen={openModals.has('new-permission-modal')}
        onClose={() => closeModal('new-permission-modal')}
        showToast={showToast}
        createPermissionGroup={createPermissionGroup}
      />
      <EditPermissionModal
        isOpen={openModals.has('edit-permission-modal')}
        onClose={() => closeModal('edit-permission-modal')}
        showToast={showToast}
        permissionGroup={editingGroup}
        updatePermissionGroup={updatePermissionGroup}
      />
      <Toast toast={toast} />
    </>
  )
}
