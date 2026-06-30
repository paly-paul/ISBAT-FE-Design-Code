'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { NewDepartmentModal } from '@/components/modals/academic/NewDepartmentModal'
import { EditDepartmentModal } from '@/components/modals/academic/EditDepartmentModal'

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active') return <span className="badge-green">{status}</span>
  return <span className="badge-grey">{status}</span>
}

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
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
    { shortCode: 'CS',  deptName: 'Computer Science',        faculty: 'Faculty of Computing',       status: 'Active'   },
    { shortCode: 'IT',  deptName: 'Information Technology',  faculty: 'Faculty of Computing',       status: 'Active'   },
    { shortCode: 'BUS', deptName: 'Business Administration', faculty: 'Faculty of Business',        status: 'Active'   },
    { shortCode: 'ACC', deptName: 'Accounting & Finance',    faculty: 'Faculty of Business',        status: 'Inactive' },
    { shortCode: 'ENG', deptName: 'Civil Engineering',       faculty: 'Faculty of Engineering',     status: 'Active'   },
    { shortCode: 'NUR', deptName: 'Nursing Sciences',        faculty: 'Faculty of Health Sciences', status: 'Active'   },
  ]

  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
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
            <div className="pg-title">Department Master</div>
            <div className="pg-sub">Manage academic departments and their faculty assignments</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-dept-modal')}>
            <i className="lni lni-plus"></i> Add Department
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-apartment"></i></span> Departments</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Short Code</th>
                  <th>Department Name</th>
                  {fth('Faculty', 'faculty', ['Faculty of Computing', 'Faculty of Business', 'Faculty of Engineering', 'Faculty of Health Sciences'])}
                  {fth('Status', 'status', ['Active', 'Inactive'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-dept-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.shortCode}</td>
                    <td><strong>{r.deptName}</strong></td>
                    <td>{r.faculty}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewDepartmentModal  isOpen={openModals.has('new-dept-modal')}  onClose={() => closeModal('new-dept-modal')}  showToast={showToast} />
      <EditDepartmentModal isOpen={openModals.has('edit-dept-modal')} onClose={() => closeModal('edit-dept-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
