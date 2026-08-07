'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { AddSkillModal } from '@/components/modals/academic/AddSkillModal'
import { EditLecturerSkillModal } from '@/components/modals/academic/EditLecturerSkillModal'
import { useLecturerSkills, useCreateLecturerSkill, useUpdateLecturerSkill, useDeleteLecturerSkill, LecturerSkill } from '@/hooks/academic/useLecturerSkills'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

// Assumed reading of the wire's bare proficiency int — see the gotcha note
// on LecturerSkill in lib/api/users/skills.ts.
const PROFICIENCY_LABELS: Record<number, string> = { 1: 'Familiar', 2: 'Proficient', 3: 'Expert' }

function approvalBadge(status: string) {
  if (status === 'Approved') return <span className="badge badge-green"><i className="lni lni-checkmark"></i> Approved</span>
  if (status === 'Rejected') return <span className="badge badge-red"><i className="lni lni-close"></i> Rejected</span>
  if (status === 'Pending')  return <span className="badge badge-amber"><i className="lni lni-timer"></i> Pending</span>
  return <span className="badge badge-grey">{status}</span>
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─────────────────────────────────────────────────────────────────────────
   Previous mock shape — kept for reference, not deleted. The old UI grouped
   fictional per-lecturer rows (faculty, eligible subjects, current load,
   check-ins, completion status) that have no equivalent in the real
   GET /api/v1/users/skills response, which is a flat list of individual
   skill entries keyed by a raw intEmployee with no name/faculty attached.
   The lecturer/dean role switcher also relied on matching a mock "current
   user" by name — there's no real endpoint here to resolve "who am I" against
   an intEmployee, so that demo device was dropped along with it.

type Role = 'lecturer' | 'dean'
type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected' | 'Details Requested'

const MOCK_USERS: Record<Role, { name: string; faculty: string }> = {
  lecturer: { name: 'Ms. Namutebi Joyce',   faculty: 'FCT' },
  dean:     { name: 'Dr. Ssekibuule Ronald', faculty: 'FCT' },
}

const BASE_ROWS = [
  { name: 'Dr. Ssekibuule Ronald', faculty: 'FCT', skills: ['Programming', 'Data Structures', 'OS'],        eligible: 8, load: '5 subjects', checkins: 1, completeStatus: 'Complete',   loadBadge: 'badge-green' },
  { name: 'Ms. Namutebi Joyce',    faculty: 'FCT', skills: ['Computer Org.', 'Networks'],                   eligible: 5, load: '6 subjects', checkins: 0, completeStatus: 'Complete',   loadBadge: 'badge-green' },
  { name: 'Dr. Kibira Moses',      faculty: 'FCT', skills: [],                                               eligible: 0, load: 'Unallocated', checkins: 0, completeStatus: 'Incomplete', loadBadge: 'badge-grey'  },
  { name: 'Prof. Mukasa Charles',  faculty: 'FBM', skills: ['Economics', 'Finance Mgmt', 'Strategy'],       eligible: 9, load: '5 subjects', checkins: 2, completeStatus: 'Complete',   loadBadge: 'badge-amber' },
  { name: 'Ms. Atim Grace',        faculty: 'FBM', skills: ['Accounting'],                                  eligible: 2, load: 'Unallocated', checkins: 0, completeStatus: 'Partial',    loadBadge: 'badge-grey'  },
]

const INITIAL_APPROVALS: Record<string, ApprovalStatus> = {
  'Dr. Ssekibuule Ronald': 'Approved',
  'Ms. Namutebi Joyce':    'Pending',
  'Dr. Kibira Moses':      'Pending',
  'Prof. Mukasa Charles':  'Approved',
  'Ms. Atim Grace':        'Details Requested',
}
───────────────────────────────────────────────────────────────────────── */

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch]     = useState('')
  const [filters, setFilters]   = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingSkillGuid, setEditingSkillGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LecturerSkill | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: skills = [], isLoading } = useLecturerSkills()
  const createSkill = useCreateLecturerSkill()
  const updateSkill = useUpdateLecturerSkill()
  const deleteSkill  = useDeleteLecturerSkill()

  function openEditModal(guid: string) {
    setEditingSkillGuid(guid)
    openModal('edit-lecturer-skill-modal')
  }

  function confirmDeleteSkill() {
    if (!deleteTarget) return
    deleteSkill.mutate(deleteTarget.lecturerSkillGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Skill deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete skill', 'error'),
    })
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return skills
      .filter(s => !q || s.skillName.toLowerCase().includes(q) || String(s.intEmployee).includes(q))
      .filter(s => Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((s as unknown as Record<string, unknown>)[k]))))
  }, [skills, search, filters])

  // Live preview shown in the search dropdown as the user types — same
  // code/name test as filteredRows above, just ignoring the column filters
  // and capped to a handful of rows.
  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return skills.filter(s => s.skillName.toLowerCase().includes(q) || String(s.intEmployee).includes(q)).slice(0, 8)
  }, [skills, search])

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  const stats = useMemo(() => ({
    total: skills.length,
    approved: skills.filter(s => s.approvalStatus === 'Approved').length,
    pending: skills.filter(s => s.approvalStatus === 'Pending').length,
    employees: new Set(skills.map(s => s.intEmployee)).size,
  }), [skills])

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
            <div className="pg-title">Lecturer Skill Management</div>
            <div className="pg-sub">Employee skill profiles · Proficiency levels · Dean approval status</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-neu btn-sm" onClick={() => nav('allocation')}>→ Proceed to Allocation</button>
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('add-skill-modal')}><i className="lni lni-plus"></i> Add Skill</button>}
          </div>
        </div>

        {/* <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i>
          <span>Employee is shown as a raw ID — the skills list only returns <code>intEmployee</code>, with no name or faculty attached and no confirmed way to resolve it against the real Employee master.</span>
        </div> */}

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Skills Logged</div><div className="stat-num">{stats.total}</div><div className="stat-sub up">Across all employees</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Approved</div><div className="stat-num text-green">{stats.approved}</div><div className="stat-sub up">Ready for allocation</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Pending Approval</div><div className="stat-num text-amber">{stats.pending}</div><div className="stat-sub warn">Awaiting Dean review</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Employees</div><div className="stat-num text-clr-purple">{stats.employees}</div><div className="stat-sub">With skills logged</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bulb"></i></span> Lecturer Skills</div>
            <TableSearch
              className="w-56"
              placeholder="Search skill or employee ID…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(s => ({ id: s.lecturerSkillGuid, primary: s.skillName || 'Unnamed skill', secondary: `Employee #${s.intEmployee}` }))}
            />
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Employee</th>
                  <th>Skill Name</th>
                  <th>Proficiency</th>
                  {fth('Approval Status', 'approvalStatus', ['Approved', 'Pending', 'Rejected'])}
                  <th>Approved By</th>
                  <th>Approved Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!search || Object.values(filters).some(v => v.length > 0)} onClearFilters={() => { setSearch(''); setFilters({}) }} />
                    : null}
                {pageItems.map(s => (
                  <tr key={s.lecturerSkillGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(s.lecturerSkillGuid)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {permissions.delete && (
                            <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(s)}>
                              <i className="lni lni-trash-can"></i> Delete
                            </button>
                          )}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono text-blue">Employee #{s.intEmployee}</td>
                    <td><strong>{s.skillName || <span className="text-muted">— Unnamed —</span>}</strong></td>
                    <td><span className="pill pill-blue">{PROFICIENCY_LABELS[s.proficiency] ?? `Level ${s.proficiency}`}</span></td>
                    <td>{approvalBadge(s.approvalStatus)}</td>
                    <td className="text-muted">{s.approvedByIntUser ?? '—'}</td>
                    <td className="text-muted">{formatDate(s.approvedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="skills" onPageChange={setPage} />
        </div>
      </div>

      <AddSkillModal
        isOpen={openModals.has('add-skill-modal')}
        onClose={() => closeModal('add-skill-modal')}
        showToast={showToast}
        createSkill={createSkill}
      />
      <EditLecturerSkillModal
        isOpen={openModals.has('edit-lecturer-skill-modal')}
        onClose={() => closeModal('edit-lecturer-skill-modal')}
        showToast={showToast}
        lecturerSkillGuid={editingSkillGuid}
        updateSkill={updateSkill}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete &quot;{deleteTarget.skillName || 'this skill'}&quot;?</div>
            <div className="perm-delete-sub">
              This will permanently delete this skill entry. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteSkill.isPending} onClick={confirmDeleteSkill}>
                <i className="lni lni-trash-can"></i> {deleteSkill.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
