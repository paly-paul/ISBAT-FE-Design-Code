'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BatchUpdateInput, EMPTY_GUID } from '@/lib/api/academic/batch'
import { useBatch } from '@/hooks/academic/useBatches'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useStreams } from '@/hooks/config/useStreams'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

interface EditBatchModalProps extends ModalProps {
  batchGuid: string | null
  updateBatch: {
    mutate: (variables: { guid: string; input: BatchUpdateInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

// Update takes the same full-replace shape as Create (confirmed) —
// programGuid/semesterGuid/streamGuid/batchTimeGuid/bInCharge/intakeGuid are
// all applied. GET /batches/:guid returns real guids for all six fields (see
// BatchDetail in lib/api/academic/batch.ts) — corrected from the earlier
// belief that Intake/Batch In-Charge couldn't be prefilled; a real sample
// response confirmed both are present. bInCharge comes back as the all-zero
// sentinel guid when no one's assigned — treated as unset/empty, not matched
// against the Employee master. Batch In-Charge is sent as the employee's
// real employeeGuid (a live sample payload confirmed this, replacing the old
// list-position workaround — see the note in NewBatchModal).
export function EditBatchModal({ isOpen, onClose, showToast, batchGuid, updateBatch }: EditBatchModalProps) {
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
  const advisorOptions   = employees.map(e => ({ value: e.employeeGuid, label: e.empName }))

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [intakeGuid, setIntakeGuid]       = useState('')
  const [semesterGuid, setSemesterGuid]   = useState('')
  const [streamGuid, setStreamGuid]       = useState('')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [inChargeGuid, setInChargeGuid]   = useState('')
  const [pHeadGuid, setPHeadGuid]         = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  // Every field now prefills from the fetched record — GET returns real
  // guids for all of Programme/Semester/Stream/Batch Time/Intake/In-Charge.
  // bInCharge's all-zero sentinel guid means "nobody assigned yet", so that
  // maps to the empty selection rather than an unmatched employee.
  useEffect(() => {
    if (!isOpen || !batch) return
    setProgramGuid(batch.programGuid)
    setIntakeGuid(batch.intakeGuid)
    setSemesterGuid(batch.semesterGuid)
    setStreamGuid(batch.streamGuid)
    setBatchTimeGuid(batch.batchTimeGuid)
    setInChargeGuid(batch.bInCharge && batch.bInCharge !== EMPTY_GUID ? batch.bInCharge : '')
    // pHead ("Programme Head") — same optional-employeeGuid shape as
    // bInCharge, so guarding against the same all-zero sentinel by analogy
    // (not independently confirmed for this field specifically).
    setPHeadGuid(batch.pHead && batch.pHead !== EMPTY_GUID ? batch.pHead : '')
    setStartDate(batch.bStartDate ? batch.bStartDate.slice(0, 10) : '')
    setEndDate(batch.bEndDate ? batch.bEndDate.slice(0, 10) : '')
    setErrors({})
  }, [isOpen, batch])

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setProgramGuid(''); setIntakeGuid(''); setSemesterGuid(''); setStreamGuid(''); setBatchTimeGuid(''); setInChargeGuid('')
    setPHeadGuid('')
    setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!programGuid)   e.programGuid = 'Please select a Programme'
    if (!intakeGuid)    e.intakeGuid = 'Please select an Intake'
    if (!semesterGuid)  e.semesterGuid = 'Please select a Semester'
    if (!streamGuid)    e.streamGuid = 'Please select a Specialization'
    if (!batchTimeGuid) e.batchTimeGuid = 'Please select a Batch Time'
    if (!inChargeGuid)  e.inChargeGuid = 'Please select a Batch In-Charge'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!batchGuid || !validate()) return
    updateBatch.mutate(
      {
        guid: batchGuid,
        input: {
          programGuid,
          semesterGuid,
          streamGuid,
          batchTimeGuid,
          bStartDate: startDate ? `${startDate}T00:00:00` : null,
          bEndDate: endDate ? `${endDate}T00:00:00` : null,
          bInCharge: inChargeGuid,
          intakeGuid,
          pHead: pHeadGuid || null,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Batch updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update batch. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Batch" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
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
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch</div>
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
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch — {batch.batchCode}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g3">
          {/* Intake/Programme/Semester/Batch Time are locked on Edit — the
              batch's students are already enrolled against this exact
              combination, so changing any of them here would silently
              re-scope an existing cohort rather than create a new one.
              Still prefilled and still sent in the update payload as-is,
              just not user-editable. */}
          <div className="fg">
            <div className="lbl">Intake <span className="req">*</span></div>
            <SearchSelect placeholder="— Select intake —" options={intakeOptions} value={intakeGuid} disabled />
            {errors.intakeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Programme <span className="req">*</span></div>
            <SearchSelect placeholder="— Select programme —" options={programOptions} value={programGuid} disabled />
            {errors.programGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.programGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Semester <span className="req">*</span></div>
            <SearchSelect placeholder={programGuid ? '— Select semester —' : 'Select a programme first'} options={semesterOptions} value={semesterGuid} disabled />
            {errors.semesterGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.semesterGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Specialization <span className="req">*</span></div>
            <SearchSelect placeholder="— Select specialization —" options={streamOptions} value={streamGuid} onChange={val => { setStreamGuid(val); if (errors.streamGuid) setErrors(p => ({ ...p, streamGuid: '' })) }} />
            {errors.streamGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time <span className="req">*</span></div>
            <SearchSelect placeholder="— Select batch time —" options={batchTimeOptions} value={batchTimeGuid} disabled />
            {errors.batchTimeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTimeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch In-Charge <span className="req">*</span></div>
            <SearchSelect placeholder="— Select faculty member —" options={advisorOptions} value={inChargeGuid} onChange={val => { setInChargeGuid(val); if (errors.inChargeGuid) setErrors(p => ({ ...p, inChargeGuid: '' })) }} />
            {errors.inChargeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.inChargeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Programme Head</div>
            <SearchSelect placeholder="— Select faculty member —" options={advisorOptions} value={pHeadGuid} onChange={setPHeadGuid} />
          </div>
          <div className="fg"><div className="lbl">Start Date</div><input className="ctrl" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="fg"><div className="lbl">End Date</div><input className="ctrl" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>


        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateBatch.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateBatch.isPending ? 'Updating…' : 'Update Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}
