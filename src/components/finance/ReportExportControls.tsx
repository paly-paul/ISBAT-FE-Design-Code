'use client'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthError } from '@/lib/api/client'
import { simulateReportStatus } from '@/lib/notificationsHub'
import { REPORT_JOBS_KEY, downloadReportJob, trackInline, upsertReportJob } from '@/lib/reportDownloads'
import { getReportJobs, REPORT_STATUS, type ReportJob } from '@/lib/api/finance/discountReport'
import { fmtReportCount, reportErrorMessage } from '@/lib/reportFormat'
import { useActionGuard } from '@/hooks/users/useActionGuard'
import { Toast } from '@/components/Toast'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// The results header's Export to Excel control, shared by the Transaction and
// Outstanding report pages — the same behaviour as the Discount Report's:
// Export to Excel → Processing… → Download Excel (or an error toast and Try
// again). The job also lands in the header's Downloads list (shared
// REPORT_JOBS_KEY cache), which skips its own toast for a job shown here.
//
// `startExport` must send the SAVED filters from Process, never the live form.
// `resetKey` changes on every Process so a new result starts back at Export.
//
// Export follows the page's menu `export` permission: the button always
// shows, and without it clicking shows a toast instead of exporting. Every
// error (refused, failed job, expired link) is a toast too; only the
// Building… / Ready progress stays inline.
export function ReportExportControls({ startExport, resetKey, mockFileName }: {
  startExport: () => Promise<{ job: ReportJob; message: string | null }>
  resetKey: number
  mockFileName: string
}) {
  const queryClient = useQueryClient()
  const jobsQuery = useQuery({ queryKey: REPORT_JOBS_KEY, queryFn: () => getReportJobs(1, 15) })
  const [jobGuid, setJobGuid] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function showToast(msg: string, type = 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  const showError = (msg: string) => showToast(msg, 'error')
  const guard = useActionGuard(showToast)

  useEffect(() => { setJobGuid(null) }, [resetKey])
  useEffect(() => (jobGuid ? trackInline(jobGuid) : undefined), [jobGuid])

  const job = jobGuid ? jobsQuery.data?.items.find(j => j.reportJobGuid === jobGuid) : undefined
  const phase: 'idle' | 'processing' | 'ready' | 'failed' =
    exporting || job?.status.value === REPORT_STATUS.Queued || job?.status.value === REPORT_STATUS.Processing ? 'processing'
    : job?.status.value === REPORT_STATUS.Completed && !job.isExpired ? 'ready'
    : job?.status.value === REPORT_STATUS.Failed ? 'failed'
    : 'idle'

  // A failed job reports its reason once, as a toast.
  const failedReason = phase === 'failed' ? (job?.errorMessage || 'The report could not be generated.') : null
  useEffect(() => { if (failedReason) showError(failedReason) }, [failedReason])

  async function runExport() {
    setExporting(true)
    try {
      const { job: started } = await startExport()
      upsertReportJob(queryClient, started)   // same guid on a duplicate export → updated, not added twice
      setJobGuid(started.reportJobGuid)
      if (MOCK_AUTH) {
        const base = { reportJobGuid: started.reportJobGuid, reportName: started.reportName, fileName: null, downloadUrl: null, downloadUrlExpiresAtUtc: null, errorMessage: null }
        setTimeout(() => simulateReportStatus({ ...base, status: 2, statusName: 'Processing', occurredAtUtc: new Date().toISOString() }), 1200)
        setTimeout(() => simulateReportStatus({ ...base, status: 3, statusName: 'Completed', fileName: mockFileName, downloadUrl: '#', downloadUrlExpiresAtUtc: new Date(Date.now() + 600_000).toISOString(), occurredAtUtc: new Date().toISOString() }), 4200)
      }
    } catch (err) {
      const code = err instanceof AuthError ? err.code : undefined
      showError(code === 'employee_required'
        ? 'Your account isn’t linked to an employee record, so it can’t export. Ask an administrator to link it.'
        : reportErrorMessage(err, 'Couldn’t start the export. Please try again.'))
    } finally {
      setExporting(false)
    }
  }

  async function handleDownload() {
    if (!jobGuid) return
    setDownloading(true)
    try {
      const opened = await downloadReportJob(jobGuid)
      if (!opened) showError('Mock mode: there’s no real file to download.')
    } catch (err) {
      if (err instanceof AuthError && err.code === 'report_expired') {
        setJobGuid(null)
        showError('This report has expired. Please export it again.')
        jobsQuery.refetch()
      } else {
        showError(reportErrorMessage(err, 'Couldn’t get the download link. Please try again.'))
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rpt-export">
      <Toast toast={toast} />
      {phase === 'processing' && <span className="rpt-export-msg" aria-live="polite">Building the Excel file…</span>}
      {phase === 'ready' && (
        <span className="rpt-export-msg ok" aria-live="polite">
          {job?.rowCount != null ? `Ready · ${fmtReportCount(job.rowCount)} rows` : 'Ready'}
        </span>
      )}
      {phase === 'processing' ? (
        <button type="button" className="btn btn-primary btn-sm" disabled aria-busy="true">
          <i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Processing…
        </button>
      ) : phase === 'ready' ? (
        <button type="button" className="btn btn-success btn-sm" onClick={handleDownload} disabled={downloading}>
          <i className={`lni ${downloading ? 'lni-spinner-arrow spin' : 'lni-download'}`} aria-hidden="true" /> Download Excel
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => guard('export', runExport, 'this report')}>
          <i className={`lni ${phase === 'failed' ? 'lni-reload' : 'lni-download'}`} aria-hidden="true" /> {phase === 'failed' ? 'Try again' : 'Export to Excel'}
        </button>
      )}
    </div>
  )
}
