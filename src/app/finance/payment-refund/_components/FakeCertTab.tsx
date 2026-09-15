'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { useFakeCertificateTerminationsSearch } from '@/hooks/academic/useRefundSearch'
import { useStudent } from '@/hooks/student/useStudents'
import { RefundLedgerPicker, initialsFor } from './shared'
import { mockResolveApplicationGuid, mockSearchFakeCert } from './mockData'

// Category 3 — students terminated mid-program with reason "Fake
// Certificate" (get-fake-certificate-terminations.md). The search DTO only
// carries studentGuid, not applicationGuid — resolved via useStudent's own
// applicationSummary.applicationGuid before the ledger/refund step can run
// (see useStudentsByGuids' comment in hooks/student/useStudents.ts for why).

const PAGE_SIZE = 20

interface FakeCertTabProps {
  showToast: (msg: string, type?: string) => void
  permissionsCreate: boolean
  onRefunded: (rows: [string, string][]) => void
  useMock?: boolean
}

export function FakeCertTab({ showToast, permissionsCreate, onRefunded, useMock = false }: FakeCertTabProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<{ studentGuid: string; name: string; regNo: string; remarks: string | null } | null>(null)

  const { data, isLoading: isLoadingReal, isError } = useFakeCertificateTerminationsSearch({ search, page, pageSize: PAGE_SIZE }, !useMock)
  const mockItems = useMock ? mockSearchFakeCert(search) : []
  const items = useMock ? mockItems : (data?.items ?? [])
  const totalCount = useMock ? mockItems.length : (data?.totalCount ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = useMock ? false : isLoadingReal

  const { data: studentDetail, isLoading: isResolvingApplicationReal, isError: isResolveErrorReal } = useStudent(selected?.studentGuid ?? null, !useMock && !!selected)
  const applicationGuid = useMock
    ? (selected ? mockResolveApplicationGuid(selected.studentGuid) : null)
    : (studentDetail?.applicationSummary?.applicationGuid ?? null)
  const isResolvingApplication = useMock ? false : isResolvingApplicationReal
  const isResolveError = useMock ? false : isResolveErrorReal

  function handleSearchChange(v: string) {
    setSearch(v)
    setPage(1)
    setSelected(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Fake-Certificate Terminations</div>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <div className="lbl">Student Name, Reg No, or Student No</div>
          <div className="inp-wrap">
            <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. 022210001 or Tusingwire Drake"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Searching…</div>
        ) : isError ? (
          <div className="text-clr-red text-center" style={{ padding: 24, fontSize: 12.5 }}><i className="lni lni-warning"></i> Search failed. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>No fake-certificate terminations found.</div>
        ) : (
          <>
            <ScrollTable className="no-sticky-col">
              <table>
                <thead><tr><th>Student</th><th>Reg No</th><th>Programme</th><th>Termination Remarks</th><th></th></tr></thead>
                <tbody>
                  {items.map(s => (
                    <tr
                      key={s.studentGuid}
                      className={`cursor-pointer${selected?.studentGuid === s.studentGuid ? ' bg-b50' : ''}`}
                      onClick={() => setSelected({ studentGuid: s.studentGuid, name: s.studentName, regNo: s.studentRegNo, remarks: s.terminationRemarks })}
                    >
                      <td className="font-bold">{s.studentName}</td>
                      <td>{s.studentRegNo}</td>
                      <td>{s.programName || '—'}</td>
                      <td>{s.terminationRemarks || '—'}</td>
                      <td>{selected?.studentGuid === s.studentGuid && <span className="badge badge-blue">Selected</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="students" onPageChange={setPage} />
          </>
        )}
      </div>

      {selected && (
        <>
          {/* Full-width hero card, promoted out of a 2-column split
              (2026-09-15) — same move as Payment Console's Semester Payment
              tab. */}
          <div className="card p-0 overflow-hidden">
            <div className="pc-hero">
              <div className="pc-hero-top">
                <div className="pc-hero-avatar">{initialsFor(selected.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="pc-hero-name truncate">{selected.name}</div>
                  <div className="pc-hero-sub truncate">Terminated — Fake Certificate</div>
                  <span className="pc-hero-badge"><i className="lni lni-bookmark"></i> {selected.regNo}</span>
                </div>
              </div>
              <div className="pc-hero-facts">
                <div className="pc-hero-fact pc-hero-fact-span2"><span className="pc-hero-fact-lbl">Termination Remarks</span><span className="pc-hero-fact-val" title={selected.remarks ?? '—'}>{selected.remarks ?? '—'}</span></div>
              </div>
            </div>
          </div>

          {isResolvingApplication ? (
            <div className="card text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Resolving application record…</div>
          ) : isResolveError || !applicationGuid ? (
            // Same centered-icon/title/subtitle empty-state treatment as
            // Payment Console's own "Fully settled" card (.pc-receipt-check),
            // just in red for a blocking error instead of green for success —
            // replaces the old plain text-clr-red line.
            <div className="card text-center" style={{ padding: 24 }}>
              <div className="pc-receipt-check" style={{ background: 'var(--red-bg)', color: 'var(--red)', borderColor: 'var(--red-bd)' }}>
                <i className="lni lni-warning"></i>
              </div>
              <div className="font-bold text-g700" style={{ fontSize: 13.5 }}>Application record not found</div>
              <div className="text-g400 mt-1" style={{ fontSize: 12.5 }}>Couldn&apos;t resolve this student&apos;s application record — refunding isn&apos;t possible without it.</div>
            </div>
          ) : (
            <RefundLedgerPicker
              key={applicationGuid}
              applicationGuid={applicationGuid}
              studentGuid={selected.studentGuid}
              showToast={showToast}
              permissionsCreate={permissionsCreate}
              onRefunded={onRefunded}
              useMock={useMock}
            />
          )}
        </>
      )}
    </div>
  )
}
