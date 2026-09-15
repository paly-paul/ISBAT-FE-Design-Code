'use client'
import { useEffect, useRef, useState } from 'react'
import { useFakeCertificateTerminationsSearch } from '@/hooks/academic/useRefundSearch'
import { useStudent } from '@/hooks/student/useStudents'
import { RefundLedgerPicker, initialsFor } from './shared'
import { mockResolveApplicationGuid, mockSearchFakeCert } from './mockData'

// Category 3 — students terminated mid-program with reason "Fake
// Certificate" (get-fake-certificate-terminations.md). The search DTO only
// carries studentGuid, not applicationGuid — resolved via useStudent's own
// applicationSummary.applicationGuid before the ledger/refund step can run
// (see useStudentsByGuids' comment in hooks/student/useStudents.ts for why).
//
// Search-and-select dropdown (2026-09-15, per request) — same move as the
// Rejected-by-Registrar tab: replaces the always-visible results table +
// Pagination with a live-typing typeahead, same convention the rest of this
// app's student-search boxes use.

const PAGE_SIZE = 1000

interface FakeCertTabProps {
  showToast: (msg: string, type?: string) => void
  permissionsCreate: boolean
  onRefunded: (rows: [string, string][]) => void
  useMock?: boolean
}

export function FakeCertTab({ showToast, permissionsCreate, onRefunded, useMock = false }: FakeCertTabProps) {
  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{ studentGuid: string; name: string; regNo: string; remarks: string | null } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCommittedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!searchFocused) return
    function handle(e: MouseEvent) {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [searchFocused])

  const searchTermLen = committedSearch.length
  const searchEnabled = searchFocused && (searchTermLen === 0 || searchTermLen >= 2)
  const { data, isLoading: isLoadingReal, isError } = useFakeCertificateTerminationsSearch({ search: committedSearch, page: 1, pageSize: PAGE_SIZE }, !useMock && searchEnabled)
  const mockItems = useMock ? mockSearchFakeCert(committedSearch) : []
  const items = useMock ? mockItems : (data?.items ?? [])
  const isLoading = useMock ? false : isLoadingReal

  const { data: studentDetail, isLoading: isResolvingApplicationReal, isError: isResolveErrorReal } = useStudent(selected?.studentGuid ?? null, !useMock && !!selected)
  const applicationGuid = useMock
    ? (selected ? mockResolveApplicationGuid(selected.studentGuid) : null)
    : (studentDetail?.applicationSummary?.applicationGuid ?? null)
  const isResolvingApplication = useMock ? false : isResolvingApplicationReal
  const isResolveError = useMock ? false : isResolveErrorReal

  function selectCandidate(s: { studentGuid: string; studentName: string; studentRegNo: string; terminationRemarks: string | null }) {
    setSelected({ studentGuid: s.studentGuid, name: s.studentName, regNo: s.studentRegNo, remarks: s.terminationRemarks })
    setSearch(s.studentName)
    setCommittedSearch('')
    setSearchFocused(false)
  }

  function handleClear() {
    setSelected(null)
    setSearch('')
    setCommittedSearch('')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Fake-Certificate Terminations</div>
        </div>
        <div className="fg" style={{ marginBottom: 0, position: 'relative' }} ref={searchBoxRef}>
          <div className="lbl">Student Name, Reg No, or Student No</div>
          <div className="flex gap-2 flex-wrap">
            <div className="inp-wrap" style={{ flex: 1, minWidth: 180 }}>
              <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
              <input
                className="ctrl"
                type="text"
                placeholder="e.g. 022210001 or Tusingwire Drake"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => { if (e.key === 'Enter') setCommittedSearch(search.trim()) }}
              />
            </div>
            {selected && (
              <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-close"></i> Clear</button>
            )}
          </div>

          {searchFocused && (
            <div
              className="mt-1"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                background: 'var(--white)', border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)',
                boxShadow: 'var(--neu-out)', maxHeight: 280, overflowY: 'auto',
              }}
            >
              {isLoading ? (
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Searching…</div>
              ) : isError ? (
                <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Search failed. Please try again.</div>
              ) : items.length === 0 ? (
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No fake-certificate terminations found.</div>
              ) : (
                items.map(s => (
                  <div
                    key={s.studentGuid}
                    className="cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0"
                    onMouseDown={() => selectCandidate(s)}
                  >
                    <div className="font-bold">{s.studentName}</div>
                    <div className="text-g500" style={{ fontSize: 11 }}>{s.studentRegNo}{s.programName ? ` · ${s.programName}` : ''}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
