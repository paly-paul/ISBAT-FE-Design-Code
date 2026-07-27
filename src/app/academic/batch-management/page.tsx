'use client'
import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewBatchModal } from '@/components/modals/academic/NewBatchModal'
import { EditBatchModal } from '@/components/modals/academic/EditBatchModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch, Batch } from '@/hooks/academic/useBatches'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useStreams } from '@/hooks/config/useStreams'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { getSemestersForProgram } from '@/lib/api/academic/semester'

const PAGE_SIZE = 20

// Same 1-based "list position = legacy int id" heuristic used to WRITE
// intProgram/intStream/batchTime on create — applied here in reverse to
// resolve a name for display. Neither direction is a confirmed mapping
// (see the note on Batch in lib/api/academic/batch.ts), so a resolved name
// is a best-effort guess, not verified fact — out-of-range falls back to
// the raw "#N" so a bad guess is at least visible as a guess rather than
// silently showing nothing.
function resolveByPosition<T>(list: T[], intValue: number, label: (item: T) => string): string {
  const item = list[intValue - 1]
  return item ? label(item) : `#${intValue}`
}

export default function Page() {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [page, setPage] = useState(1)
  const [editingBatchGuid, setEditingBatchGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null)

  const { data, isLoading } = useBatches(page, PAGE_SIZE)
  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const createBatch = useCreateBatch()
  const updateBatch  = useUpdateBatch()
  const deleteBatch  = useDeleteBatch()

  const { data: programs = [] }   = useProgramMasters()
  const { data: streams = [] }    = useStreams()
  const { data: batchTimes = [] } = useBatchTimes()

  function programName(intProgram: number) {
    return resolveByPosition(programs, intProgram, p => p.programName)
  }
  function streamName(intStream: number) {
    return resolveByPosition(streams, intStream, s => s.streamName)
  }
  function batchTimeName(batchTime: number) {
    return resolveByPosition(batchTimes, batchTime, b => b.batchTime)
  }

  // Semester is scoped per-programme (no global semester list), so
  // resolving it means: guess this row's programGuid from intProgram, fetch
  // that programme's semester list, then apply the same position guess a
  // second time within it — two compounded guesses, weaker than the other
  // three columns. Only fetched for the distinct programGuids actually
  // present on the current page.
  const programGuidsOnPage = useMemo(() => {
    const guids = rows.map(r => programs[r.intProgram - 1]?.programGuid).filter((g): g is string => !!g)
    return Array.from(new Set(guids))
  }, [rows, programs])

  const semesterQueries = useQueries({
    queries: programGuidsOnPage.map(programGuid => ({
      queryKey: ['semesters', 'forProgram', programGuid],
      queryFn: () => getSemestersForProgram(programGuid),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const semestersByProgram = useMemo(() => {
    const map: Record<string, { semesterGuid: string; semName: string }[]> = {}
    programGuidsOnPage.forEach((guid, i) => { map[guid] = semesterQueries[i]?.data ?? [] })
    return map
  }, [programGuidsOnPage, semesterQueries])

  function semesterName(intProgram: number, intSem: number) {
    const programGuid = programs[intProgram - 1]?.programGuid
    if (!programGuid) return `#${intSem}`
    return resolveByPosition(semestersByProgram[programGuid] ?? [], intSem, s => s.semName)
  }

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('edit-batch-modal')
  }

  function confirmDeleteBatch() {
    if (!deleteTarget) return
    deleteBatch.mutate(deleteTarget.batchGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete batch', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Assign Batch In-Charge</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>
        </div>

        <div className="warn-box mb-[14px]">
          <i className="lni lni-warning"></i> <span>Admissions occur <strong>every semester (twice a year)</strong>. A new batch must be created for each intake. <strong>Specialization</strong> is assigned to the individual student — not the batch. <strong>Batch In-Charges</strong> can view batch reports but have no direct relation to programme courses.</span>
        </div>

        {/* Programme/Semester/Stream/Batch Time names below are resolved by
            list position, not a confirmed id mapping — see resolveByPosition
            above and the note on Batch in lib/api/academic/batch.ts. */}
        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Batches</div><div className="stat-num">{totalCount.toLocaleString()}</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Batches</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Batch Code</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th>Stream</th>
                  <th>Batch Time</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map(r => (
                  <tr key={r.batchGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchGuid)}><i className="lni lni-pencil"></i> Edit</button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>
                      </ActionMenu>
                    </td>
                    <td><span className="font-bold font-mono text-blue">{r.batchCode}</span></td>
                    <td title="Best-effort match by list position, not a confirmed id">{programName(r.intProgram)}</td>
                    <td title="Best-effort match by list position, not a confirmed id">{semesterName(r.intProgram, r.intSem)}</td>
                    <td title="Best-effort match by list position, not a confirmed id">{streamName(r.intStream)}</td>
                    <td title="Best-effort match by list position, not a confirmed id">{batchTimeName(r.batchTime)}</td>
                    <td className="text-sm text-g600">{r.bStartDate ? r.bStartDate.slice(0, 10) : '—'}</td>
                    <td className="text-sm text-g600">{r.bEndDate ? r.bEndDate.slice(0, 10) : '—'}</td>
                    <td><span className={`badge ${r.active ? 'badge-green' : 'badge-grey'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-3" style={{ fontSize: 12.5, color: 'var(--g500)' }}>
              <span>Page {page} of {totalPages} · {totalCount.toLocaleString()} batches</span>
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
      </div>
      <NewBatchModal isOpen={openModals.has('new-batch-modal')} onClose={() => closeModal('new-batch-modal')} showToast={showToast} createBatch={createBatch} />
      <EditBatchModal
        isOpen={openModals.has('edit-batch-modal')}
        onClose={() => closeModal('edit-batch-modal')}
        showToast={showToast}
        batchGuid={editingBatchGuid}
        updateBatch={updateBatch}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.batchCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this batch. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBatch.isPending} onClick={confirmDeleteBatch}>
                <i className="lni lni-trash-can"></i> {deleteBatch.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
