'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { NewRoomModal } from '@/components/modals/academic/NewRoomModal'
import { EditRoomModal } from '@/components/modals/academic/EditRoomModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const rows = [
    { code: 'RM-FCT-001', description: 'Main Computing Lab',           campus: 'Main Campus — Kampala',  building: 'Block A', capacity: '40', status: 'Active'              },
    { code: 'RM-FCT-002', description: 'Networking & Systems Lab',     campus: 'Main Campus — Kampala',  building: 'Block A', capacity: '30', status: 'Active'              },
    { code: 'RM-FBM-001', description: 'Business Studies Lecture Hall', campus: 'Main Campus — Kampala', building: 'Block B', capacity: '80', status: 'Active'              },
    { code: 'RM-KCC-001', description: 'City Campus Seminar Room',     campus: 'Kampala City Campus',    building: 'Floor 2', capacity: '25', status: 'Under Maintenance'   },
    { code: 'RM-MUK-001', description: 'Mukono Lecture Theatre',       campus: 'Mukono Campus',          building: 'Main Hall', capacity: '120', status: 'Active'           },
    { code: 'RM-FCT-003', description: 'Graphics & Multimedia Lab',    campus: 'Main Campus — Kampala',  building: 'Block C', capacity: '35', status: 'Reserved'            },
    { code: 'RM-FEN-001', description: 'Engineering Workshop',         campus: 'Main Campus — Kampala',  building: 'Block D', capacity: '50', status: 'Inactive'            },
  ]

  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
  )
  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      'Active': 'badge-green',
      'Inactive': 'badge-grey',
      'Under Maintenance': 'badge-amber',
      'Reserved': 'badge-blue',
    }
    return <span className={`badge ${map[status] ?? 'badge-grey'}`}>{status}</span>
  }

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(vals) => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
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
            <div className="pg-title">Room Management</div>
            <div className="pg-sub">Manage rooms and venues for academic scheduling · Linked to campus and building</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-room-modal')}>
            <i className="lni lni-plus"></i> Add Room
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon"><i className="lni lni-home"></i></span>
              Rooms &amp; Venues
            </div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Room Code</th>
                  <th>Room Description</th>
                  {fth('Campus', 'campus', ['Main Campus — Kampala', 'Kampala City Campus', 'Mukono Campus', 'Jinja Campus', 'Online / ODL Hub'])}
                  <th>Building</th>
                  <th>Capacity</th>
                  {fth('Status', 'status', ['Active', 'Inactive', 'Under Maintenance', 'Reserved'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {pageItems.map((r, i) => (
                  <tr key={i}>
                    <td><button className="btn btn-neu btn-sm" onClick={() => openModal('edit-room-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                    <td className="font-mono font-bold text-b700">{r.code}</td>
                    <td>{r.description}</td>
                    <td>{r.campus}</td>
                    <td>{r.building}</td>
                    <td>{r.capacity}</td>
                    <td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="rooms" onPageChange={setPage} />
        </div>
      </div>
      <NewRoomModal  isOpen={openModals.has('new-room-modal')}  onClose={() => closeModal('new-room-modal')}  showToast={showToast} />
      <EditRoomModal isOpen={openModals.has('edit-room-modal')} onClose={() => closeModal('edit-room-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
