'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IaStructureRowDto } from '@/lib/api/assessment/iaCreation'
import { useIaTestSchedule } from '@/hooks/assessment/useIaTestSchedule'
import { useIaCwSchedule } from '@/hooks/assessment/useIaCwSchedule'

interface Props {
  row: IaStructureRowDto | null
  progName: string
  semName: string
  onClose: () => void
  onEditCw?: (courseworkGuid: string) => void
  onEditCt?: (classTestGuid: string) => void
}

export function IaStructureViewModal({ row, progName, semName, onClose, onEditCw, onEditCt }: Props) {
  const [activeTab, setActiveTab] = useState<'CW' | 'CT' | 'UE'>('CT')
  
  // Fetch details for CT and CW
  const { data: ctSchedule, isLoading: ctLoading } = useIaTestSchedule(row?.classTestGuid || null)
  const { data: cwSchedule, isLoading: cwLoading } = useIaCwSchedule(row?.courseworkGuid || null)

  if (!row) return null

  // Helper to safely format dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString(undefined, { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // No editLink needed anymore, we use callbacks

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-md modal-flex" style={{ maxWidth: '800px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-hdr modal-hdr-blue" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
          <div className="modal-title text-white font-medium text-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="lni lni-eye" style={{ fontSize: '18px' }}></i> View Structure — {row.unitCode}
          </div>
          <button className="modal-close text-white hover:text-white/80 transition-colors" onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <i className="lni lni-close" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-g200 px-8 pt-4">
          <button 
            className={`flex-1 flex justify-center items-center gap-2 pb-4 text-[13.5px] font-medium transition-colors border-b-[2px] ${activeTab === 'CW' ? 'border-blue-500 text-blue-600' : 'border-transparent text-g600 hover:text-g800'}`}
            onClick={() => setActiveTab('CW')}
          >
            <i className="lni lni-book" style={{ fontSize: '16px' }} /> Course Work
          </button>
          <button 
            className={`flex-1 flex justify-center items-center gap-2 pb-4 text-[13.5px] font-medium transition-colors border-b-[2px] ${activeTab === 'CT' ? 'border-blue-500 text-blue-600' : 'border-transparent text-g600 hover:text-g800'}`}
            onClick={() => setActiveTab('CT')}
          >
            <i className="lni lni-pencil" style={{ fontSize: '16px' }} /> Class Test
          </button>
          <button 
            className={`flex-1 flex justify-center items-center gap-2 pb-4 text-[13.5px] font-medium transition-colors border-b-[2px] ${activeTab === 'UE' ? 'border-blue-500 text-blue-600' : 'border-transparent text-g600 hover:text-g800'}`}
            onClick={() => setActiveTab('UE')}
          >
            <i className="lni lni-graduation" style={{ fontSize: '16px' }} /> University Exam
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-scroll p-8 bg-white flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-y-8 gap-x-6">
            
            <div className="col-span-3">
              <div className="text-[12.5px] font-medium text-g500 mb-1">Subject</div>
              <div className="text-[14.5px] text-g900 font-medium">{row.unitCode} — {row.unitName}</div>
            </div>

            {activeTab === 'CW' && (
              <>
                {cwLoading ? (
                  <div className="col-span-3 py-8 text-center text-g500">Loading Course Work details...</div>
                ) : cwSchedule ? (
                  <>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Max Mark</div>
                      <div className="text-[14.5px] text-g900">{cwSchedule.maxMark ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Start Date & Time</div>
                      <div className="text-[14.5px] text-g900">{formatDate(cwSchedule.scheduledStartDateTime)}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">End Date & Time</div>
                      <div className="text-[14.5px] text-g900">{formatDate(cwSchedule.scheduledEndDateTime)}</div>
                    </div>

                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Duration</div>
                      <div className="text-[14.5px] text-g900">—</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Test Type</div>
                      <div className="text-[14.5px] text-g900">{cwSchedule.courseworkType === 1 ? 'Offline' : 'Online'}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Publish Status</div>
                      <div className="text-[14.5px] text-g900">
                        {cwSchedule.publishStatus === 1 ? 'Published' : 'Unpublished'}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Exam Rule</div>
                      <div className="text-[14.5px] text-g900">
                        {cwSchedule.examRuleCode ? `${cwSchedule.examRuleCode} — ${cwSchedule.examRuleName}` : 'No rule linked'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 py-8 text-center text-g500 italic">No detailed schedule found for this Course Work.</div>
                )}
              </>
            )}

            {activeTab === 'CT' && (
              <>
                {ctLoading ? (
                  <div className="col-span-3 py-8 text-center text-g500">Loading Class Test details...</div>
                ) : ctSchedule ? (
                  <>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Max Mark</div>
                      <div className="text-[14.5px] text-g900">{ctSchedule.maxMark ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Start Date & Time</div>
                      <div className="text-[14.5px] text-g900">{formatDate(ctSchedule.scheduledStartDateTime)}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">End Date & Time</div>
                      <div className="text-[14.5px] text-g900">{formatDate(ctSchedule.scheduledEndDateTime)}</div>
                    </div>

                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Duration</div>
                      <div className="text-[14.5px] text-g900">{ctSchedule.durationMinutes ? `${ctSchedule.durationMinutes} mins` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Test Type</div>
                      <div className="text-[14.5px] text-g900">{ctSchedule.testType === 1 ? 'Offline' : 'Online'}</div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Publish Status</div>
                      <div className="text-[14.5px] text-g900">
                        {ctSchedule.publishStatus === 1 ? 'Published' : 'Unpublished'}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-[12.5px] font-medium text-g500 mb-1">Exam Rule</div>
                      <div className="text-[14.5px] text-g900">
                        {ctSchedule.examRuleCode ? `${ctSchedule.examRuleCode} — ${ctSchedule.examRuleName}` : 'No rule linked'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 py-8 text-center text-g500 italic">No detailed schedule found for this Class Test.</div>
                )}
              </>
            )}

            {activeTab === 'UE' && (
              <>
                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Max Mark</div>
                  <div className="text-[14.5px] text-g900">{row.universityExamMaxMark ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Start Date & Time</div>
                  <div className="text-[14.5px] text-g900">{formatDate(row.examDate && row.examStartTime ? `${row.examDate}T${row.examStartTime}` : null)}</div>
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">End Date & Time</div>
                  <div className="text-[14.5px] text-g900">{formatDate(row.examDate && row.examEndTime ? `${row.examDate}T${row.examEndTime}` : null)}</div>
                </div>

                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Duration</div>
                  <div className="text-[14.5px] text-g900">—</div>
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Test Type</div>
                  <div className="text-[14.5px] text-g900">—</div>
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Publish Status</div>
                  <div className="text-[14.5px] text-g900">—</div>
                </div>

                <div className="col-span-3">
                  <div className="text-[12.5px] font-medium text-g500 mb-1">Exam Rule</div>
                  <div className="text-[14.5px] text-g900">—</div>
                </div>
              </>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 flex justify-end gap-3" style={{ borderTop: 'none' }}>
          {activeTab === 'CT' && row.classTestGuid ? (
            <button className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '6px' }} onClick={() => { onClose(); onEditCt?.(row.classTestGuid!); }}>
              Edit
            </button>
          ) : activeTab === 'CW' && row.courseworkGuid ? (
            <button className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '6px' }} onClick={() => { onClose(); onEditCw?.(row.courseworkGuid!); }}>
              Edit
            </button>
          ) : (
            <button className="btn btn-primary opacity-50 cursor-not-allowed" style={{ padding: '8px 20px', borderRadius: '6px' }} title={`${activeTab} editing not implemented yet`}>
              Edit
            </button>
          )}
          <button className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '6px', background: '#3b82f6', border: 'none' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
