'use client'
import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { OnboardModal } from '@/components/modals/admission/OnboardModal'
import { CompleteRegistrationModal } from '@/components/modals/admission/CompleteRegistrationModal'
import { Pagination } from '@/components/Pagination'
import { useRegistrarDeskApplications, useRegistrarDeskCounts, RegisterStudentResponse } from '@/hooks/admission/useRegistrarDesk'
import { useCurrentAdmissionIntake } from '@/hooks/academic/useIntakes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

// Not part of registrar-desk-api-docs.html — these earlier pipeline stages
// (App. Payment/Filing/Vetting counts) have no confirmed endpoint of their
// own here, kept as a decorative static strip same as before. Only "Reg.
// Payment"/"Registration" (this desk's own stage) are backed by real data
// below.
const REG_PIPELINE = [
  { label: 'App. Payment',  status: 'done',   note: '' },
  { label: 'App. Filing',   status: 'done',   note: '' },
  { label: 'Vetting',       status: 'done',   note: '' },
  { label: 'Reg. Payment',  status: 'active', note: 'Registrar checks fee' },
  { label: 'Registration',  status: '',       note: "Registrar's Desk" },
]

// "—" for null, blank, or the literal string "null" some admission endpoints send.
function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}

export default function RegistrationPage() {
  const permissions = usePagePermissions()
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  const [registeredResult, setRegisteredResult] = useState<RegisterStudentResponse | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function updateSearch(value: string) { setSearch(value); setPage(1) }

  // The registrar desk is current-admission-intake only (2026-10 handoff):
  // the list API returns nothing else, and detail/register reject other
  // intakes. So the old intake filter is gone — this just labels which
  // intake the desk is working on.
  const currentIntake = useCurrentAdmissionIntake()
  const noCurrentIntake = currentIntake.isSuccess && !currentIntake.data

  const searchTrimmed = search.trim()
  // An App Ref No starts with "APP", "ADM", contains "/", or is digits (e.g. APP20261/7117, ADM-26-0019, 7117).
  const looksLikeAppRefNo = /^app/i.test(searchTrimmed) || /^adm/i.test(searchTrimmed) || searchTrimmed.includes('/') || /^\d+$/.test(searchTrimmed)

  // Route search by shape: a term that looks like an App Ref No goes to
  // appRefNo, everything else to studentName (same convention as /admission/vetting).
  // Sending both would cause the backend to AND them (and fail).
  const { data, isLoading } = useRegistrarDeskApplications(page, PAGE_SIZE, {
    appRefNo: looksLikeAppRefNo ? (searchTrimmed || undefined) : undefined,
    studentName: !looksLikeAppRefNo ? (searchTrimmed || undefined) : undefined,
    // No intakeGuid/intakeName — the server scopes to the current admission
    // intake itself (and returns an empty list for any other).
  })
  const { data: counts } = useRegistrarDeskCounts()

  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const searchMatches = search.trim() ? items.slice(0, 8) : []
  const colSpan = permissions.add ? 5 : 4

  function handleRegister(applicationGuid: string) {
    setSelectedApplicationGuid(applicationGuid)
    openModal('complete-registration-modal')
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
                {step.note && <div className="pip-desc">{step.note}</div>}
              </div>
            </div>
            {i < REG_PIPELINE.length - 1 && <div className={`pip-line ${step.status === 'done' ? 'done' : ''}`} />}
          </Fragment>
        ))}
      </div>

      <div className="g3 mb-6">
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="stat-lbl">Ready to Register</div>
          <div className="stat-num text-clr-green">{(counts?.regFeePaidCount ?? 0).toLocaleString()}</div>
          <div className="stat-sub up">Reg. fee paid</div>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="stat-lbl">Awaiting Reg. Payment</div>
          <div className="stat-num text-clr-amber">{(counts?.regFeeNotPaidCount ?? 0).toLocaleString()}</div>
          <div className="stat-sub warn">Fee outstanding</div>
        </div>
        <div className="stat-card [--b700:var(--gold)] [--b400:#f59e0b]">
          <div className="stat-lbl">Registered This Intake</div>
          <div className="stat-num text-clr-gold">{(counts?.registeredCount ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-g800">Provisionally Admitted &mdash; Awaiting Final Registration</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <TableSearch
              className="w-64"
              placeholder="Search App. Ref / Student…"
              value={search}
              onChange={updateSearch}
              results={searchMatches.map(r => ({ id: r.applicationGuid, primary: r.appRefNo, secondary: r.studentName }))}
              // Picking a suggestion opens that registration straight away.
              onSelect={permissions.add ? (r => { updateSearch(r.primary); handleRegister(r.id) }) : undefined}
            />
            {currentIntake.data && (
              <span
                className="badge badge-blue"
                style={{ padding: '6px 10px', gap: 6 }}
                title="The registrar desk only works on the current admission intake"
              >
                <i className="lni lni-lock" aria-hidden="true" /> Intake: {currentIntake.data.intakeCode} — {currentIntake.data.description}
              </span>
            )}
          </div>
        </div>
        {noCurrentIntake && (
          <div className="warn-box mb-4" role="note">
            <i className="lni lni-warning" aria-hidden="true" style={{ marginTop: 2 }} />
            <span>No current admission intake is configured, so there&apos;s nothing to register. Set one in Academic › Intake Master.</span>
          </div>
        )}
        <ScrollTable>
          <table>
            <thead>
              <tr>
                {permissions.add && <th><span className="sr-only">Actions</span></th>}
                <th>App. Ref</th>
                <th>Student Name</th>
                <th>Programme</th>
                <th>Reg. Fee</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={colSpan} />
                : items.length === 0
                  ? <EmptyState
                      colSpan={colSpan}
                      title={search.trim() ? undefined : 'No one waiting to register'}
                      subtitle={search.trim() ? undefined : 'Applicants approved at vetting for this intake will show here.'}
                      hasFilters={!!search.trim()}
                      onClearFilters={() => { setSearch(''); setPage(1) }}
                    />
                  : null}
              {items.map(r => (
                <tr key={r.applicationGuid}>
                  {/* Register is no longer gated on r.regPaid (per request,
                      2026-09-10) — Reg. Fee is shown as information only.
                      It creates a student and can't be undone, so it needs
                      the page's add permission. A direct button now: the
                      one-item Actions menu cost an extra click per row. */}
                  {permissions.add && (
                    <td>
                      <button type="button" className="btn btn-neu btn-sm" onClick={() => handleRegister(r.applicationGuid)} aria-label={`Register ${orDash(r.studentName)}`}>
                        <i className="lni lni-graduation" aria-hidden="true" /> Register
                      </button>
                    </td>
                  )}
                  <td className="text-sm tabular-nums">{orDash(r.appRefNo)}</td>
                  <td>
                    {permissions.add
                      ? <button type="button" className="vd-name-btn" onClick={() => handleRegister(r.applicationGuid)}>{orDash(r.studentName)}</button>
                      : <span className="font-semibold text-g900">{orDash(r.studentName)}</span>}
                  </td>
                  <td>{orDash(r.programName)}</td>
                  <td><span className={r.regPaid ? 'badge badge-green' : 'badge badge-red'}>{r.regPaid ? 'Paid' : 'Not Paid'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="applicants" onPageChange={setPage} />
      </div>

      <CompleteRegistrationModal
        isOpen={openModals.has('complete-registration-modal')}
        onClose={() => closeModal('complete-registration-modal')}
        showToast={showToast}
        applicationGuid={selectedApplicationGuid}
        onRegistered={result => {
          setRegisteredResult(result)
          closeModal('complete-registration-modal')
          openModal('onboard-modal')
        }}
      />
      <OnboardModal
        isOpen={openModals.has('onboard-modal')}
        onClose={() => closeModal('onboard-modal')}
        showToast={showToast}
        result={registeredResult}
        nav={id => router.push('/admission/' + id)}
      />
      <Toast toast={toast} />
    </div>
  )
}
