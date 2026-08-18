'use client'

import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function CwSubmissionsPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">CW Submissions</div>
          <div className="pg-sub">View submissions per subject · Enter marks (out of 25) · Prorated automatically</div>
        </div>
        <div className="pg-actions">
          <select className="px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[12px] font-medium text-slate-700 bg-white focus:outline-none focus:border-purple-600 appearance-none pr-8" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
            <option>CSE 1301 – Algorithms</option>
            <option>MGT 2101 – Business Mgmt</option>
          </select>
        </div>
      </div>

      <div className="card">
        {/* Info Banner */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-lg p-3.5 flex gap-3 text-[12.5px] items-center mb-5 mx-5 mt-5">
          <div className="font-semibold text-[#3b82f6]">Standard Model — CW Weight: 15 marks</div>
          <div className="text-[#64748b]">Raw entered out of 25 → prorated to 15 marks · Formula: (mark/25)×15</div>
        </div>

        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Reg. No.</th>
                <th>Student Name</th>
                <th>Submitted</th>
                <th>Fee Status</th>
                <th className="text-center">Raw Mark (/25)</th>
                <th className="text-center">Prorated (/15)</th>
                <th>Evaluated By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-save"></i> Save</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0031</span></td>
                <td className="text-slate-800">Amara Nkosi</td>
                <td className="text-slate-500">12 Nov</td>
                <td><span className="badge badge-green">Cleared</span></td>
                <td className="text-center">
                  <input type="number" defaultValue="21" className="w-[60px] text-center border border-slate-200 rounded-md px-2 py-1.5 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm" />
                </td>
                <td className="text-center font-bold text-purple-700">12.6</td>
                <td className="text-slate-500 leading-snug">Sarah<br/>Mugisha</td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-save"></i> Save</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0017</span></td>
                <td className="text-slate-800">Emmanuel Okello</td>
                <td className="text-slate-500">13 Nov</td>
                <td><span className="badge badge-green">Cleared</span></td>
                <td className="text-center">
                  <input type="number" defaultValue="18" className="w-[60px] text-center border border-slate-200 rounded-md px-2 py-1.5 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm" />
                </td>
                <td className="text-center font-bold text-purple-700">10.8</td>
                <td className="text-slate-500 leading-snug">Sarah<br/>Mugisha</td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm" disabled><i className="lni lni-save"></i> Save</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0044</span></td>
                <td className="text-slate-800">Grace Akello</td>
                <td className="text-slate-500">14 Nov</td>
                <td><span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Blocked</span></td>
                <td className="text-center">
                  <input type="text" placeholder="—" disabled className="w-[60px] text-center border border-slate-100 bg-slate-50 text-slate-400 rounded-md px-2 py-1.5 text-[13px] cursor-not-allowed" />
                </td>
                <td className="text-center text-slate-400">—</td>
                <td><span className="bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] px-3 py-1 rounded-full text-[10px] font-bold">Fee Incomplete</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-save"></i> Save</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0058</span></td>
                <td className="text-slate-800">
                  <div className="leading-snug">David<br/>Ssemwogerere</div>
                </td>
                <td className="text-slate-500">11 Nov</td>
                <td><span className="badge badge-green">Cleared</span></td>
                <td className="text-center">
                  <input type="number" defaultValue="25" className="w-[60px] text-center border border-slate-200 rounded-md px-2 py-1.5 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm" />
                </td>
                <td className="text-center font-bold text-purple-700">15.0</td>
                <td className="text-slate-500 leading-snug">Sarah<br/>Mugisha</td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
