'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { CourseLevelFormModal } from '@/components/modals/config/CourseLevelFormModal'
import { COURSE_LEVELS_KEY, removeCourseLevelRow, useDeleteCourseLevel, CourseLevel } from '@/hooks/config/useCourseLevels'
import { getCourseLevelsPaged } from '@/lib/api/academic/courseLevel'
import { AuthError } from '@/lib/api/client'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

// Course Level Master (erp-docs/pages/identity/course-level-master-page.md):
// the qualifications a designation can name as its minimum qualification.
// Permissions: config.courselevel.get / add / edit / delete.
const PAGE_SIZE = 10
const MIN_SEARCH_CHARS = 1

export default function Page() {
  const permissions = usePagePermissions()
  const queryClient = useQueryClient()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editing, setEditing]       = useState<CourseLevel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CourseLevel | null>(null)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  // Server-paged and sorted by name; search matches anywhere in the name.
  const table = useServerTable({ queryKey: COURSE_LEVELS_KEY, fetchPage: getCourseLevelsPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const deleteLevel = useDeleteCourseLevel()

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEdit(level: CourseLevel) { setEditing(level); openModal('edit-course-level-modal') }
  function openDelete(level: CourseLevel) { setDeleteError(null); setDeleteTarget(level) }
  function closeDelete() { setDeleteTarget(null); setDeleteError(null) }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleteLevel.mutate(target.intLevel, {
      onSuccess: () => { closeDelete(); showToast('Course level deleted successfully', 'success') },
      onError: (err: Error) => {
        const code = err instanceof AuthError ? err.code : undefined
        if (code === 'not_found') {
          removeCourseLevelRow(queryClient, target.intLevel)
          closeDelete()
          showToast('This course level no longer exists.', 'error')
          return
        }
        // course_level_in_use and anything else: keep the row and say why.
        setDeleteError(err.message || 'Failed to delete course level.')
      },
    })
  }

  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows
  const canRowAct = permissions.edit || permissions.delete

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Course Level Master</div>
            <div className="pg-sub">Qualifications a designation can set as its minimum, such as Bachelors or Masters</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-course-level-modal')}>
              <i className="lni lni-plus"></i> Add Course Level
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Course Levels</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: String(r.intLevel), primary: r.levelName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={res => { const row = rows.find(x => String(x.intLevel) === res.id); if (row && permissions.edit) openEdit(row) }}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  {canRowAct && <th style={{ width: 48 }}></th>}
                  <th style={{ width: 64 }}>#</th>
                  <th>Course Level</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!table.term} onClearFilters={() => setSearch('')} />
                    : null}
                {pageItems.map((r, i) => (
                  <tr key={r.intLevel}>
                    {canRowAct && (
                      <td>
                        <ActionMenu>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEdit(r)}><i className="lni lni-pencil"></i> Edit</button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => openDelete(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                        </ActionMenu>
                      </td>
                    )}
                    <td className="font-mono" style={{ color: 'var(--g500)' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td><strong>{r.levelName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="course levels" onPageChange={setPage} />
        </div>
      </div>

      <CourseLevelFormModal
        mode="new"
        isOpen={openModals.has('new-course-level-modal')}
        onClose={() => closeModal('new-course-level-modal')}
        showToast={showToast}
        courseLevel={null}
        onGone={() => {}}
      />
      <CourseLevelFormModal
        mode="edit"
        isOpen={openModals.has('edit-course-level-modal')}
        onClose={() => closeModal('edit-course-level-modal')}
        showToast={showToast}
        courseLevel={editing}
        onGone={level => removeCourseLevelRow(queryClient, level.intLevel)}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.levelName}?</div>
            <div className="perm-delete-sub">
              {deleteError
                ? <span style={{ color: 'var(--red)' }}>{deleteError}</span>
                : <>This course level will be removed from the list. A level that a designation uses as its minimum qualification can&apos;t be deleted.</>}
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={closeDelete}>{deleteError ? 'Close' : 'Cancel'}</button>
              {!deleteError && (
                <button className="btn btn-danger" disabled={deleteLevel.isPending} onClick={confirmDelete}>
                  <i className="lni lni-trash-can"></i> {deleteLevel.isPending ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
