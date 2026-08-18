'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'

export default function MarkEntryCwPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Mark Entry — Coursework</div>
          <div className="pg-sub">Enter raw marks out of 25 · Prorated automatically to course weightage</div>
        </div>
        <div className="pg-actions flex items-center gap-3">
          <SearchSelect
                options={[
                  'CSE 1301 - Algorithms (Standard/15m)'
                ]}
                className="w-full"
              />
          <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[13px] px-5 py-2.5 rounded-md transition-colors shadow-sm whitespace-nowrap">
            Save All Marks
          </button>
        </div>
      </div>

      <div className="card mb-5">
        <div className="p-5 pb-0">
          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-md p-3 flex gap-3 text-[13px] text-[#6d28d9] items-center font-medium mb-4">
            Standard Model · CW Weightage: 15 marks · Proration: (raw/25)×15
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th>REG. NO.</th>
                <th>STUDENT NAME</th>
                <th>SUBMISSION</th>
                <th>SPONSORED</th>
                <th>FEE %</th>
                <th>RAW (/25)</th>
                <th>PRORATED (/15)</th>
                <th>SUBMITTED BY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-slate-500 text-[12.5px]">BCS/2024/0031</td>
                <td className="text-slate-800">Amara Nkosi</td>
                <td><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">Submitted</span></td>
                <td className="text-slate-600">No</td>
                <td className="text-slate-800 font-medium">100%</td>
                <td>
                  <input type="text" className="w-[60px] px-2 py-1 border border-slate-200 rounded text-center text-[13px] focus:outline-none focus:border-purple-500" defaultValue="21" />
                </td>
                <td className="text-purple-700 font-bold">12.6</td>
                <td className="text-slate-500">Sarah Mugisha</td>
              </tr>
              <tr>
                <td className="font-mono text-slate-500 text-[12.5px]">BCS/2024/0017</td>
                <td className="text-slate-800">Emmanuel Okello</td>
                <td><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">Submitted</span></td>
                <td className="text-slate-600">No</td>
                <td className="text-slate-800 font-medium">100%</td>
                <td>
                  <input type="text" className="w-[60px] px-2 py-1 border border-slate-200 rounded text-center text-[13px] focus:outline-none focus:border-purple-500" defaultValue="18" />
                </td>
                <td className="text-purple-700 font-bold">10.8</td>
                <td className="text-slate-500">Sarah Mugisha</td>
              </tr>
              <tr>
                <td className="font-mono text-slate-500 text-[12.5px]">BCS/2024/0044</td>
                <td className="text-slate-800">Grace Akello</td>
                <td><span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[11px] font-semibold">Blocked</span></td>
                <td className="text-slate-600">No</td>
                <td className="text-red-500 font-medium">30%</td>
                <td>
                  <input type="text" className="w-[60px] px-2 py-1 border border-slate-200 bg-slate-50 rounded text-center text-[13px] text-slate-400 cursor-not-allowed" defaultValue="—" disabled />
                </td>
                <td className="text-purple-700 font-bold">—</td>
                <td className="text-slate-500">—</td>
              </tr>
              <tr>
                <td className="font-mono text-slate-500 text-[12.5px]">BCS/2024/0099</td>
                <td className="text-slate-800">Peter Ssali</td>
                <td><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">Submitted</span></td>
                <td><span className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-md text-[11px] font-semibold">Yes</span></td>
                <td className="text-slate-500 font-medium">Exempt</td>
                <td>
                  <input type="text" className="w-[60px] px-2 py-1 border border-slate-200 rounded text-center text-[13px] focus:outline-none focus:border-purple-500" defaultValue="23" />
                </td>
                <td className="text-purple-700 font-bold">13.8</td>
                <td className="text-slate-500">Sarah Mugisha</td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
