'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { EmployeeFormModal, normalizeTitle } from '@/components/modals/employee/EmployeeFormModal'
import { ViewEmployeeModal } from '@/components/modals/employee/ViewEmployeeModal'
import { EmployeePermissionsFormModal } from '@/components/modals/employee/EmployeePermissionsFormModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useEmployeesPaged } from '@/hooks/employee/useEmployees'
import { EmployeeListItem } from '@/lib/api/employee/employee'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
const MIN_SEARCH_CHARS = 2

function EmployeeMasterContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const permissions = usePagePermissions()
  const canAssignPermissions = permissions.assign ?? permissions.edit

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const urlSearch = searchParams.get('search') ?? searchParams.get('q') ?? ''

  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [search, setSearch] = useState(urlSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch)

  const [editingEmployeeGuid, setEditingEmployeeGuid] = useState<string | null>(null)
  const [viewingEmployeeGuid, setViewingEmployeeGuid] = useState<string | null>(null)
  const [assigningPermissionsEmployee, setAssigningPermissionsEmployee] = useState<EmployeeListItem | null>(null)
  const [editingPermissionsEmployee, setEditingPermissionsEmployee] = useState<EmployeeListItem | null>(null)

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(employeeGuid: string) {
    setEditingEmployeeGuid(employeeGuid)
    openModal('edit-employee-modal')
  }

  function openViewModal(employeeGuid: string) {
    setViewingEmployeeGuid(employeeGuid)
    openModal('view-employee-modal')
  }

  function openAssignPermissionsModal(employee: EmployeeListItem) {
    setAssigningPermissionsEmployee(employee)
    openModal('assign-employee-permissions-modal')
  }

  function openEditPermissionsModal(employee: EmployeeListItem) {
    setEditingPermissionsEmployee(employee)
    openModal('edit-employee-permissions-modal')
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  // Sync state if URL search param changes externally
  useEffect(() => {
    setSearch(urlSearch)
    setDebouncedSearch(urlSearch)
  }, [urlSearch])

  // Debounce search input
  useEffect(() => {
    const trimmed = search.trim()
    const t = setTimeout(() => {
      setDebouncedSearch(trimmed)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  // When debounced search changes, sync to URL and reset to page 1
  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') ?? searchParams.get('q') ?? ''
    if (debouncedSearch !== currentUrlSearch) {
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
        params.delete('q')
      } else {
        params.delete('search')
        params.delete('q')
      }
      params.set('page', '1')
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [debouncedSearch, pathname, router, searchParams])

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const { data, isLoading, isFetching } = useEmployeesPaged(page, PAGE_SIZE, debouncedSearch)
  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const searchTrimmed = search.trim()
  const searchPending = searchTrimmed.length >= MIN_SEARCH_CHARS && (debouncedSearch !== searchTrimmed || isFetching)

  const filteredRows = rows.filter(r => Object.entries(filters).every(([k, v]) => {
    if (!v.length) return true
    const cell = k === 'sex' ? (r.sex === 1 ? 'Male' : 'Female')
      : k === 'status' ? (r.isApproved ? 'Approved' : 'Pending')
      : String((r as unknown as Record<string, unknown>)[k])
    return v.includes(cell)
  }))

  const searchMatches = searchTrimmed.length >= MIN_SEARCH_CHARS ? rows.slice(0, 8) : []

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
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Employee Master</div>
          <div className="pg-sub">All employees · Captures qualification details · Linked to Faculty &amp; Course Allocation</div>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch
            className="w-56"
            placeholder="Search by name or code…"
            value={search}
            onChange={setSearch}
            results={searchMatches.map(r => ({ id: r.employeeGuid, primary: r.shortCode, secondary: r.empName }))}
            loading={searchPending}
            minChars={MIN_SEARCH_CHARS}
            onSelect={(r) => openViewModal(r.id)}
          />
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-employee-modal')}>
              <i className="lni lni-plus"></i> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">
            <span className="ctitle-icon"><i className="lni lni-user"></i></span> Employees
          </div>
          <span className="badge badge-blue">
            <i className="lni lni-users"></i> {totalCount} total
          </span>
        </div>
        <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Short Code</th>
                <th>Name</th>
                {fth('Sex', 'sex', ['Male', 'Female'])}
                {fth('Status', 'status', ['Approved', 'Pending'])}
              </tr>
            </thead>
            <tbody>
              {(isLoading || searchPending) ? (
                <TableLoadingState colSpan={999} />
              ) : filteredRows.length === 0 ? (
                <EmptyState
                  colSpan={999}
                  hasFilters={Object.values(filters).some(v => v.length > 0) || !!search}
                  onClearFilters={() => { setFilters({}); setSearch('') }}
                />
              ) : (
                filteredRows.map(r => (
                  <tr key={r.employeeGuid}>
                    <td>
                      {(permissions.edit || canAssignPermissions || true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.employeeGuid)}>
                            <i className="lni lni-eye"></i> View
                          </button>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.employeeGuid)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {canAssignPermissions && (
                            <button className="btn btn-neu btn-sm" onClick={() => openAssignPermissionsModal(r)}>
                              <i className="lni lni-lock"></i> Assign Permissions
                            </button>
                          )}
                          {canAssignPermissions && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditPermissionsModal(r)}>
                              <i className="lni lni-pencil-alt"></i> Edit Permissions
                            </button>
                          )}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono text-b700">{r.shortCode}</td>
                    <td><strong>{normalizeTitle(r.title)} {r.firstName} {r.surname}</strong></td>
                    <td>{r.sex === 1 ? 'Male' : 'Female'}</td>
                    <td>
                      <span className={`badge ${r.isApproved ? 'badge-green' : 'badge-amber'}`}>
                        <span className="bdot"></span>{r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          itemLabel="employees"
          onPageChange={handlePageChange}
        />
      </div>

      <EmployeeFormModal
        mode="new"
        isOpen={openModals.has('new-employee-modal')}
        onClose={() => closeModal('new-employee-modal')}
        showToast={showToast}
        employeeGuid={null}
      />
      <EmployeeFormModal
        mode="edit"
        isOpen={openModals.has('edit-employee-modal')}
        onClose={() => closeModal('edit-employee-modal')}
        showToast={showToast}
        employeeGuid={editingEmployeeGuid}
      />
      <ViewEmployeeModal
        isOpen={openModals.has('view-employee-modal')}
        onClose={() => closeModal('view-employee-modal')}
        showToast={showToast}
        employeeGuid={viewingEmployeeGuid}
        canEdit={permissions.edit}
        onEdit={() => { closeModal('view-employee-modal'); if (viewingEmployeeGuid) openEditModal(viewingEmployeeGuid) }}
      />
      <EmployeePermissionsFormModal
        mode="new"
        isOpen={openModals.has('assign-employee-permissions-modal')}
        onClose={() => closeModal('assign-employee-permissions-modal')}
        showToast={showToast}
        employee={assigningPermissionsEmployee}
      />
      <EmployeePermissionsFormModal
        mode="edit"
        isOpen={openModals.has('edit-employee-permissions-modal')}
        onClose={() => closeModal('edit-employee-permissions-modal')}
        showToast={showToast}
        employee={editingPermissionsEmployee}
      />
      <Toast toast={toast} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<TableLoadingState colSpan={999} />}>
      <EmployeeMasterContent />
    </Suspense>
  )
}
