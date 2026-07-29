'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { AddSkillModal } from '@/components/modals/academic/AddSkillModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 10

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

export default function Page() {
  const router = useRouter()
  const [role, setRole]         = useState<Role>('lecturer')
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [approvals, setApprovals] = useState<Record<string, ApprovalStatus>>(INITIAL_APPROVALS)
  const [filters, setFilters]   = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  const currentUser = MOCK_USERS[role]

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function handleApproval(name: string, status: ApprovalStatus) {
    setApprovals(prev => ({ ...prev, [name]: status }))
    const messages: Record<ApprovalStatus, string> = {
      'Approved':          `Skills approved for ${name}.`,
      'Rejected':          `Skills rejected for ${name}.`,
      'Details Requested': `Details requested from ${name}.`,
      'Pending':           `${name} reset to Pending.`,
    }
    showToast(messages[status], status === 'Approved' ? 'success' : '')
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const visibleRows = BASE_ROWS.filter(r => {
    if (role === 'lecturer') return r.name === currentUser.name
    return r.faculty === currentUser.faculty
  }).filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
  )
  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(visibleRows, PAGE_SIZE)

  function approvalBadge(status: ApprovalStatus) {
    if (status === 'Approved')          return <span className="badge badge-green"><i className="lni lni-checkmark"></i> Approved</span>
    if (status === 'Rejected')          return <span className="badge badge-red"><i className="lni lni-close"></i> Rejected</span>
    if (status === 'Details Requested') return <span className="badge badge-blue"><i className="lni lni-question-circle"></i> Details Requested</span>
    return <span className="badge badge-amber"><i className="lni lni-timer"></i> Pending</span>
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
            <div className="pg-title">Skill Management Master</div>
            <div className="pg-sub">
              {role === 'lecturer'
                ? `Your personal skill profile · ${currentUser.name} · Pending Dean approval`
                : `Dean view · ${currentUser.faculty} faculty · Manage and approve lecturer skills`}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => nav('allocation')}>→ Proceed to Allocation</button>
            <button className="btn btn-primary" onClick={() => openModal('add-skill-modal')}><i className="lni lni-plus"></i> Add Skill</button>
          </div>
        </div>

        {/* Demo role switcher */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
          padding: '10px 14px', background: 'var(--gold-bg)', border: '1.5px solid var(--gold-bd)',
          borderRadius: 'var(--rsm)', fontSize: 12.5,
        }}>
          <i className="lni lni-eye" style={{ color: 'var(--gold)', fontSize: 15 }}></i>
          <span style={{ color: 'var(--g600)', fontWeight: 600 }}>Demo — viewing as:</span>
          <div className="tgl-group" style={{ gap: 4 }}>
            <button className={`tgl-btn${role === 'lecturer' ? ' tgl-active' : ''}`} onClick={() => { setRole('lecturer'); setFilters({}) }}>
              <i className="lni lni-user"></i> Lecturer · Ms. Namutebi Joyce
            </button>
            <button className={`tgl-btn${role === 'dean' ? ' tgl-active' : ''}`} onClick={() => { setRole('dean'); setFilters({}) }}>
              <i className="lni lni-apartment"></i> Dean · Dr. Ssekibuule Ronald (FCT)
            </button>
          </div>
        </div>

        {role === 'lecturer' && (
          <div className="warn-box mb-[18px]">
            <i className="lni lni-information"></i>
            <span>You are viewing your own skill profile. Skills you submit will have <strong>Pending</strong> status until approved by your Dean. You can only see and edit your own skills.</span>
          </div>
        )}
        {role === 'dean' && (
          <div className="warn-box mb-[18px]">
            <i className="lni lni-warning"></i>
            <span><strong>Dean View:</strong> You can approve, reject, or request details for skills submitted by lecturers in your faculty. Skills you add on behalf of a lecturer are automatically <strong>Approved</strong>.</span>
          </div>
        )}

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Faculty</div><div className="stat-num">28</div><div className="stat-sub up">Teaching this intake</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Skills Approved</div><div className="stat-num text-clr-green">24</div><div className="stat-sub up">Ready for allocation</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Pending Approval</div><div className="stat-num text-clr-amber">4</div><div className="stat-sub warn">Awaiting Dean review</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Total Skills Logged</div><div className="stat-num text-clr-purple">142</div><div className="stat-sub up">Across all faculty</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon"><i className="lni lni-bulb"></i></span>
              {role === 'lecturer' ? 'My Skill Profile' : 'Faculty Skill Register'}
            </div>
            {role === 'dean' && (
              <div className="flex gap-2">
                <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Faculty</option><option>FCT</option><option>FBM</option><option>FEN</option></select>
                <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Statuses</option><option>Approved</option><option>Pending</option><option>Rejected</option><option>Details Requested</option></select>
                <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
              </div>
            )}
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  {role === 'dean' && <th>Approval Actions</th>}
                  <th style={{ width: 48 }}></th>
                  {role === 'dean' && <th>Faculty Name</th>}
                  {role === 'dean' && fth('Faculty', 'faculty', ['FCT', 'FBM'])}
                  <th>Skills / Subject Areas</th>
                  <th>Eligible Subjects</th>
                  <th>Current Load</th>
                  <th>Check-ins</th>
                  <th>Approval Status</th>
                  {fth('Completion', 'completeStatus', ['Complete', 'Incomplete', 'Partial'])}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {pageItems.map((r, i) => {
                  const approval = approvals[r.name] ?? 'Pending'
                  return (
                    <tr key={i} className={approval === 'Rejected' ? 'flagged' : r.completeStatus === 'Incomplete' ? 'flagged' : ''}>
                      {role === 'dean' && (
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {approval !== 'Approved' && (
                              <button className="btn btn-sm" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-bd)', fontSize: 11 }}
                                onClick={() => handleApproval(r.name, 'Approved')}>
                                <i className="lni lni-checkmark"></i> Approve
                              </button>
                            )}
                            {approval !== 'Rejected' && (
                              <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-bd)', fontSize: 11 }}
                                onClick={() => handleApproval(r.name, 'Rejected')}>
                                <i className="lni lni-close"></i> Reject
                              </button>
                            )}
                            {approval !== 'Details Requested' && (
                              <button className="btn btn-neu btn-sm" style={{ fontSize: 11 }}
                                onClick={() => handleApproval(r.name, 'Details Requested')}>
                                <i className="lni lni-question-circle"></i> Ask for Details
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <ActionMenu>
                          {r.completeStatus === 'Complete'   && <button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> {role === 'dean' ? 'Edit' : 'Edit Skills'}</button>}
                          {r.completeStatus === 'Incomplete' && <button className="btn btn-amber btn-sm" onClick={() => openModal('add-skill-modal')}>Add Skills →</button>}
                          {r.completeStatus === 'Partial'    && <button className="btn btn-amber btn-sm" onClick={() => openModal('skill-edit-modal')}>Update Skills →</button>}
                        </ActionMenu>
                      </td>
                      {role === 'dean' && <td><strong>{r.name}</strong></td>}
                      {role === 'dean' && <td>{r.faculty}</td>}
                      <td>
                        {r.skills.length === 0
                          ? <span className="text-muted">— No skills entered —</span>
                          : <div className="flex gap-1 flex-wrap">{r.skills.map(s => <span key={s} className="pill pill-blue">{s}</span>)}</div>}
                      </td>
                      <td>{r.eligible}</td>
                      <td><span className={`badge ${r.loadBadge}`}>{r.load}</span></td>
                      <td>{r.checkins}</td>
                      <td>{approvalBadge(approval)}</td>
                      <td>
                        {r.completeStatus === 'Complete'   && <span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span>}
                        {r.completeStatus === 'Incomplete' && <span className="badge badge-red"><i className="lni lni-close"></i> Incomplete</span>}
                        {r.completeStatus === 'Partial'    && <span className="badge badge-amber"><i className="lni lni-warning"></i> Partial</span>}
                      </td>
                    </tr>
                  )
                })}
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
        role={role}
        currentUser={currentUser}
      />
      <AddSkillModal
        isOpen={openModals.has('skill-edit-modal')}
        onClose={() => closeModal('skill-edit-modal')}
        showToast={showToast}
        role={role}
        currentUser={currentUser}
      />
      <Toast toast={toast} />
    </>
  )
}
