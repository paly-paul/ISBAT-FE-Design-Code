'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function HallTicketIssuancePage() {
  const [term, setTerm] = useState('Term 1')

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Hall Ticket Issuance</div>
          <div className="pg-sub">Clearance panel — Issue button enabled only when all criteria are met</div>
        </div>
      </div>

      <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5 mb-5">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Term</label>
            <select 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
            </select>
          </div>
          <div className="flex-[1.5]">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Programme</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>BSc Computer Science</option>
              <option>BBA</option>
            </select>
          </div>
          <div className="flex-[1.5]">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Semester</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>Semester 1</option>
            </select>
          </div>
          <div className="flex-1">
            <input type="text" className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600" placeholder="Search" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        
        {/* Clearance Criteria */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-6">
          <div className="text-[13.5px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            Clearance Criteria 
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${term === 'Term 1' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
              {term}
            </span>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-700 font-medium">CW Submitted (Term 1)</span>
              <span className="text-green-500 bg-green-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-green-200">✓</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-700 font-medium">CBT Completed (Term 1)</span>
              <span className="text-green-500 bg-green-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-green-200">✓</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-700 font-medium">50% Fee Cleared</span>
              <span className="text-red-500 bg-red-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-red-200">✗</span>
            </div>
            
            {term === 'Term 2' && (
              <>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-700 font-medium">100% Fee Cleared</span>
                  <span className="text-red-500 bg-red-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-red-200">✗</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-700 font-medium">NCHE Fee (20,000 UGX)</span>
                  <span className="text-amber-500 bg-amber-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[11px] border border-amber-200">!</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-700 font-medium">Guild Fee (10,000 UGX/sem)</span>
                  <span className="text-red-500 bg-red-50 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-red-200">✗</span>
                </div>
              </>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-100 text-[12px] text-slate-500">
            {term === 'Term 1' ? (
              'Term 1 requires: 50% fee + CW + CBT completion.'
            ) : (
              'Term 2 requires: 100% fee + CW + CBT + NCHE fee (20,000 UGX) + Guild fee (10,000 UGX).'
            )}
          </div>
        </div>

        {/* Selected Student */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-6">
          <div className="text-[13.5px] font-bold text-slate-900 mb-5">Selected Student</div>
          
          <div className="space-y-3 mb-6">
            <div className="flex text-[13px]">
              <div className="w-[100px] text-slate-500 font-medium">Name:</div>
              <div className="font-semibold text-slate-900">Amara Nkosi</div>
            </div>
            <div className="flex text-[13px]">
              <div className="w-[100px] text-slate-500 font-medium">Reg. No.:</div>
              <div className="font-semibold text-slate-800 font-mono">BCS/2024/0031</div>
            </div>
            <div className="flex text-[13px]">
              <div className="w-[100px] text-slate-500 font-medium">Fee Paid:</div>
              <div className="font-medium text-slate-700">$125 / $250 (50%)</div>
            </div>
            <div className="flex text-[13px] items-center">
              <div className="w-[100px] text-slate-500 font-medium">CW Status:</div>
              <div><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">Submitted</span></div>
            </div>
            <div className="flex text-[13px] items-center">
              <div className="w-[100px] text-slate-500 font-medium">CBT Status:</div>
              <div><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">Submitted</span></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button className="bg-green-50 text-green-600 font-semibold text-[13px] px-4 py-2 rounded-md opacity-60 cursor-not-allowed border border-green-200">
              Issue Hall Ticket
            </button>
            <div className="text-[11px] text-red-500 mt-2 font-medium">Issue blocked — 50% fee clearance not met</div>
          </div>
        </div>

      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[13.5px] font-bold text-slate-900">Student Clearance List</div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Reg. No.</th>
                <th>Student</th>
                <th>Fee %</th>
                <th>CW</th>
                <th>CBT</th>
                <th>Clearance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm text-green-600"><i className="lni lni-ticket"></i> Issue Ticket</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0017</span></td>
                <td className="text-slate-800">Emmanuel Okello</td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">100%</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Ready</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm opacity-50 cursor-not-allowed"><i className="lni lni-ticket"></i> Issue Ticket</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0031</span></td>
                <td className="text-slate-800">Amara Nkosi</td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold">50%</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Fee Pending</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm opacity-50 cursor-not-allowed"><i className="lni lni-ticket"></i> Issue Ticket</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0044</span></td>
                <td className="text-slate-800">Grace Akello</td>
                <td><span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">60%</span></td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[10px] font-bold">✗</span></td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[10px] font-bold">✗</span></td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">CW/CBT Pending</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm text-green-600"><i className="lni lni-ticket"></i> Issue Ticket</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0058</span></td>
                <td className="text-slate-800">David Ssemwogerere</td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">100%</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓</span></td>
                <td><span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Ready</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>

    </div>
  )
}
