'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useHallTicketScopeStudents, HallTicketTerm } from '@/hooks/assessment/useHallTicket'
import { downloadBulkHallTicketPdf } from '@/lib/api/assessment/hallTicketIssue'
import { downloadBlob } from '@/lib/downloadBlob'

// Hall Ticket Print All (pages/assessment/hall-ticket-print-all-page.md) —
// successor to legacy frmRptUEHallTicketPrintAll. Intake + term only, no
// program/semester: one combined PDF of every ISSUED student in the intake.
//  1. Intake (defaults to the current one) + Term.
//  2. Preview: GET /bulk?status=Issued (no program/semester) → the count of
//     pages the PDF will have; warns when nobody's been issued yet.
//  3. Print All: GET /bulk/pdf with intakeGuid + term only. Records the
//     prints server-side; QR codes are generated into the PDF, so there's no
//     separate "save QR codes" step like the legacy page had.
// A whole intake can take a long time and produce a very large file.

const TERM_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
]

export default function HallTicketPrintAllPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 5000) }

  const { data: intakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  useEffect(() => {
    if (intakeGuid || intakes.length === 0) return
    setIntakeGuid((intakes.find(i => i.currentIntake) ?? intakes[0]).intakeGuid)
  }, [intakes, intakeGuid])
  const intakeLabel = (() => {
    const i = intakes.find(x => x.intakeGuid === intakeGuid)
    return i ? (i.description ? `${i.description} (${i.intakeCode})` : String(i.intakeCode)) : ''
  })()
  const [termOverride, setTermOverride] = useState<string>('')
  const termParam = termOverride ? (Number(termOverride) as HallTicketTerm) : undefined

  const { data: issued = [], isFetching: previewLoading, isError: previewError } = useHallTicketScopeStudents(
    intakeGuid ? { intakeGuid, term: termParam } : null,
    'Issued',
  )
  const programCount = new Set(issued.map(r => r.programName)).size

  const [printing, setPrinting] = useState(false)
  async function handlePrintAll() {
    if (!intakeGuid || issued.length === 0) return
    setPrinting(true)
    try {
      const { blob, filename } = await downloadBulkHallTicketPdf({ intakeGuid, term: termParam })
      downloadBlob(blob, filename)
      const termLabel = termOverride ? `Term ${termOverride} ` : ''
      showToast(`Downloaded ${issued.length} ${termLabel}hall tickets for ${intakeLabel}.`, 'ok')
    } catch (e: any) {
      const msg = e?.message || ''
      if (/cannot be printed after the exam/i.test(msg)) {
        showToast('Hall ticket cannot be printed after the exam.', 'error')
      } else if (/Could not determine the hall ticket term/i.test(msg)) {
        showToast('Could not determine the hall ticket term. Please specify the term.', 'error')
      } else {
        showToast(msg || 'Could not generate the hall tickets.', 'error')
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Hall Ticket Print All</div><div className="pg-sub">Print every issued hall ticket in an intake as one PDF</div></div>
          <Link className="btn btn-neu" href="/assessment/hall-print"><i className="lni lni-user"></i> Print One Student</Link>
        </div>

        <div className="card" style={{ maxWidth: 720 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="fg">
              <label className="lbl">Academic Intake <span className="req">*</span></label>
              <SearchSelect
                placeholder="— Select Intake —"
                options={intakes.map(i => ({ value: i.intakeGuid, label: i.description ? `${i.description} (${i.intakeCode})` : String(i.intakeCode) }))}
                value={intakeGuid}
                onChange={setIntakeGuid}
                disabled={printing}
              />
            </div>
            <div className="fg">
              <label className="lbl">Term Override <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
              <SearchSelect
                placeholder="Auto"
                options={TERM_OPTIONS}
                value={termOverride}
                onChange={setTermOverride}
                disabled={printing}
              />
            </div>
          </div>

          {!intakeGuid ? null : previewLoading ? (
            <div className="text-g400" style={{ fontSize: 12.5, marginBottom: 12 }}>Counting issued hall tickets…</div>
          ) : previewError ? (
            <div className="text-clr-red" style={{ fontSize: 12.5, marginBottom: 12 }}><i className="lni lni-warning"></i> Couldn&apos;t count issued hall tickets. You can still try Print All.</div>
          ) : issued.length === 0 ? (
            <div className="info-box mb-3" style={{ borderColor: 'var(--amber-bd)', background: 'var(--amber-bg)' }}>
              <i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0 }}></i>
              <div style={{ fontSize: 12.5 }}>No {termOverride ? `Term ${termOverride} ` : ''}hall tickets have been issued in this intake yet. Issue them on <Link href="/assessment/hall-ticket" style={{ color: 'var(--b700)', fontWeight: 600 }}>Hall Ticket Issuance</Link> first.</div>
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

          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            {permissions.print !== false && (
            <button className="btn btn-primary" onClick={handlePrintAll} disabled={printing || !intakeGuid || previewLoading || (!previewError && issued.length === 0)}>
              <i className="lni lni-printer"></i> {printing ? 'Generating PDF…' : 'Print All'}
            </button>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
