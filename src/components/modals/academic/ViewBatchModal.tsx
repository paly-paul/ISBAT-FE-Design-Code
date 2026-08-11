'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BatchUpdateInput } from '@/lib/api/academic/batch'
import { useBatch } from '@/hooks/academic/useBatches'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useStreams } from '@/hooks/config/useStreams'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

interface ViewBatchModalProps extends ModalProps {
  batchGuid: string | null
}

// Update now takes the same full-replace shape as Create (confirmed) —
// programGuid/semesterGuid/streamGuid/batchTimeGuid/intakeCode are all
// applied, not just Stream/dates/In-Charge like before. GET /batches/:guid
// hasn't been confirmed to return matching guid fields yet (still only
// intProgram/intSem/intStream/batchTime as ints — see the note on Batch in
// lib/api/academic/batch.ts), so none of these can be prefilled from the
// current record; every field must be re-selected on every edit, same as
// Stream/In-Charge already were before this change. Batch In-Charge is
// still sent as list position — see the note in NewBatchModal.
export function ViewBatchModal({ isOpen, onClose, showToast, batchGuid }: ViewBatchModalProps) {
  const { data: batch, isLoading, isError, error } = useBatch(batchGuid, isOpen)
  const { data: programs = [] }   = useProgramMasters()
  const { data: intakes = [] }    = useIntakes()
  const { data: streams = [] }    = useStreams()
  const { data: batchTimes = [] } = useBatchTimes()
  const { data: employees = [] }  = useEmployees()

  const [programGuid, setProgramGuid] = useState('')
  const { data: semesters = [] } = useSemestersForProgram(programGuid, !!programGuid)

  const programOptions   = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const intakeOptions    = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  const semesterOptions  = semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))
  const streamOptions    = streams.map(s => ({ value: s.streamGuid, label: s.streamName }))
  const batchTimeOptions = batchTimes.map(b => ({ value: b.batchTimeGuid, label: b.batchTime }))
  const advisorOptions   = employees.map((e, i) => ({ value: String(i), label: e.empName }))

  const [intakeGuid, setIntakeGuid]       = useState('')
  const [semesterGuid, setSemesterGuid]   = useState('')
  const [streamGuid, setStreamGuid]       = useState('')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [inChargeIdx, setInChargeIdx]     = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')

  // Programme/Semester/Stream/Batch Time/dates all prefill from the fetched
  // record now that GET returns real guids for them. Intake and Batch
  // In-Charge still can't — Batch's GET shape has no intake field at all,
  // and there's no confirmed guid/int source for the employee either (see
  // the note in NewBatchModal) — both must be re-picked every time.
  useEffect(() => {
    if (!isOpen || !batch) return
    setProgramGuid(batch.programGuid)
    setIntakeGuid('')
    setSemesterGuid(batch.semesterGuid)
    setStreamGuid(batch.streamGuid)
    setBatchTimeGuid(batch.batchTimeGuid)
    setInChargeIdx('')
    setStartDate(batch.bStartDate ? batch.bStartDate.slice(0, 10) : '')
    setEndDate(batch.bEndDate ? batch.bEndDate.slice(0, 10) : '')
  }, [isOpen, batch])

  if (!isOpen) return null

  function handleClose() {
    onClose()
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Batch"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load batch details.') : 'Failed to load batch details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !batch) {
    return (
      <div className="modal-overlay open" id="edit-batch-modal">
        <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Batch</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading batch details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-batch-modal">
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Batch — {batch.batchCode}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g3">
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programs.find(p => p.programGuid === programGuid)?.programName || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Semester</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {semesters.find(s => s.semesterGuid === semesterGuid)?.semName || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Specialization</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {streams.find(s => s.streamGuid === streamGuid)?.streamName || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Batch Time</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {batchTimes.find(b => b.batchTimeGuid === batchTimeGuid)?.batchTime || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Start Date</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {startDate || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>End Date</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {endDate || '—'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
