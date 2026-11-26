'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useHallTicketScopeStudents, HallTicketTerm } from '@/hooks/assessment/useHallTicket'
import { downloadBulkHallTicketPdf } from '@/lib/api/assessment/hallTicketIssue'
import { downloadBlob } from '@/lib/downloadBlob'
import { formatIntakeLabel, HALL_TICKET_TERM_OPTIONS } from './hallTicketShared'

interface IntakeOption {
  intakeGuid: string
  description?: string | null
  intakeCode?: string | number | null
  currentIntake?: boolean | null
}

interface PrintAllTabProps {
  intakes: IntakeOption[]
  canPrintAll: boolean
  canViewIssue: boolean
  onGoToIssue: () => void
  showToast: (msg: string, type?: string) => void
}

export function PrintAllTab({
  intakes,
  canPrintAll,
  canViewIssue,
  onGoToIssue,
  showToast,
}: PrintAllTabProps) {
  const [intakeGuid, setIntakeGuid] = useState('')
  useEffect(() => {
    if (intakeGuid || intakes.length === 0) return
    setIntakeGuid((intakes.find(i => i.currentIntake) ?? intakes[0]).intakeGuid)
  }, [intakes, intakeGuid])

  const selectedIntake = intakes.find(x => x.intakeGuid === intakeGuid)
  const intakeLabel = formatIntakeLabel(selectedIntake)
  const [termOverride, setTermOverride] = useState('')
  const termParam = termOverride ? (Number(termOverride) as HallTicketTerm) : undefined

  const { data: issued = [], isFetching: previewLoading, isError: previewError, error: previewErr } = useHallTicketScopeStudents(
    intakeGuid ? { intakeGuid, term: termParam } : null,
    'Issued',
  )
  const programCount = new Set(issued.map(r => r.programName)).size

  const [printing, setPrinting] = useState(false)
  async function handlePrintAll() {
    if (!canPrintAll || !intakeGuid || issued.length === 0) return
    setPrinting(true)
    try {
      const { blob, filename } = await downloadBulkHallTicketPdf({ intakeGuid, term: termParam })
      downloadBlob(blob, filename)
      const termLabel = termOverride ? `Term ${termOverride} ` : ''
      showToast(`Downloaded ${issued.length} ${termLabel}hall tickets for ${intakeLabel}.`, 'ok')
    } catch (e: any) {
      const msg = e?.errors?.[0] || e?.message || 'Could not generate the hall tickets.'
      showToast(msg, 'error')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
        <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
            <i className="lni lni-printer"></i>
          </span>
          <span>Batch Hall Ticket Print Scope</span>
        </div>
        {intakeGuid && !previewLoading && !previewError && (
          <span className={`badge ${issued.length > 0 ? 'badge-green' : 'badge-amber'}`}>
            {issued.length.toLocaleString()} issued ticket{issued.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="fg">
          <label className="lbl">Academic Intake <span className="req">*</span></label>
          <SearchSelect
            placeholder="— Select Intake —"
            options={intakes.map(i => ({ value: i.intakeGuid, label: formatIntakeLabel(i) }))}
            value={intakeGuid}
            onChange={setIntakeGuid}
            disabled={printing}
          />
        </div>
        <div className="fg">
          <label className="lbl">Term Override <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
          <SearchSelect
            placeholder="Auto"
            options={HALL_TICKET_TERM_OPTIONS}
            value={termOverride}
            onChange={setTermOverride}
            disabled={printing}
          />
        </div>
      </div>

      {!intakeGuid ? null : previewLoading ? (
        <div className="text-g400" style={{ fontSize: 12.5, marginBottom: 12 }}>Counting issued hall tickets…</div>
      ) : previewError ? (
        <div className="text-clr-red" style={{ fontSize: 12.5, marginBottom: 12 }}>
          <i className="lni lni-warning"></i> {(previewErr as Error)?.message || "Couldn't count issued hall tickets. You can still try Print All."}
        </div>
      ) : issued.length === 0 ? (
        <div className="info-box mb-3" style={{ borderColor: 'var(--amber-bd)', background: 'var(--amber-bg)' }}>
          <i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0 }}></i>
          <div style={{ fontSize: 12.5 }}>
            No {termOverride ? `Term ${termOverride} ` : ''}hall tickets have been issued in this intake yet.{' '}
            {canViewIssue ? (
              <>
                Issue them on{' '}
                <button
                  type="button"
                  onClick={onGoToIssue}
                  style={{ color: 'var(--b700)', fontWeight: 600, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Issue &amp; Eligibility
                </button>{' '}
                first.
              </>
            ) : (
              'Tickets must be issued first.'
            )}
          </div>
        </div>
      ) : (
        <div className="info-box mb-3">
          <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i>
          <div style={{ fontSize: 12.5 }}>
            <strong>{issued.length.toLocaleString()}</strong> issued student{issued.length === 1 ? '' : 's'} across {programCount} programme{programCount === 1 ? '' : 's'} — one page each.
            Students without an issued ticket are not included.
            {issued.length > 300 && ' A file this large can take several minutes to generate — keep this page open.'}
          </div>
        </div>
      )}

      {!canPrintAll && (
        <div className="warn-box mb-3 text-sm">
          <i className="lni lni-lock mt-0.5"></i>
          <span>You have view-only access — printing all hall tickets requires print/issue permission.</span>
        </div>
      )}

      {canPrintAll && (
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintAll}
            disabled={printing || !intakeGuid || previewLoading || (!previewError && issued.length === 0)}
          >
            <i className="lni lni-printer"></i> {printing ? 'Generating PDF…' : 'Print All'}
          </button>
        </div>
      )}
    </div>
  )
}
