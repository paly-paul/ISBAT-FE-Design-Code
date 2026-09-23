'use client'
import { useState, useEffect, useRef } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { TableLoadingState } from '@/components/TableLoadingState'

import { getIntakes, Intake } from '@/lib/api/academic/intake'
import { getHallTicketSearch, HallTicketSearchResultDto } from '@/lib/api/student/hallTicketSearch'
import { getHallTicketEligibility, issueHallTicket, issueBulkHallTickets, getHallTicketPdfUrl, getBulkHallTicketPdfUrl, HallTicketEligibilityDto, BulkIssueResponseDto } from '@/lib/api/assessment/hallTicketIssue'

export default function HallTicketIssuancePage() {
  const [term, setTerm] = useState('Term 1')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [intakes, setIntakes] = useState<Intake[]>([])
  const [selectedIntake, setSelectedIntake] = useState<string>('')

  const [students, setStudents] = useState<HallTicketSearchResultDto[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<HallTicketSearchResultDto | null>(null)
  const [eligibility, setEligibility] = useState<HallTicketEligibilityDto | null>(null)
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)

  const [isIssuing, setIsIssuing] = useState(false)
  const [isBulkIssuing, setIsBulkIssuing] = useState(false)

  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null)
  const topCardRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch intakes on mount
  useEffect(() => {
    getIntakes().then(data => {
      setIntakes(data)
      const current = data.find(i => i.currentAdmissionIntake) || data[0]
      if (current) setSelectedIntake(current.intakeGuid)
    }).catch(err => console.error('Failed to load intakes:', err))
  }, [])

  // Search debounced
  useEffect(() => {
    if (!selectedIntake) return
    const timer = setTimeout(() => {
      setIsSearching(true)
      getHallTicketSearch(search, selectedIntake).then(data => {
        setStudents(data || [])
      }).catch(err => {
        console.error('Search error:', err)
        setStudents([])
      }).finally(() => setIsSearching(false))
    }, 500)

    return () => clearTimeout(timer)
  }, [search, selectedIntake])

  // Clear selection when term or intake changes
  useEffect(() => {
    setSelectedStudent(null)
    setEligibility(null)
  }, [term, selectedIntake])

  const handleRowClick = (student: HallTicketSearchResultDto) => {
    setSelectedStudent(student)
    setIsCheckingEligibility(true)
    setEligibility(null)

    setTimeout(() => {
      topCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)

    const termNum = term === 'Term 1' ? 1 : 2
    getHallTicketEligibility(student.studentGuid, selectedIntake, termNum)
      .then(data => {
        setEligibility(data)
      })
      .catch(err => {
        console.error('Eligibility error:', err)
        showToast(err.message || 'Failed to load eligibility', 'error')
      })
      .finally(() => setIsCheckingEligibility(false))
  }

  const handleIssue = () => {
    if (!selectedStudent || !selectedIntake || !eligibility?.canIssue) return

    setIsIssuing(true)
    const termNum = term === 'Term 1' ? 1 : 2

    issueHallTicket({
      studentGuid: selectedStudent.studentGuid,
      intakeGuid: selectedIntake,
      term: termNum
    })
      .then(() => {
        showToast('Hall ticket issued successfully', 'success')
        setEligibility(prev => prev ? { ...prev, alreadyIssued: true, canIssue: false } : null)
      })
      .catch(err => {
        console.error('Issue error:', err)
        showToast(err.message || 'Failed to issue hall ticket', 'error')
        // Re-fetch eligibility if blocked
        if (err.code === 'bad_request') {
          handleRowClick(selectedStudent)
        }
      })
      .finally(() => setIsIssuing(false))
  }

  const handleBulkIssue = () => {
    if (!selectedIntake) return
    if (!window.confirm('Are you sure you want to bulk issue hall tickets for ALL eligible students in this intake? This action may take some time.')) return

    setIsBulkIssuing(true)
    issueBulkHallTickets({ intakeGuid: selectedIntake, term: term === 'Term 1' ? 1 : 2 })
      .then((res) => {
        showToast(
          `Processed ${res.totalConsidered} students. Issued: ${res.issued}, Ineligible: ${res.ineligible}, Already Issued: ${res.alreadyIssued}, Failed: ${res.failed}`,
          res.issued > 0 ? 'success' : 'info'
        )
        // Re-evaluate eligibility for the selected student to update their UI
        if (selectedStudent) {
          handleRowClick(selectedStudent)
        }
      })
      .catch(err => {
        console.error('Bulk issue error:', err)
        showToast(err.message || 'Failed to bulk issue hall tickets', 'error')
      })
      .finally(() => setIsBulkIssuing(false))
  }

  return (
    <div className="page active h-full flex flex-col bg-slate-50/50">
      <div className="pg-hdr shrink-0 pb-4">
        <div>
          <div className="pg-title text-2xl font-bold text-slate-800">Hall Ticket Issuance</div>
          <div className="pg-sub text-slate-500 mt-1">Search and clear students to issue hall tickets for examinations</div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm mb-5 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-48">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Term</label>
            <SearchSelect
              options={[{ value: 'Term 1', label: 'Term 1' }, { value: 'Term 2', label: 'Term 2' }]}
              value={term} onChange={setTerm} className="w-full"
            />
          </div>
          <div className="w-full md:w-80">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Academic Session (Intake)</label>
            <SearchSelect
              options={intakes.map(i => ({ value: i.intakeGuid, label: i.description }))}
              value={selectedIntake} onChange={setSelectedIntake} className="w-full"
            />
          </div>
          <div className="flex-1 w-full relative group">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Student</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <i className="lni lni-search-alt text-lg"></i>
              </span>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none placeholder-slate-400"
                placeholder="Type name or registration number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

            {/* Top-Bottom Layout */}
      <div className="flex flex-col gap-5 flex-1 min-h-0">
        
        {/* Top: Horizontal Clearance Panel */}
        <div ref={topCardRef} className="bg-white border border-slate-200/80 rounded-xl shadow-sm shrink-0 flex flex-col md:flex-row items-stretch min-h-[140px]">
          {!selectedStudent ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
               <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                 <i className="lni lni-user text-2xl"></i>
               </div>
               <p className="text-sm font-medium text-slate-500">Select a student from the list below</p>
               <p className="text-xs mt-1">Their clearance details will appear here.</p>
             </div>
          ) : (
             <>
               {/* Section 1: Student Details */}
               <div className="flex-[1.4] flex items-center p-5 md:border-r border-b md:border-b-0 border-slate-100 bg-slate-50/30 min-w-0">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0066b2] to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mr-4 shrink-0 shadow-sm">
                   {selectedStudent.studentName.charAt(0)}
                 </div>
                 <div className="min-w-0">
                   <h2 className="text-lg font-bold text-slate-900 leading-tight truncate" title={selectedStudent.studentName}>{selectedStudent.studentName}</h2>
                   <p className="text-[#0066b2] font-mono font-bold text-sm mb-1">{selectedStudent.studentRegNo}</p>
                   <p className="text-xs text-slate-500 truncate font-medium" title={selectedStudent.programName}>
                     {selectedStudent.programName}
                   </p>
                   <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                     Sem {selectedStudent.semCode} • {selectedStudent.batchCode}
                   </p>
                 </div>
               </div>
               
               {/* Section 2: Checklist */}
               <div className="flex-[1.1] p-5 md:border-r border-b md:border-b-0 border-slate-100 relative bg-white min-w-0">
                 {isCheckingEligibility ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 text-blue-500">
                       <i className="lni lni-spinner-solid animate-spin text-3xl mb-2"></i>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evaluating</p>
                    </div>
                 ) : eligibility?.alreadyIssued ? (
                    <div className="flex h-full flex-col items-center justify-center text-emerald-600">
                       <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 ring-4 ring-emerald-50/50">
                         <i className="lni lni-ticket text-3xl"></i>
                       </div>
                       <h4 className="font-bold text-lg leading-tight text-emerald-700">Ticket Issued</h4>
                    </div>
                 ) : eligibility ? (
                    <div className="flex flex-col h-full justify-center">
                       <div className="flex justify-between items-center mb-3">
                         <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                           <i className="lni lni-checkmark-circle text-emerald-600"></i> Clearance Status
                         </h3>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${term === 'Term 1' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                           {term}
                         </span>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         <ChecklistItem label="Coursework (CW)" isOk={eligibility.cwOk} />
                         <ChecklistItem label="Mock CBT" isOk={eligibility.ctOk} />
                         <ChecklistItem label="Tuition Fee" isOk={eligibility.feeOk} />
                         {term === 'Term 2' ? (
                           <ChecklistItem label="NCHE & Guild" isOk={eligibility.ncheOk !== false && eligibility.guildOk !== false} />
                         ) : (
                           <div className="flex items-center text-[11px] font-medium text-slate-400 italic bg-slate-50 rounded px-2">No extra fees for Term 1</div>
                         )}
                       </div>
                    </div>
                 ) : null}
               </div>

               {/* Section 3: Action Button */}
               <div className="w-full md:w-64 p-5 flex flex-col justify-center bg-slate-50/50 items-stretch">
                  {!eligibility?.alreadyIssued ? (
                    <>
                      <button 
                        onClick={handleIssue}
                        disabled={!eligibility?.canIssue || isIssuing || isCheckingEligibility}
                        className={`w-full py-4 rounded-xl font-bold text-[13px] uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all duration-200
                          ${eligibility?.canIssue
                            ? 'bg-[#0066b2] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                      >
                        {isIssuing ? (
                          <><i className="lni lni-spinner-solid animate-spin text-2xl"></i> Issuing...</>
                        ) : (
                          <><i className="lni lni-ticket text-3xl mb-1"></i> Issue Ticket</>
                        )}
                      </button>
                      {eligibility && !eligibility.canIssue && !isCheckingEligibility && (
                        <p className="text-center text-rose-500 text-[10px] font-bold mt-3 uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                          <i className="lni lni-cross-circle text-sm"></i> Blocked
                        </p>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={() => window.open(getHallTicketPdfUrl(selectedStudent!.studentGuid, selectedIntake, term === 'Term 1' ? 1 : 2), '_blank')}
                      className="w-full py-4 rounded-xl font-bold text-[13px] uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5"
                    >
                      <i className="lni lni-printer text-3xl mb-1"></i> Print Ticket
                    </button>
                  )}
               </div>
             </>
          )}
        </div>

        {/* Bottom: Student List */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="lni lni-users text-blue-600"></i> Students in Session
              </h3>
              <div className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {students.length} Records
              </div>
            </div>

            {selectedIntake && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkIssue}
                  disabled={isBulkIssuing}
                  className="px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkIssuing ? (
                    <><i className="lni lni-spinner-solid animate-spin"></i> Processing...</>
                  ) : (
                    <><i className="lni lni-ticket"></i> Bulk Issue All</>
                  )}
                </button>
                <button
                  onClick={() => window.open(getBulkHallTicketPdfUrl(selectedIntake, term === 'Term 1' ? 1 : 2), '_blank')}
                  className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <i className="lni lni-printer"></i> Bulk Print All
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold text-xs">Reg. No.</th>
                  <th className="py-3 px-4 font-semibold text-xs">Student</th>
                  <th className="py-3 px-4 font-semibold text-xs">Program</th>
                  <th className="py-3 px-4 font-semibold text-xs text-center">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isSearching ? (
                  <TableLoadingState colSpan={4} title="Searching records..." subtitle="Please wait while we fetch the students." />
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <i className="lni lni-search-alt text-2xl"></i>
                        </div>
                        <p className="text-sm font-medium text-slate-500">No students found</p>
                        <p className="text-xs mt-1">Try adjusting your search or selected intake.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map(student => {
                    const isSelected = selectedStudent?.studentGuid === student.studentGuid;
                    return (
                      <tr
                        key={student.studentGuid}
                        onClick={() => handleRowClick(student)}
                        className={`cursor-pointer group transition-all duration-200 ${isSelected ? 'bg-blue-50/60 shadow-[inset_3px_0_0_var(--blue)]' : 'hover:bg-slate-50'
                          }`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-mono font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-600 group-hover:text-blue-600'}`}>
                            {student.studentRegNo}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {student.studentName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-[200px]" title={student.programName}>
                          {student.programName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-[11px] font-bold ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {student.semCode}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <Pagination page={1} totalPages={1} totalCount={students.length} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}

function ChecklistItem({ label, isOk }: { label: string, isOk: boolean | null }) {
  if (isOk === null) return null;
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isOk ? 'bg-emerald-50/40 border-emerald-100/60' : 'bg-rose-50/40 border-rose-100/60'}`}>
      <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${isOk ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'}`}>
        <i className={`lni ${isOk ? 'lni-checkmark' : 'lni-close'}`}></i>
      </div>
      <span className={`text-[11px] font-semibold leading-tight ${isOk ? 'text-emerald-800' : 'text-rose-800'}`}>{label}</span>
    </div>
  )
}
