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

// Programme/Semester/Stream/Batch Time are now sent as real guids
// (confirmed via the updated Create schema — see BatchCreateInput in
// lib/api/academic/batch.ts). Batch In-Charge is the one field still
// unconfirmed — Employee only ever exposes employeeGuid, no matching int —
// so it's still sent as that option's 1-based position in its list, same
// approach used for enquiry-followup's Create form.
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
  const semesterOptions  = semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))
  const streamOptions    = streams.map(s => ({ value: s.streamGuid, label: s.streamName }))
  const batchTimeOptions = batchTimes.map(b => ({ value: b.batchTimeGuid, label: b.batchTime }))
  const advisorOptions   = employees.map((e, i) => ({ value: String(i), label: e.empName }))

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [intakeGuid, setIntakeGuid]       = useState('')
  const [semesterGuid, setSemesterGuid]   = useState('')
  const [streamGuid, setStreamGuid]       = useState('')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [inChargeIdx, setInChargeIdx]     = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setProgramGuid(''); setIntakeGuid(''); setSemesterGuid(''); setStreamGuid(''); setBatchTimeGuid(''); setInChargeIdx('')
    setStartDate(''); setEndDate(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!programGuid)    e.programGuid = 'Please select a Programme'
    if (!intakeGuid)     e.intakeGuid = 'Please select an Intake'
    if (!semesterGuid)   e.semesterGuid = 'Please select a Semester'
    if (!streamGuid)     e.streamGuid = 'Please select a Stream'
    if (!batchTimeGuid)  e.batchTimeGuid = 'Please select a Batch Time'
    if (!inChargeIdx)    e.inChargeIdx = 'Please select a Batch In-Charge'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const intake = intakes.find(i => i.intakeGuid === intakeGuid)
    if (!intake) return
    createBatch.mutate(
      {
        programGuid,
        semesterGuid,
        streamGuid,
        batchTimeGuid,
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
            Batch In-Charge is sent as list position, not a confirmed backend id — this may assign the wrong person until the real mapping is confirmed. Batch Code is generated by the backend.
          </span>
        </div>

        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select programme —"
              options={programOptions}
              value={programGuid}
              onChange={val => { setProgramGuid(val); setSemesterGuid(''); if (errors.programGuid) setErrors(p => ({ ...p, programGuid: '' })) }}
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
            <SearchSelect placeholder={programGuid ? '— Select semester —' : 'Select a programme first'} options={semesterOptions} value={semesterGuid} onChange={val => { setSemesterGuid(val); if (errors.semesterGuid) setErrors(p => ({ ...p, semesterGuid: '' })) }} />
            {errors.semesterGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.semesterGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Stream <span className="req">*</span></div>
            <SearchSelect placeholder="— Select stream —" options={streamOptions} value={streamGuid} onChange={val => { setStreamGuid(val); if (errors.streamGuid) setErrors(p => ({ ...p, streamGuid: '' })) }} />
            {errors.streamGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time <span className="req">*</span></div>
            <SearchSelect placeholder="— Select batch time —" options={batchTimeOptions} value={batchTimeGuid} onChange={val => { setBatchTimeGuid(val); if (errors.batchTimeGuid) setErrors(p => ({ ...p, batchTimeGuid: '' })) }} />
            {errors.batchTimeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTimeGuid}</p>}
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
