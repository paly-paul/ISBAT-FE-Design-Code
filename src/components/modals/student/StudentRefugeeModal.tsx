'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SearchSelect } from '@/components/SearchSelect'
import { useStudentRefugeeDetails, useAssignRefugeeStatus, useRemoveRefugeeStatus } from '@/hooks/student/useRefugee'
import { useCountries } from '@/hooks/config/useCountries'

interface Props extends ModalProps {
  studentGuid: string | null
  studentName?: string
}

// Same refugee-status assign/remove workflow already on the Student Profile
// page (students/student-refugee/*.md), pulled out into its own modal so
// Student Master's row action menu can grant/view/remove refugee status
// without a trip through Profile first. Reuses the same hooks, so both
// entry points share one cache — granting status here is reflected on
// Profile's own refugee row immediately (react-query invalidation, see
// useRefugee.ts) and vice versa.
export function StudentRefugeeModal({ isOpen, onClose, showToast, studentGuid, studentName }: Props) {
  const { data: refugeeDetail, isLoading } = useStudentRefugeeDetails(studentGuid, isOpen)
  const assignRefugeeStatus = useAssignRefugeeStatus()
  const removeRefugeeStatus = useRemoveRefugeeStatus()
  const { data: countries = [] } = useCountries()
  // intCountryCode has no confirmed mapping back to a real country guid (see
  // the note on CountryDropdownDto/EmployeeFormModal's own country field) —
  // sent as the option's 1-based list position, same convention used there.
  const countryOptions = countries.map((c, i) => ({ value: String(i + 1), label: c.countryName }))

  const [countryCode, setCountryCode] = useState('')
  const [refugeeId, setRefugeeId] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setCountryCode('')
    setRefugeeId('')
    setDocFile(null)
  }, [isOpen])

  if (!isOpen || !studentGuid) return null

  function handleAssign() {
    if (!studentGuid) return
    const code = Number(countryCode)
    if (!countryCode.trim() || Number.isNaN(code) || code < 1) { showToast('A valid country code is required.', 'warn'); return }
    if (!refugeeId.trim()) { showToast('Refugee ID is required.', 'warn'); return }
    if (refugeeId.trim().length > 20) { showToast('Refugee ID must be 20 characters or fewer.', 'warn'); return }
    if (!docFile) { showToast('A supporting document is required.', 'warn'); return }
    assignRefugeeStatus.mutate(
      { studentGuid, intCountryCode: code, refugeeId: refugeeId.trim(), document: docFile },
      {
        onSuccess: () => showToast('Refugee status granted', 'ok'),
        onError: (error: Error) => showToast(error.message || 'Could not assign refugee status', 'err'),
      }
    )
  }

  function handleRemove() {
    if (!studentGuid) return
    removeRefugeeStatus.mutate(studentGuid, {
      onSuccess: () => showToast('Refugee status removed', 'ok'),
      onError: (error: Error) => showToast(error.message || 'Could not remove refugee status', 'err'),
    })
  }

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr"><div className="modal-title"><i className="lni lni-shield"></i> Refugee Status</div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div>
          {studentName && <div className="fg"><label className="lbl">Student</label><input className="ctrl" readOnly value={studentName} /></div>}

          {isLoading ? (
            <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading refugee status…</div>
          ) : refugeeDetail ? (
            <>
              <div className="info-box mb-3"><i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12.5 }}>This student already has refugee status on record.</div></div>
              <div className="fg"><label className="lbl">Refugee ID</label><input className="ctrl" readOnly value={refugeeDetail.refugeeId ?? '—'} /></div>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="lbl">Country <span className="req">*</span></label>
                <SearchSelect placeholder="-- Select Country --" options={countryOptions} value={countryCode} onChange={setCountryCode} />
              </div>
              <div className="fg"><label className="lbl">Refugee ID <span className="req">*</span></label><input className="ctrl" maxLength={20} value={refugeeId} onChange={e => setRefugeeId(e.target.value)} placeholder="Refugee document/registration number" /></div>
              <div className="fg">
                <label className="lbl">Supporting Document <span className="req">*</span></label>
                <input className="ctrl" type="file" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                <div style={{ fontSize: 11.5, color: 'var(--g500)', marginTop: 4 }}>Required — the request is rejected without it.</div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          {!isLoading && (
            refugeeDetail ? (
              <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={handleRemove} disabled={removeRefugeeStatus.isPending}>
                <i className="lni lni-close"></i> {removeRefugeeStatus.isPending ? 'Removing…' : 'Remove Status'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleAssign} disabled={assignRefugeeStatus.isPending}>
                <i className="lni lni-checkmark"></i> {assignRefugeeStatus.isPending ? 'Saving…' : 'Grant Status'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
