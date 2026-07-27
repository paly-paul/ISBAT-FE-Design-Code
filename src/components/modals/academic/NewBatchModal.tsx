'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BatchCreateInput } from '@/lib/api/academic/batch'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useStreams } from '@/hooks/config/useStreams'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { useEmployees } from '@/hooks/employee/useEmployees'

interface NewBatchModalProps extends ModalProps {
  createBatch: {
    mutate: (input: BatchCreateInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

// intProgram/intSem/intStream/batchTime/bInCharge are all unconfirmed
// numbers — see the long note on Batch in lib/api/academic/batch.ts. Every
// dropdown here is real (backed by the actual masters), but the value sent
// for these five fields is that option's 1-based position in its list, not
// a confirmed id — same approach used for enquiry-followup's Create form.
export function NewBatchModal({ isOpen, onClose, showToast, createBatch }: NewBatchModalProps) {
  const { data: programs = [] } = useProgramMasters()
  const { data: intakes = [] }  = useIntakes()
  const { data: streams = [] }  = useStreams()
  const { data: batchTimes = [] } = useBatchTimes()
  const { data: employees = [] }  = useEmployees()

  const [programGuid, setProgramGuid] = useState('')
  const { data: semesters = [] } = useSemestersForProgram(programGuid, !!programGuid)

  const programOptions   = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const intakeOptions    = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  const semesterOptions  = semesters.map((s, i) => ({ value: String(i), label: s.semName }))
  const streamOptions    = streams.map((s, i) => ({ value: String(i), label: s.streamName }))
  const batchTimeOptions = batchTimes.map((b, i) => ({ value: String(i), label: b.batchTime }))
  const advisorOptions   = employees.map((e, i) => ({ value: String(i), label: e.empName }))

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [intakeGuid, setIntakeGuid]   = useState('')
  const [semesterIdx, setSemesterIdx] = useState('')
  const [streamIdx, setStreamIdx]     = useState('')
  const [timeIdx, setTimeIdx]         = useState('')
  const [inChargeIdx, setInChargeIdx] = useState('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setProgramGuid(''); setIntakeGuid(''); setSemesterIdx(''); setStreamIdx(''); setTimeIdx(''); setInChargeIdx('')
    setStartDate(''); setEndDate(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!programGuid)  e.programGuid = 'Please select a Programme'
    if (!intakeGuid)   e.intakeGuid = 'Please select an Intake'
    if (!semesterIdx)  e.semesterIdx = 'Please select a Semester'
    if (!streamIdx)    e.streamIdx = 'Please select a Stream'
    if (!timeIdx)      e.timeIdx = 'Please select a Batch Time'
    if (!inChargeIdx)  e.inChargeIdx = 'Please select a Batch In-Charge'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const intake = intakes.find(i => i.intakeGuid === intakeGuid)
    if (!intake) return
    createBatch.mutate(
      {
        intProgram: programs.findIndex(p => p.programGuid === programGuid) + 1,
        intSem: Number(semesterIdx) + 1,
        intStream: Number(streamIdx) + 1,
        batchTime: Number(timeIdx) + 1,
        bStartDate: startDate ? `${startDate}T00:00:00` : null,
        bEndDate: endDate ? `${endDate}T00:00:00` : null,
        bInCharge: Number(inChargeIdx) + 1,
        intakeCode: intake.intakeCode,
      },
      {
        onSuccess: () => { setSaved(true); showToast('Batch created successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to create batch. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Created!" subtitle="The new batch has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Create Batch" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-batch-modal">
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-users"></i> Create New Batch</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rxs)', marginBottom: 14 }}>
          <i className="lni lni-warning" style={{ color: 'var(--amber)', marginTop: 2 }}></i>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>
            Programme/Semester/Stream/Batch Time/Batch In-Charge are sent as list position, not a confirmed backend id — this may create the batch against the wrong record until the real mapping is confirmed. Batch Code is generated by the backend.
          </span>
        </div>

        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select programme —"
              options={programOptions}
              value={programGuid}
              onChange={val => { setProgramGuid(val); setSemesterIdx(''); if (errors.programGuid) setErrors(p => ({ ...p, programGuid: '' })) }}
            />
            {errors.programGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.programGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Intake <span className="req">*</span></div>
            <SearchSelect placeholder="— Select intake —" options={intakeOptions} value={intakeGuid} onChange={val => { setIntakeGuid(val); if (errors.intakeGuid) setErrors(p => ({ ...p, intakeGuid: '' })) }} />
            {errors.intakeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Semester <span className="req">*</span></div>
            <SearchSelect placeholder={programGuid ? '— Select semester —' : 'Select a programme first'} options={semesterOptions} value={semesterIdx} onChange={val => { setSemesterIdx(val); if (errors.semesterIdx) setErrors(p => ({ ...p, semesterIdx: '' })) }} />
            {errors.semesterIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.semesterIdx}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Stream <span className="req">*</span></div>
            <SearchSelect placeholder="— Select stream —" options={streamOptions} value={streamIdx} onChange={val => { setStreamIdx(val); if (errors.streamIdx) setErrors(p => ({ ...p, streamIdx: '' })) }} />
            {errors.streamIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamIdx}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time <span className="req">*</span></div>
            <SearchSelect placeholder="— Select batch time —" options={batchTimeOptions} value={timeIdx} onChange={val => { setTimeIdx(val); if (errors.timeIdx) setErrors(p => ({ ...p, timeIdx: '' })) }} />
            {errors.timeIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.timeIdx}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch In-Charge <span className="req">*</span></div>
            <SearchSelect placeholder="— Select faculty member —" options={advisorOptions} value={inChargeIdx} onChange={val => { setInChargeIdx(val); if (errors.inChargeIdx) setErrors(p => ({ ...p, inChargeIdx: '' })) }} />
            {errors.inChargeIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.inChargeIdx}</p>}
          </div>
          <div className="fg"><div className="lbl">Start Date</div><input className="ctrl" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="fg"><div className="lbl">End Date</div><input className="ctrl" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>

        <div className="info-box mt-3">
          <i className="lni lni-information"></i>
          Batch In-Charge can view batch-level reports but has no direct relation to programme course content.
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={createBatch.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {createBatch.isPending ? 'Creating…' : 'Create Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}
