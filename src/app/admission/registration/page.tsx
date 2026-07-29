'use client'
import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { OnboardModal } from '@/components/modals/admission/OnboardModal'
import { CompleteRegistrationModal } from '@/components/modals/admission/CompleteRegistrationModal'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 10

const REG_PIPELINE = [
  { label: 'App. Payment',  status: 'done',   note: '23 paid' },
  { label: 'App. Filing',   status: 'done',   note: '20 filed' },
  { label: 'Vetting',       status: 'done',   note: '18 cleared' },
  { label: 'Reg. Payment',  status: 'active', note: '$250 check' },
  { label: 'Registration',  status: '',       note: "Registrar's Desk" },
]

const REG_ROWS = [
  { ref: 'ADM-26-0019', name: 'Esther Tumukunde', prog: 'BSCS', type: 'Regular',       fee: 'Paid',     canReg: true,  intake: 'Spring 2026' },
  { ref: 'ADM-26-0017', name: 'Grace Nampijja',   prog: 'BBA',  type: 'Lateral Entry', fee: 'Paid',     canReg: true,  intake: 'Fall 2026' },
  { ref: 'ADM-26-0016', name: 'James Okello',      prog: 'BSIT', type: 'Regular',       fee: 'Not Paid', canReg: false, intake: 'Spring 2026' },
]

const INTAKE_OPTIONS = [
  { value: 'all', label: 'All Intakes' },
  { value: 'Spring 2026', label: 'Spring 2026' },
  { value: 'Fall 2026', label: 'Fall 2026' },
]

export default function RegistrationPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [selectedStudent, setSelectedStudent] = useState<typeof REG_ROWS[0] | null>(null)
  const [search, setSearch] = useState('')
  const [filterIntake, setFilterIntake] = useState('all')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  const q = search.trim().toLowerCase()
  const filteredRows = REG_ROWS.filter(r =>
    (filterIntake === 'all' || r.intake === filterIntake) &&
    (!q || r.ref.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function handleRegister(row: typeof REG_ROWS[0]) {
    setSelectedStudent(row); openModal('complete-registration-modal')
  }

  return (
    <div id="page-registration">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Registrar&rsquo;s Desk &mdash; Stage 4&ndash;5</h1>
          <p className="text-sm text-g500 mt-0.5">Registration payment verification &amp; final student registration</p>
        </div>
        <span className="badge badge-gold">Registrar&rsquo;s Dashboard</span>
      </div>

      <div className="pipeline mb-6">
        {REG_PIPELINE.map((step, i) => (
          <Fragment key={step.label}>
            <div className={`pip-step ${step.status}`}>
              <div className="pip-circle">{step.status === 'done' ? <i className="lni lni-checkmark" /> : i + 1}</div>
              <div className="pip-info">
                <div className="pip-label">{step.label}</div>
                <div className="pip-desc">{step.note}</div>
              </div>
            </div>
            {i < REG_PIPELINE.length - 1 && <div className={`pip-line ${step.status === 'done' ? 'done' : ''}`} />}
          </Fragment>
        ))}
      </div>

      <div className="g3 mb-6">
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="stat-lbl">Ready to Register</div>
          <div className="stat-num text-clr-green">2</div>
          <div className="stat-sub up">Reg. fee paid</div>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="stat-lbl">Awaiting Reg. Payment</div>
          <div className="stat-num text-clr-amber">1</div>
          <div className="stat-sub warn">$250 pending</div>
        </div>
        <div className="stat-card [--b700:var(--gold)] [--b400:#f59e0b]">
          <div className="stat-lbl">Registered This Intake</div>
          <div className="stat-num text-clr-gold">4</div>
          <div className="stat-sub up">↑ Spring 2026</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-g800">Provisionally Admitted &mdash; Awaiting Final Registration</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <i className="lni lni-search-alt absolute left-2.5 top-1/2 -translate-y-1/2 text-g400 text-sm" />
              <input className="ctrl pl-8 w-56" placeholder="Search App. Ref No. / Student…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <SearchSelect options={INTAKE_OPTIONS} value={filterIntake} onChange={setFilterIntake} />
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr className="text-left text-g500 border-b border-g200">
                <th style={{ width: 48 }}></th><th className="pb-2 font-medium">App. Ref</th><th className="pb-2 font-medium">Student Name</th>
                <th className="pb-2 font-medium">Programme</th><th className="pb-2 font-medium">Admission Type</th>
                <th className="pb-2 font-medium">Intake</th><th className="pb-2 font-medium">Reg. Fee ($250)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-g400">No students match the current search / filter.</td></tr>
              )}
              {pageItems.map(r => (
                <tr key={r.ref} className="border-b border-g100 hover:bg-g50">
                  <td>
                    <ActionMenu>
                      {r.canReg
                        ? <button className="btn btn-neu btn-sm" onClick={() => handleRegister(r)}><i className="lni lni-graduation" /> Register</button>
                        : <button className="btn btn-neu btn-sm" disabled>Awaiting Payment</button>}
                    </ActionMenu>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-b600">{r.ref}</td>
                  <td className="py-2.5 text-g800">{r.name}</td>
                  <td className="py-2.5">{r.prog}</td>
                  <td className="py-2.5">{r.type}</td>
                  <td className="py-2.5">{r.intake}</td>
                  <td className="py-2.5"><span className={r.fee === 'Paid' ? 'badge badge-green' : 'badge badge-red'}>{r.fee}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="students" onPageChange={setPage} />
      </div>

      <CompleteRegistrationModal
        isOpen={openModals.has('complete-registration-modal')}
        onClose={() => closeModal('complete-registration-modal')}
        showToast={showToast}
        student={selectedStudent}
        onOnboard={() => { closeModal('complete-registration-modal'); openModal('onboard-modal') }}
      />
      <OnboardModal
        isOpen={openModals.has('onboard-modal')}
        onClose={() => closeModal('onboard-modal')}
        showToast={showToast}
        nav={id => router.push('/admission/' + id)}
      />
      <Toast toast={toast} />
    </div>
  )
}
