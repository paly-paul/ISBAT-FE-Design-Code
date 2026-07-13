'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewCampusModal } from '@/components/modals/academic/NewCampusModal'
import { EditCampusModal } from '@/components/modals/academic/EditCampusModal'
import { useCampuses, useCampusDropdown, useCreateCampus, useUpdateCampus, Campus } from '@/hooks/config/useCampuses'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null)

  const { data: rows = [], isLoading } = useCampuses()
  const { data: campusDropdown = [] } = useCampusDropdown()
  const createCampus = useCreateCampus()
  const updateCampus = useUpdateCampus()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(campus: Campus) {
    setEditingCampus(campus)
    openModal('edit-campus-modal')
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const filteredRows = (rows as Campus[]).filter((r: Campus) =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as unknown as Record<string, unknown>)[k])))
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={e => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={vals => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Campus Master</div>
            <div className="pg-sub">Manage university campuses and their contact details</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-campus-modal')}>
            <i className="lni lni-plus"></i> Add Campus
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-home"></i></span> Campuses</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Campus Code</th>
                  {fth('Campus Name', 'campusName', campusDropdown.map(c => c.campusName))}
                  {fth('Location', 'location', ['Kampala', 'Mbarara', 'Gulu'])}
                  <th>Address</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                    : null}
                {/* Previous row markup (pre GET /api/v1/academic/campus integration) —
                    kept for reference. Columns are unchanged; only the row key
                    moved from the old mock `id` to the real API's `campusGuid`.
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.campusCode}</td>
                    <td><strong>{r.campusName}</strong></td>
                    <td>{r.location}</td>
                    <td>{r.address}</td>
                    <td>{r.contact}</td>
                  </tr>
                ))}
                */}
                {filteredRows.map((r) => (
                  <tr key={r.campusGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.campusCode}</td>
                    <td><strong>{r.campusName}</strong></td>
                    <td>{r.location}</td>
                    <td>{r.address}</td>
                    <td>{r.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewCampusModal
        isOpen={openModals.has('new-campus-modal')}
        onClose={() => closeModal('new-campus-modal')}
        showToast={showToast}
        createCampus={createCampus}
      />
      <EditCampusModal
        isOpen={openModals.has('edit-campus-modal')}
        onClose={() => closeModal('edit-campus-modal')}
        showToast={showToast}
        campus={editingCampus}
        updateCampus={updateCampus}
      />
      <Toast toast={toast} />
    </>
  )
}
