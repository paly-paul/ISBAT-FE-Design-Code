'use client'

import { useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { 
  useGraduateTranscriptPending, 
  useGenerateGraduateTranscripts 
} from '@/hooks/assessment/useGraduateTranscript'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'

import { Toast } from '@/components/Toast'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i
  return { value: y, label: y.toString() }
})

export default function GraduateTranscriptPage() {
  const [academicIntakeGuid, setAcademicIntakeGuid] = useState<string>('')
  const [programGuid, setProgramGuid] = useState<string>('')
  
  const [examMonth, setExamMonth] = useState<number | ''>('')
  const [examYear, setExamYear] = useState<number | ''>('')
  
  const [selectedGuids, setSelectedGuids] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<{ msg: string, type: 'success' | 'error' | 'warn' | 'info' | 'danger' } | null>(null)
  
  const [successData, setSuccessData] = useState<{ created: number, refreshed: number } | null>(null)

  const { data: intakes, isLoading: isLoadingIntakes } = useIntakesDropdown()
  const { data: programs, isLoading: isLoadingPrograms } = useProgramDropdown()

  const { data: pendingList, isLoading: isLoadingPending } = useGraduateTranscriptPending(
    academicIntakeGuid || null, 
    programGuid || null
  )

  const generateMut = useGenerateGraduateTranscripts()

  const showToast = (msg: string, type: 'success' | 'error' | 'warn' | 'info' | 'danger' = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const toggleAll = () => {
    if (!pendingList) return
    if (selectedGuids.size === pendingList.length) {
      setSelectedGuids(new Set())
    } else {
      setSelectedGuids(new Set(pendingList.map(s => s.studentGuid)))
    }
  }

  const toggleOne = (guid: string) => {
    const next = new Set(selectedGuids)
    if (next.has(guid)) next.delete(guid)
    else next.add(guid)
    setSelectedGuids(next)
  }

  const handleGenerate = () => {
    if (!academicIntakeGuid || selectedGuids.size === 0) return
    
    if (!examMonth || !examYear) {
      showToast('Please select Exam Month and Exam Year to generate certificates.', 'error')
      return
    }
    
    generateMut.mutate({
      academicIntakeGuid,
      examMonth: Number(examMonth),
      examYear: Number(examYear),
      studentGuids: Array.from(selectedGuids)
    }, {
      onSuccess: (res) => {
        setSuccessData({ created: res.created, refreshed: res.refreshed })
        setSelectedGuids(new Set())
      },
      onError: () => {
        showToast('Failed to generate certificates. Please try again.', 'error')
      }
    })
  }

  const isGenerateDisabled = !academicIntakeGuid || selectedGuids.size === 0 || generateMut.isPending

  return (
    <div className="page active">
      <Toast toast={toastMessage} />
      
      {successData && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup
              title="Certificates Generated!"
              subtitle={`Successfully generated ${successData.created} new certificates and refreshed ${successData.refreshed} existing ones.`}
              onClose={() => setSuccessData(null)}
            />
          </div>
        </div>
      )}

      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">Graduate Transcript</h1>
          <p className="pg-sub">Bulk-generate official, QR-verifiable graduate transcript certificates.</p>
        </div>
        <div>
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate} 
            disabled={isGenerateDisabled}
          >
            {generateMut.isPending ? <i className="lni lni-spinner-solid animate-spin"></i> : <i className="lni lni-certificate"></i>} 
            Generate Selected ({selectedGuids.size})
          </button>
        </div>
      </div>

      <div className="card mb-5">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Academic Intake <span className="text-rose-500">*</span></label>
            <SearchSelect
              placeholder="Select Intake"
              value={academicIntakeGuid}
              onChange={(val) => {
                setAcademicIntakeGuid(val)
                setSelectedGuids(new Set())
              }}
              disabled={isLoadingIntakes}
              options={[
                { value: '', label: 'Select Intake' },
                ...(intakes || []).map((i: any) => ({
                  value: i.intakeGuid,
                  label: i.description
                }))
              ]}
            />
          </div>
          <div className="form-group mb-0">
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Programme <span className="text-rose-500">*</span></label>
            <SearchSelect
              placeholder="Select Programme"
              value={programGuid}
              onChange={(val) => {
                setProgramGuid(val)
                setSelectedGuids(new Set())
              }}
              disabled={isLoadingPrograms}
              options={[
                { value: '', label: 'Select Programme' },
                ...(programs || []).map((p: any) => ({
                  value: p.programGuid,
                  label: p.programName
                }))
              ]}
            />
          </div>
          <div className="form-group mb-0">
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Exam Month <span className="text-rose-500">*</span></label>
            <SearchSelect
              placeholder="Select Month"
              value={examMonth}
              onChange={(val) => setExamMonth(val as number)}
              options={[
                { value: '', label: 'Select Month' },
                ...MONTHS
              ]}
            />
          </div>
          <div className="form-group mb-0">
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Exam Year <span className="text-rose-500">*</span></label>
            <SearchSelect
              placeholder="Select Year"
              value={examYear}
              onChange={(val) => setExamYear(val as number)}
              options={[
                { value: '', label: 'Select Year' },
                ...YEARS
              ]}
            />
          </div>
        </div>

        <ScrollTable>
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                    checked={pendingList && pendingList.length > 0 && selectedGuids.size === pendingList.length}
                    onChange={toggleAll}
                    disabled={!pendingList || pendingList.length === 0}
                  />
                </th>
                <th>Student No</th>
                <th>Student Name</th>
                <th>Programme</th>
              </tr>
            </thead>
            <tbody>
              {(!academicIntakeGuid || !programGuid) ? (
                <EmptyState colSpan={4} title="Select an Academic Intake and Programme to view pending students." />
              ) : isLoadingPending ? (
                <TableLoadingState colSpan={4} title="Loading pending students..." />
              ) : !pendingList || pendingList.length === 0 ? (
                <EmptyState colSpan={4} title="No pending students found in this cohort." />
              ) : (
                pendingList.map((student) => (
                  <tr key={student.studentGuid} className={selectedGuids.has(student.studentGuid) ? 'bg-indigo-50/30' : ''}>
                    <td className="text-center">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={selectedGuids.has(student.studentGuid)}
                        onChange={() => toggleOne(student.studentGuid)}
                      />
                    </td>
                    <td className="font-mono text-slate-700">{student.studentNumber}</td>
                    <td className="font-medium text-slate-800">{student.studentName}</td>
                    <td className="text-sm text-slate-500">{student.programName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
