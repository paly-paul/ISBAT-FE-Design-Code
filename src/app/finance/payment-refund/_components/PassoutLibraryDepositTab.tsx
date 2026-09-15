'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import DatePicker from '@/components/DatePicker'
import { SearchSelect } from '@/components/SearchSelect'
import { usePassoutLibraryDepositSearch } from '@/hooks/academic/useRefundSearch'
import { useStudentsByGuids } from '@/hooks/student/useStudents'
import { useBulkRefundPassoutLibraryDeposit, BulkRefundLineInput, BulkRefundLineResultDto } from '@/hooks/finance/usePaymentRefund'
import { useSearchCampusesInfinite } from '@/hooks/config/useCampuses'
import { useSearchProgramMastersInfinite } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSearchIntakesInfinite } from '@/hooks/academic/useIntakes'
import { flattenUniquePages } from '@/lib/pagination'
import { fmtAmt, todayYmd } from './shared'
import { mockBulkRefund, mockResolveApplicationGuid, mockSearchPassout } from './mockData'

// Category 2 — students with RegStatus = Passout, refunding a Library
// Deposit paid through either the main tuition ledger or the Other-Payments
// module (both already merged into `ledgers` by the search endpoint itself —
// see get-passout-library-deposit.md). Unlike the other two tabs this one
// is a bulk flow: staff check off confirmed lines across possibly several
// students, then submit them all in one call to
// POST /refund/passout-library-deposit/bulk. "Select all" only checks what's
// currently on screen — it is a frontend-only affordance, not a server-side
// filter re-derive (see that endpoint's own doc).

const PAGE_SIZE = 20

interface SelectableLine {
  key: string
  studentGuid: string
  studentName: string
  studentRegNo: string
  ledgerGuid: string
  ledgerName: string
  currencyGuid: string
  currencyCode: string
  amount: number
}

function lineKey(studentGuid: string, ledgerGuid: string) {
  return `${studentGuid}::${ledgerGuid}`
}

interface PassoutLibraryDepositTabProps {
  showToast: (msg: string, type?: string) => void
  permissionsCreate: boolean
  useMock?: boolean
}

export function PassoutLibraryDepositTab({ showToast, permissionsCreate, useMock = false }: PassoutLibraryDepositTabProps) {
  const [search, setSearch] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [batchGuid, setBatchGuid] = useState('')
  const [campusGuid, setCampusGuid] = useState('')
  const [batchSearch, setBatchSearch] = useState('')
  const [intakeSearch, setIntakeSearch] = useState('')
  const [programSearch, setProgramSearch] = useState('')
  const [campusSearch, setCampusSearch] = useState('')
  const [intakePickerOpen, setIntakePickerOpen] = useState(false)
  const [programPickerOpen, setProgramPickerOpen] = useState(false)
  const [campusPickerOpen, setCampusPickerOpen] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState({ intake: '', program: '', batch: '', campus: '' })
  const [page, setPage] = useState(1)

  const intakeQuery = useSearchIntakesInfinite(intakeSearch, 20, intakePickerOpen)
  const programQuery = useSearchProgramMastersInfinite(programSearch, 20, programPickerOpen)
  const campusQuery = useSearchCampusesInfinite(campusSearch, 20, campusPickerOpen)
  const intakes = useMemo(() => flattenUniquePages(intakeQuery.data?.pages ?? [], i => i.intakeGuid), [intakeQuery.data])
  const programs = useMemo(() => flattenUniquePages(programQuery.data?.pages ?? [], p => p.programGuid), [programQuery.data])
  const campuses = useMemo(() => flattenUniquePages(campusQuery.data?.pages ?? [], c => c.campusGuid), [campusQuery.data])
  const { data: batchesData } = useBatches(1, 20, batchSearch, true)
  const batches = batchesData?.items ?? []

  const { data, isLoading: isLoadingReal, isError } = usePassoutLibraryDepositSearch(
    { search, page, pageSize: PAGE_SIZE, intakeGuid: intakeGuid || undefined, programGuid: programGuid || undefined, batchGuid: batchGuid || undefined, campusGuid: campusGuid || undefined },
    !useMock,
  )
  const mockItems = useMock ? mockSearchPassout({ search, intakeGuid, programGuid, batchGuid, campusGuid }) : []
  const items = useMock ? mockItems : (data?.items ?? [])
  const totalCount = useMock ? mockItems.length : (data?.totalCount ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = useMock ? false : isLoadingReal

  // Flatten each student's embedded ledger lines into one selectable row per
  // (student, ledger) pair — a student can have more than one unrefunded
  // Library Deposit line (main ledger + Other-Payments both paid).
  const rows: SelectableLine[] = useMemo(() => items.flatMap(s =>
    s.ledgers.map(l => ({
      key: lineKey(s.studentGuid, l.ledgerGuid),
      studentGuid: s.studentGuid,
      studentName: s.studentName,
      studentRegNo: s.studentRegNo,
      ledgerGuid: l.ledgerGuid,
      ledgerName: l.ledgerName,
      currencyGuid: l.currencyGuid,
      currencyCode: l.currencyCode,
      amount: l.amount,
    })),
  ), [items])

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const selectedRows = rows.filter(r => selectedKeys.has(r.key))
  const allVisibleSelected = rows.length > 0 && rows.every(r => selectedKeys.has(r.key))

  function toggleRow(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAllVisible() {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) rows.forEach(r => next.delete(r.key))
      else rows.forEach(r => next.add(r.key))
      return next
    })
  }

  function updateFilters(fn: () => void) {
    fn()
    setPage(1)
    setSelectedKeys(new Set())
  }

  const intakeOptions = [...(selectedLabels.intake && intakeGuid && !intakes.some(i => i.intakeGuid === intakeGuid) ? [{ value: intakeGuid, label: selectedLabels.intake }] : []), ...intakes.map(i => ({ value: i.intakeGuid, label: `${i.month} ${i.financialYear}` }))]
  const programOptions = [...(selectedLabels.program && programGuid && !programs.some(p => p.programGuid === programGuid) ? [{ value: programGuid, label: selectedLabels.program }] : []), ...programs.map(p => ({ value: p.programGuid, label: p.programName }))]
  const batchOptions = [...(selectedLabels.batch && batchGuid && !batches.some(b => b.batchGuid === batchGuid) ? [{ value: batchGuid, label: selectedLabels.batch }] : []), ...batches.map(b => ({ value: b.batchGuid, label: b.batchCode }))]
  const campusOptions = [...(selectedLabels.campus && campusGuid && !campuses.some(c => c.campusGuid === campusGuid) ? [{ value: campusGuid, label: selectedLabels.campus }] : []), ...campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))]

  // Resolve applicationGuid for every distinct student currently selected —
  // the bulk endpoint's request body is keyed by applicationGuid, but this
  // search only returns studentGuid (see useStudentsByGuids' own comment).
  const selectedStudentGuids = useMemo(() => Array.from(new Set(selectedRows.map(r => r.studentGuid))), [selectedRows])
  const { byGuid: studentsByGuidReal, isLoading: isResolvingApplicationsReal } = useStudentsByGuids(selectedStudentGuids, !useMock && selectedStudentGuids.length > 0)
  const isResolvingApplications = useMock ? false : isResolvingApplicationsReal
  // Same studentGuid→applicationGuid shape useStudentsByGuids returns (a
  // Map keyed by studentGuid, of just enough of StudentDetailDto to read
  // .applicationSummary.applicationGuid off), sourced from mockData's flat
  // lookup instead of a real fetch.
  function resolveApplicationGuid(studentGuid: string): string | null {
    if (useMock) return mockResolveApplicationGuid(studentGuid)
    return studentsByGuidReal.get(studentGuid)?.applicationSummary?.applicationGuid ?? null
  }

  // Bumped after a mock bulk submit to force a re-render — mockBulkRefund
  // mutates MOCK_PASSOUT_STUDENTS' embedded ledgers array in place, which
  // React has no other way to notice.
  const [, forceMockRefresh] = useState(0)

  const [refundDate, setRefundDate] = useState(todayYmd)
  const [remarks, setRemarks] = useState('')
  const [results, setResults] = useState<BulkRefundLineResultDto[] | null>(null)

  const bulkRefund = useBulkRefundPassoutLibraryDeposit()

  function handleBulkSubmit() {
    if (!permissionsCreate) { showToast('You do not have permission to create refunds.', 'warn'); return }
    if (selectedRows.length === 0) { showToast('Select at least one line to refund.', 'warn'); return }
    if (!refundDate) { showToast('Please select a refund date.', 'warn'); return }

    const unresolved = selectedRows.filter(r => !resolveApplicationGuid(r.studentGuid))
    if (unresolved.length > 0) {
      showToast(`Couldn't resolve the application record for ${unresolved.length} selected line(s) — try again once they finish loading.`, 'warn')
      return
    }

    const lines: BulkRefundLineInput[] = selectedRows.map(r => ({
      applicationGuid: resolveApplicationGuid(r.studentGuid)!,
      studentGuid: r.studentGuid,
      ledgerOthersGuid: r.ledgerGuid,
      currencyGuid: r.currencyGuid,
      amount: r.amount,
      refundDate,
      remarks: remarks.trim() || null,
    }))

    const onDone = (res: BulkRefundLineResultDto[]) => {
      setResults(res)
      const failCount = res.filter(r => !r.success).length
      if (failCount === 0) showToast(`Refunded ${res.length} line(s) successfully.`, 'success')
      else showToast(`${res.length - failCount} of ${res.length} line(s) refunded — ${failCount} failed. See results below.`, 'warn')
      setSelectedKeys(new Set())
      setRemarks('')
    }

    if (useMock) {
      mockBulkRefund(lines).then(res => { forceMockRefresh(n => n + 1); onDone(res) })
      return
    }

    bulkRefund.mutate(lines, {
      onSuccess: onDone,
      onError: () => showToast('Bulk refund request failed. Please try again.', 'error'),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Passout / Library Deposit</div>
        </div>
        <div className="g2 mb-[14px]">
          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="lbl">Student Name, Reg No, or Student No</div>
            <div className="inp-wrap">
              <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
              <input
                className="ctrl"
                type="text"
                placeholder="e.g. MAJOK JOSEPH MADIT"
                value={search}
                onChange={e => updateFilters(() => setSearch(e.target.value))}
              />
            </div>
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="lbl">Intake</div>
            <SearchSelect
              placeholder="All intakes"
              options={intakeOptions}
              value={intakeGuid}
              onChange={v => updateFilters(() => {
                setIntakeGuid(v)
                const intake = intakes.find(i => i.intakeGuid === v)
                if (intake) setSelectedLabels(prev => ({ ...prev, intake: `${intake.month} ${intake.financialYear}` }))
              })}
              onSearch={setIntakeSearch}
              onOpenChange={setIntakePickerOpen}
              isLoading={intakeQuery.isLoading}
              hasNextPage={intakeQuery.hasNextPage}
              isFetchingNextPage={intakeQuery.isFetchingNextPage}
              onLoadMore={() => intakeQuery.fetchNextPage()}
            />
          </div>
        </div>
        <div className="g3">
          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="lbl">Programme</div>
            <SearchSelect
              placeholder="All programmes"
              options={programOptions}
              value={programGuid}
              onChange={v => updateFilters(() => {
                setProgramGuid(v)
                const program = programs.find(p => p.programGuid === v)
                if (program) setSelectedLabels(prev => ({ ...prev, program: program.programName }))
              })}
              onSearch={setProgramSearch}
              onOpenChange={setProgramPickerOpen}
              isLoading={programQuery.isLoading}
              hasNextPage={programQuery.hasNextPage}
              isFetchingNextPage={programQuery.isFetchingNextPage}
              onLoadMore={() => programQuery.fetchNextPage()}
            />
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="lbl">Batch</div>
            <SearchSelect
              placeholder="All batches"
              options={batchOptions}
              value={batchGuid}
              onChange={v => updateFilters(() => {
                setBatchGuid(v)
                const batch = batches.find(b => b.batchGuid === v)
                if (batch) setSelectedLabels(prev => ({ ...prev, batch: batch.batchCode }))
              })}
              onSearch={setBatchSearch}
              isLoading={batchesData === undefined}
            />
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="lbl">Campus</div>
            <SearchSelect
              placeholder="All campuses"
              options={campusOptions}
              value={campusGuid}
              onChange={v => updateFilters(() => {
                setCampusGuid(v)
                const campus = campuses.find(c => c.campusGuid === v)
                if (campus) setSelectedLabels(prev => ({ ...prev, campus: campus.campusName }))
              })}
              onSearch={setCampusSearch}
              onOpenChange={setCampusPickerOpen}
              isLoading={campusQuery.isLoading}
              hasNextPage={campusQuery.hasNextPage}
              isFetchingNextPage={campusQuery.isFetchingNextPage}
              onLoadMore={() => campusQuery.fetchNextPage()}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Searching…</div>
        ) : isError ? (
          <div className="text-clr-red text-center" style={{ padding: 24, fontSize: 12.5 }}><i className="lni lni-warning"></i> Search failed. Please try again.</div>
        ) : rows.length === 0 ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>No unrefunded Library Deposit lines found.</div>
        ) : (
          <>
            <ScrollTable className="no-sticky-col">
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} title="Select all on this page" /></th>
                    <th>Student</th>
                    <th>Reg No</th>
                    <th>Ledger</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key} className="cursor-pointer" onClick={() => toggleRow(r.key)}>
                      <td><input type="checkbox" checked={selectedKeys.has(r.key)} onChange={() => toggleRow(r.key)} onClick={e => e.stopPropagation()} /></td>
                      <td className="font-bold">{r.studentName}</td>
                      <td>{r.studentRegNo}</td>
                      <td>{r.ledgerName}</td>
                      <td className="font-bold">{r.currencyCode} {fmtAmt(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="students" onPageChange={setPage} />
          </>
        )}
      </div>

      {selectedRows.length > 0 && (
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-reload"></i></span> Bulk Refund — {selectedRows.length} line{selectedRows.length === 1 ? '' : 's'} selected</div>
          </div>

          <div className="g2 mb-[14px]">
            <div className="fg">
              <div className="lbl">Refund Date <span className="req">*</span></div>
              <DatePicker value={refundDate} onChange={setRefundDate} />
            </div>
            <div className="fg">
              <div className="lbl">Remarks</div>
              <textarea className="ctrl" rows={1} placeholder="Applied to every selected line" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-[10px] justify-end flex-wrap">
            <button className="btn btn-neu" onClick={() => setSelectedKeys(new Set())}><i className="lni lni-close"></i> Clear Selection</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={bulkRefund.isPending || isResolvingApplications || !permissionsCreate}
              onClick={handleBulkSubmit}
            >
              <i className="lni lni-checkmark"></i> {bulkRefund.isPending ? 'Submitting…' : isResolvingApplications ? 'Resolving…' : `Refund ${selectedRows.length} Line${selectedRows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {results && (
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Bulk Refund Results</div>
            <button className="btn btn-neu btn-sm" onClick={() => setResults(null)}><i className="lni lni-close"></i> Dismiss</button>
          </div>
          <ScrollTable className="no-sticky-col">
            <table>
              <thead><tr><th>Application</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={`${r.applicationGuid}-${r.ledgerOthersGuid}-${i}`}>
                    <td className="font-mono">{r.applicationGuid}</td>
                    <td>{r.success ? <span className="badge badge-green">Refunded</span> : <span className="badge badge-red">Failed</span>}</td>
                    <td>{r.success ? (r.refundGuid ?? '—') : (r.error ?? 'Unknown error')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      )}
    </div>
  )
}
