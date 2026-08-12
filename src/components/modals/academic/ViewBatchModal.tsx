'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
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

export function ViewBatchModal({ isOpen, onClose, showToast, batchGuid }: ViewBatchModalProps) {
  const { data: batch, isLoading, isError, error } = useBatch(batchGuid, isOpen)
  const { data: programs = [] }   = useProgramMasters()
  const { data: intakes = [] }    = useIntakes()
  const { data: streams = [] }    = useStreams()
  const { data: batchTimes = [] } = useBatchTimes()
  const { data: employees = [] }  = useEmployees()

  const [programGuid, setProgramGuid] = useState('')
  const { data: semesters = [] } = useSemestersForProgram(programGuid, !!programGuid)

  const [activeSection, setActiveSection] = useState<'basic' | 'schedule'>('basic')

  const [intakeGuid, setIntakeGuid]       = useState('')
  const [semesterGuid, setSemesterGuid]   = useState('')
  const [streamGuid, setStreamGuid]       = useState('')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [inChargeIdx, setInChargeIdx]     = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')

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
        <div className="modal modal-xl modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
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
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Batch — <span className="font-mono">{batch.batchCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fsm-layout" style={{ borderTop: '1px solid var(--g200)' }}>
          {/* Left sidebar */}
          <div className="fsm-sidebar">
            <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Batch Information
            </div>
            <div style={{ padding: '0 8px', marginBottom: 12 }}>
              <div
                onClick={() => setActiveSection('basic')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                  background: activeSection === 'basic' ? 'var(--b500)' : 'transparent',
                  color: activeSection === 'basic' ? '#fff' : 'var(--g700)',
                  cursor: 'pointer', transition: 'background .15s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'basic' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="lni lni-information" style={{ fontSize: 13, color: activeSection === 'basic' ? '#fff' : 'var(--b600)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Basic Details</div>
                </div>
              </div>
              <div
                onClick={() => setActiveSection('schedule')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                  background: activeSection === 'schedule' ? 'var(--b500)' : 'transparent',
                  color: activeSection === 'schedule' ? '#fff' : 'var(--g700)',
                  cursor: 'pointer', transition: 'background .15s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'schedule' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="lni lni-calendar" style={{ fontSize: 13, color: activeSection === 'schedule' ? '#fff' : 'var(--b600)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Schedule & Timing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right main panel */}
          <div className="fsm-main modal-scroll" style={{ padding: '24px' }}>
            {activeSection === 'basic' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-information" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Basic Details</div>
                    <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>Academic mappings for this batch</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Programme</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {programs.find(p => p.programGuid === programGuid)?.programName || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Semester</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {semesters.find(s => s.semesterGuid === semesterGuid)?.semName || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Specialization</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {streams.find(s => s.streamGuid === streamGuid)?.streamName || '—'}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'schedule' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-calendar" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Schedule & Timing</div>
                    <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>Session timings and dates</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Batch Time</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {batchTimes.find(b => b.batchTimeGuid === batchTimeGuid)?.batchTime || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Start Date</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {startDate || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>End Date</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {endDate || '—'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
