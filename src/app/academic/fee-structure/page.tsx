'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeeStructureModal } from '@/components/modals/academic/FeeStructureModal'
import { Toast } from '@/components/Toast'
import { TableSearch } from '@/components/TableSearch'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

type FeeRecord = {
  id: number
  feeCode: string
  description: string
  programme: string
  programmeCode: string
  intake: string
  currency: string
}

const MOCK_FEES: FeeRecord[] = [
  { id: 1, feeCode: 'FS-LOCAL-001', description: 'BSc. IT Local Students Fee Structure 2026',          programme: 'BSc. Information Technology',     programmeCode: 'BSIT-2025', intake: '20261', currency: 'UGX' },
  { id: 2, feeCode: 'FS-INTL-001',  description: 'BSc. IT International Students Fee Structure 2026', programme: 'BSc. Information Technology',     programmeCode: 'BSIT-2025', intake: '20261', currency: 'USD' },
  { id: 3, feeCode: 'FS-MBA-001',   description: 'MBA Full-Time Fee Structure 2024',                   programme: 'Master of Business Administration', programmeCode: 'MBA-2024',  intake: '20241', currency: 'UGX' },
  { id: 4, feeCode: 'FS-LOCAL-002', description: 'BSc. CS Local Students Fee Structure 2026',          programme: 'BSc. Computer Science',            programmeCode: 'BSCS-2026', intake: '20261', currency: 'UGX' },
  { id: 5, feeCode: 'FS-INTL-002',  description: 'BSc. CS International Students Fee Structure 2026', programme: 'BSc. Computer Science',            programmeCode: 'BSCS-2026', intake: '20261', currency: 'USD' },
  { id: 6, feeCode: 'FS-ODL-001',   description: 'ODL Programme Fee Structure 2026',                   programme: 'ODL — Bachelor of Commerce',       programmeCode: 'BCOM-2025', intake: '20262', currency: 'UGX' },
]

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [records, setRecords] = useState<FeeRecord[]>(MOCK_FEES)
  const [editRecord, setEditRecord] = useState<FeeRecord | null>(null)
  const [search, setSearch] = useState('')

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function deleteRecord(id: number) {
    setRecords(prev => prev.filter(r => r.id !== id))
    showToast('Fee structure removed.', '')
  }

  const searchMatches = search.trim()
    ? records.filter(r => `${r.feeCode} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRecords = records.filter(r =>
    !search.trim() || `${r.feeCode} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase())
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
            <button className="btn btn-neu" onClick={() => showToast('Fee structure duplicated for next intake.', 'success')}>
              <i className="lni lni-files"></i> Clone Last Year
            </button>
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
            results={searchMatches.map(r => ({ id: String(r.id), primary: r.feeCode, secondary: r.description }))}
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
              </tr>
            </thead>
            <tbody>
              {pageItems.map(r => (
                <tr key={r.id}>
                  <td>
                    {(permissions.edit || permissions.delete) && (
                      <ActionMenu>
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => { setEditRecord(r); openModal('edit-fee-structure-modal') }}><i className="lni lni-pencil"></i> Edit</button>}
                        {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => deleteRecord(r.id)}><i className="lni lni-trash-can"></i> Delete</button>}
                      </ActionMenu>
                    )}
                  </td>
                  <td><span className="font-mono text-[var(--b700)] font-semibold">{r.feeCode}</span></td>
                  <td>{r.description}</td>
                  <td>{r.programme}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="fee items" onPageChange={setPage} />
      </div>

      <FeeStructureModal isOpen={openModals.has('new-fee-structure-modal')} onClose={() => closeModal('new-fee-structure-modal')} showToast={showToast} nav={nav} />
      <FeeStructureModal isOpen={openModals.has('edit-fee-structure-modal')} onClose={() => closeModal('edit-fee-structure-modal')} showToast={showToast} nav={nav} mode="edit" editData={editRecord ?? undefined} />
      <Toast toast={toast} />
    </>
  )
}
