'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewEmployeeModal } from '@/components/modals/employee/NewEmployeeModal'
import { EditEmployeeModal } from '@/components/modals/employee/EditEmployeeModal'
import { AssignEmployeePermissionsModal } from '@/components/modals/employee/AssignEmployeePermissionsModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { EmployeeListItem } from '@/lib/api/employee/employee'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingEmployeeGuid, setEditingEmployeeGuid] = useState<string | null>(null)
  const [assigningPermissionsEmployee, setAssigningPermissionsEmployee] = useState<EmployeeListItem | null>(null)

  function nav(id: string) { router.push('/employee/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(employeeGuid: string) {
    setEditingEmployeeGuid(employeeGuid)
    openModal('edit-employee-modal')
  }

  function openAssignPermissionsModal(employee: EmployeeListItem) {
    setAssigningPermissionsEmployee(employee)
    openModal('assign-employee-permissions-modal')
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  // Previous mock shape (pre GET /api/v1/users/employees integration) — kept
  // for reference until the remaining fields (qualification, specialisation,
  // faculty, designation) are confirmed against the real backend contract.
  // const rows = [
  //   { id: 'EMP-0001', name: 'Dr. Nakimuli Sarah',  email: 'snakimuli@isbatuniversity.ac.ug', qualification: 'PhD', qualDetail: 'PhD Computer Science',    qualSub: 'Makerere University · 2018',         specialisation: 'Machine Learning, Algorithms',     faculty: 'FCT', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
  //   { id: 'EMP-0002', name: 'Prof. Mukasa Charles', email: 'cmukasa@isbatuniversity.ac.ug', qualification: "Master's", qualDetail: 'PhD Business Administration', qualSub: 'University of Cape Town · 2012',      specialisation: 'Strategic Management, Finance',    faculty: 'FBM', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
  //   { id: 'EMP-0003', name: 'Dr. Tendo Patrick',   email: 'ptendo@isbatuniversity.ac.ug',  qualification: 'PhD', qualDetail: 'PhD Civil Engineering',     qualSub: 'Kyambogo University · 2016',         specialisation: 'Structural Design, Geotechnics',   faculty: 'FEN', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
  //   { id: 'EMP-0004', name: 'Ms. Acen Lillian',    email: 'lacen@isbatuniversity.ac.ug',   qualification: "Master's", qualDetail: 'MSc Information Technology',  qualSub: 'Makerere University · 2021',         specialisation: 'Web Development, Databases',       faculty: 'FCT', designation: 'Lecturer',        statusBadge: 'badge-green', statusLabel: 'Active' },
  //   { id: 'EMP-0005', name: 'Mr. Okello Brian',    email: 'bokello@isbatuniversity.ac.ug', qualification: "Bachelor's", qualDetail: 'MBA Finance',               qualSub: 'Strathmore University · 2020',       specialisation: 'Corporate Finance, Accounting',    faculty: 'FBM', designation: 'Assistant Lecturer', statusBadge: 'badge-amber', statusLabel: 'On Leave' },
  // ]

  // Shaped after GET /api/v1/users/employees ({ data: { items: [...] } }) —
  // employeeGuid is kept as the row key only; shortCode is the
  // user-facing identifier shown in the table. Backed by react-query so a
  // successful create (which invalidates the 'employees' query) refetches
  // the list and the new row shows up here automatically.
  const { data: rows = [], isLoading } = useEmployees()
  // Newest first — employeeGuid isn't sequential, but shortCode's numeric
  // suffix (e.g. 'AD/00121') is assigned in order, so it's the best
  // available proxy for creation order (the API doesn't return a created-date).
  const sortedRows = [...rows].sort((a, b) => {
    const numA = Number(a.shortCode.split('/').pop())
    const numB = Number(b.shortCode.split('/').pop())
    return numB - numA
  })
  const filteredRows = sortedRows.filter(r =>
    Object.entries(filters).every(([k, v]) => {
      if (!v.length) return true
      const cell = k === 'sex' ? (r.sex === 1 ? 'Male' : 'Female')
        : k === 'status' ? (r.isApproved ? 'Approved' : 'Pending')
        : String((r as unknown as Record<string, unknown>)[k])
      return v.includes(cell)
    })
  )

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
          <div><div className="pg-title">Employee Master</div><div className="pg-sub">All employees · Captures qualification details · Linked to Faculty &amp; Course Allocation</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-employee-modal')}><i className="lni lni-plus"></i> Add Employee</button>
        </div>

        <div className="info-box mb-[14px]">
          <i className="lni lni-information"></i> Add the basic identity + qualifications here. Subject expertise (per-unit skills) is captured in <strong>Skill Management</strong> and feeds into Course Allocation.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Employees</div>
            <span className="badge badge-blue"><i className="lni lni-users"></i> {rows.length} total</span>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              {/* Previous header (pre GET /api/v1/users/employees integration) — kept for reference.
              <thead><tr><th style={{ width: 48 }}></th><th>ID</th><th>Name</th>{fth('Highest Qualification', 'qualification', ["PhD", "Master's", "Bachelor's"])}<th>Specialisation</th>{fth('Faculty', 'faculty', ['FCT', 'FBM', 'FEN'])}{fth('Designation', 'designation', ['Senior Lecturer', 'Lecturer', 'Assistant Lecturer', 'Adjunct'])}{fth('Status', 'status', ['Active', 'Inactive'])}</tr></thead>
              */}
              <thead><tr><th style={{ width: 48 }}></th><th>Short Code</th><th>Name</th>{fth('Sex', 'sex', ['Male', 'Female'])}{fth('Status', 'status', ['Approved', 'Pending'])}</tr></thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                    : null}
                {/* Previous row markup (pre GET /api/v1/users/employees integration) — kept for reference.
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('edit-employee-modal')}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono text-b700">{r.id}</td>
                    <td><strong>{r.name}</strong><div className="text-[var(--fs-xs)] text-g500">{r.email}</div></td>
                    <td>{r.qualDetail}<div className="text-[var(--fs-xs)] text-g500">{r.qualSub}</div></td>
                    <td>{r.specialisation}</td>
                    <td>{r.faculty === 'FCT' ? 'Faculty of Computing & Technology' : r.faculty === 'FBM' ? 'Faculty of Business & Management' : 'Faculty of Engineering'}</td>
                    <td><span className="badge badge-blue">{r.designation}</span></td>
                    <td><span className={`badge ${r.statusBadge}`}><span className="bdot"></span>{r.statusLabel}</span></td>
                  </tr>
                ))}
                */}
                {filteredRows.map(r => (
                  <tr key={r.employeeGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.employeeGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => openAssignPermissionsModal(r)}>
                          <i className="lni lni-lock"></i> Assign Permissions
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono text-b700">{r.shortCode}</td>
                    <td><strong>{r.title} {r.firstName} {r.surname}</strong></td>
                    <td>{r.sex === 1 ? 'Male' : 'Female'}</td>
                    <td><span className={`badge ${r.isApproved ? 'badge-green' : 'badge-amber'}`}><span className="bdot"></span>{r.isApproved ? 'Approved' : 'Pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewEmployeeModal isOpen={openModals.has('new-employee-modal')} onClose={() => closeModal('new-employee-modal')} showToast={showToast} />
      <EditEmployeeModal
        isOpen={openModals.has('edit-employee-modal')}
        onClose={() => closeModal('edit-employee-modal')}
        showToast={showToast}
        employeeGuid={editingEmployeeGuid}
      />
      <AssignEmployeePermissionsModal
        isOpen={openModals.has('assign-employee-permissions-modal')}
        onClose={() => closeModal('assign-employee-permissions-modal')}
        showToast={showToast}
        employee={assigningPermissionsEmployee}
      />
      <Toast toast={toast} />
    </>
  )
}
