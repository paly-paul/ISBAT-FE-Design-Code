'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeeStructureModal } from '@/components/modals/academic/FeeStructureModal'
import { Toast } from '@/components/Toast'
import { TableSearch } from '@/components/TableSearch'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { useProgramFeeStructures, ProgramFeeStructureHeader } from '@/hooks/academic/useProgramFeeStructure'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Load enough rows to cover the full list (348+ seen in practice) in one
// request, same "load it all, search/paginate client-side" convention as
// batch-management/employee-master — a search box only makes sense against
// the whole dataset, not whatever 20-row server page happens to be loaded.
const FEE_STRUCTURES_LOAD_SIZE = 1000

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  // Passed straight into FeeStructureModal as editData — the modal now
  // fetches its own real fee lines by feeHdGuid (GET fee-lines/:feeHdGuid),
  // this row supplies the header fields (feeCode, calcType, lef/cef/ace,
  // intakeGuid, etc.) that endpoint doesn't return.
  const [editRecord, setEditRecord] = useState<ProgramFeeStructureHeader | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useProgramFeeStructures(1, FEE_STRUCTURES_LOAD_SIZE)
  const { data: programs = [] } = useProgramMasters()
  const { data: intakes = [] } = useIntakes()

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function programmeFor(programGuid: string) {
    return programs.find(p => p.programGuid === programGuid)
  }
  function intakeCodeFor(intakeGuid: string | null) {
    if (!intakeGuid) return '—'
    const intake = intakes.find(i => i.intakeGuid === intakeGuid)
    return intake ? String(intake.intakeCode) : '—'
  }

  // No delete endpoint is confirmed for this resource yet (only
  // hd/save-complete has been seen) — flagged rather than faked, same
  // convention as AdjustLedgerModal/the Finance "New Deposit" stub. Removing
  // the row from local state here would look like a real delete but
  // silently reappear on the next refetch, which is worse than doing
  // nothing.
  function deleteRecord() {
    showToast("Delete isn't wired to a real endpoint yet.", 'error')
  }

  const records = data?.items ?? []

  const searchMatches = useMemo(
    () => search.trim()
      ? records.filter(r => `${r.feeCode} ${r.feeDesc}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
      : [],
    [records, search],
  )

  const filteredRecords = useMemo(
    () => records.filter(r => !search.trim() || `${r.feeCode} ${r.feeDesc}`.toLowerCase().includes(search.trim().toLowerCase())),
    [records, search],
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRecords, PAGE_SIZE)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Programme Fee Structure</div>
            <div className="pg-sub">Define and manage fee structures per programme · Set fee items, priorities and base currency</div>
          </div>
          <div className="flex gap-2">
            {/* Commented out per request — never wired to a real endpoint,
                only fired a fake success toast. Kept here in case cloning
                gets a real backend implementation later.
            <button className="btn btn-neu" onClick={() => showToast('Fee structure duplicated for next intake.', 'success')}>
              <i className="lni lni-files"></i> Clone Last Year
            </button>
            */}
            {permissions.add && (
              <button className="btn btn-primary" onClick={() => openModal('new-fee-structure-modal')}>
                <i className="lni lni-plus"></i> New Fee Structure
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <TableSearch
            className="w-56"
            placeholder="Search by fee code or description…"
            value={search}
            onChange={setSearch}
            results={searchMatches.map(r => ({ id: r.feeHdGuid, primary: r.feeCode, secondary: r.feeDesc }))}
          />
        </div>

        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Fee Code</th>
                <th>Description</th>
                <th>Programme</th>
                <th>Intake</th>
                <th>Local / Foreign</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={999} />
                : filteredRecords.length === 0
                  ? <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                  : null}
              {pageItems.map(r => {
                const programme = programmeFor(r.programGuid)
                return (
                  <tr key={r.feeHdGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && (
                            <button
                              className="btn btn-neu btn-sm"
                              onClick={() => { setEditRecord(r); openModal('edit-fee-structure-modal') }}
                            ><i className="lni lni-pencil"></i> Edit</button>
                          )}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={deleteRecord}><i className="lni lni-trash-can"></i> Delete</button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><span className="font-mono text-[var(--b700)] font-semibold">{r.feeCode}</span></td>
                    <td>{r.feeDesc}</td>
                    <td>{programme ? `${programme.programName} (${programme.programCode})` : '—'}</td>
                    <td>{intakeCodeFor(r.intakeGuid)}</td>
                    <td><span className={`badge ${r.localOrForeign ? 'badge-blue' : 'badge-grey'}`}>{r.localOrForeign ? 'Foreign' : 'Local'}</span></td>
                    <td><span className={`badge ${r.status ? 'badge-green' : 'badge-grey'}`}>{r.status ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="fee structures" onPageChange={setPage} />
      </div>

      <FeeStructureModal isOpen={openModals.has('new-fee-structure-modal')} onClose={() => closeModal('new-fee-structure-modal')} showToast={showToast} nav={nav} />
      <FeeStructureModal isOpen={openModals.has('edit-fee-structure-modal')} onClose={() => closeModal('edit-fee-structure-modal')} showToast={showToast} nav={nav} mode="edit" editData={editRecord ?? undefined} />
      <Toast toast={toast} />
    </>
  )
}
