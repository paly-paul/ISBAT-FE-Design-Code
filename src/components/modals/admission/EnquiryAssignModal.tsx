'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { EnquiryUpdateInput } from '@/lib/api/admission/enquiry'
import { useEnquiry } from '@/hooks/admission/useEnquiries'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useCampuses } from '@/hooks/config/useCampuses'
import { AuthError } from '@/lib/api/client'

interface EnquiryAssignModalProps extends ModalProps {
  enquiryGuid: string | null
  updateEnquiry: {
    mutate: (variables: { guid: string; input: EnquiryUpdateInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

// Update.bru's payload only carries advisorGuid/programGuid/campusGuid
// (campusGuid required, the rest optional) — this is a staff assignment
// action, not a full edit of the enquiry's original details, which are
// shown read-only above the editable fields. enquiryStatus is left out —
// see the note on EnquiryUpdateInput in lib/api/admission/enquiry.ts.
export function EnquiryAssignModal({ isOpen, onClose, showToast, enquiryGuid, updateEnquiry }: EnquiryAssignModalProps) {
  const { data: enquiry, isLoading, isError, error } = useEnquiry(enquiryGuid, isOpen)
  const { data: employees = [] } = useEmployees()
  const { data: programs = [] }  = useProgramMasters()
  const { data: campuses = [] }  = useCampuses()

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [advisorGuid, setAdvisorGuid] = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [campusGuid, setCampusGuid]   = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  const advisorOptions = employees.map(e => ({ value: e.employeeGuid, label: e.empName }))
  const programOptions = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const campusOptions  = campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))

  // Prefill once the enquiry loads. Re-runs whenever a different guid is
  // fetched (react-query resets `enquiry` to undefined when enquiryGuid
  // changes, so stale data never leaks between rows).
  useEffect(() => {
    if (!isOpen || !enquiry) return
    setAdvisorGuid(enquiry.advisorGuid ?? '')
    setProgramGuid(enquiry.programGuid ?? '')
    setCampusGuid(enquiry.campusGuid)
    setErrors({})
  }, [isOpen, enquiry])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!campusGuid) e.campusGuid = 'Please select a Campus'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!enquiryGuid || !validate()) return
    updateEnquiry.mutate(
      { guid: enquiryGuid, input: { advisorGuid: advisorGuid || null, programGuid: programGuid || null, campusGuid } },
      {
        onSuccess: () => { setSaved(true); showToast('Enquiry updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update enquiry. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Enquiry Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Enquiry" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Enquiry"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load enquiry details.') : 'Failed to load enquiry details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !enquiry) {
    return (
      <div className="modal-overlay open" id="enquiry-assign-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> Enquiry Details</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading enquiry details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="enquiry-assign-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> Enquiry Details — {enquiry.enquiryCode}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        {/* Read-only — the update endpoint doesn't accept these fields at all */}
        <div className="g2" style={{ marginBottom: 18 }}>
          <div className="fg m-0"><div className="lbl">Name</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.studentName}</div></div>
          <div className="fg m-0"><div className="lbl">Phone</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.mobile}</div></div>
          <div className="fg m-0"><div className="lbl">Email</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.email || '—'}</div></div>
          <div className="fg m-0"><div className="lbl">Enquiry Date</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.enquiryDate.slice(0, 10)}</div></div>
          <div className="fg m-0"><div className="lbl">Source</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.sourceName || '—'}</div></div>
          <div className="fg m-0"><div className="lbl">Remarks</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>{enquiry.remarks || '—'}</div></div>
        </div>

        <div className="sec-divider">Assign</div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Advisor</div>
            <SearchSelect placeholder="— unassigned —" options={advisorOptions} value={advisorGuid} onChange={setAdvisorGuid} />
          </div>
          <div className="fg">
            <div className="lbl">Programme</div>
            <SearchSelect placeholder="— select —" options={programOptions} value={programGuid} onChange={setProgramGuid} />
          </div>
          <div className="fg">
            <div className="lbl">Campus <span className="req">*</span></div>
            <SearchSelect
              placeholder="— select —"
              options={campusOptions}
              value={campusGuid}
              onChange={val => { setCampusGuid(val); if (errors.campusGuid) setErrors(p => ({ ...p, campusGuid: '' })) }}
            />
            {errors.campusGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusGuid}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateEnquiry.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateEnquiry.isPending ? 'Saving…' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}
