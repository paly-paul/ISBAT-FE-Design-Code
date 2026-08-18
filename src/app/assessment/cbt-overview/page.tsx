'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function CbtOverviewPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">CBT Overview</div>
          <div className="pg-sub">Class Test status across all subjects · 60 min · Server-side timing</div>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Subject</th>
                <th>Programme</th>
                <th>Sec A (1m)</th>
                <th>Sec B (2m)</th>
                <th>Sec C (3m)</th>
                <th>Total</th>
                <th>Scheduled</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td>
                  <span className="font-bold text-[var(--blue)] font-mono">CSE 1212</span><br/>
                  <span className="text-slate-500 text-[12px]">Data Structures</span>
                </td>
                <td className="text-slate-700">BCS Sem 1</td>
                <td className="text-slate-700">10 Q</td>
                <td className="text-slate-700">10 Q</td>
                <td className="text-slate-700">5 Q</td>
                <td className="font-semibold text-slate-800">50m</td>
                <td className="text-slate-500">10 Nov</td>
                <td className="text-slate-700 font-mono text-[12px]">62 / 62</td>
                <td><span className="badge badge-green">Complete</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td>
                  <span className="font-bold text-[var(--blue)] font-mono">CSE 1301</span><br/>
                  <span className="text-slate-500 text-[12px]">Algorithms</span>
                </td>
                <td className="text-slate-700">BCS Sem 1</td>
                <td className="text-slate-700">10 Q</td>
                <td className="text-slate-700">8 Q</td>
                <td className="text-slate-700">4 Q</td>
                <td className="font-semibold text-slate-800">50m</td>
                <td className="text-blue-500 font-medium text-[12px]">Active Now</td>
                <td className="text-slate-700 font-mono text-[12px]">38 / 62</td>
                <td><span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">In Progress</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-cog"></i> Schedule</button>
                  </ActionMenu>
                </td>
                <td>
                  <span className="font-bold text-[var(--blue)] font-mono">MGT 2101</span><br/>
                  <span className="text-slate-500 text-[12px]">Business Mgmt</span>
                </td>
                <td className="text-slate-700">BBA Sem 3</td>
                <td className="text-slate-400">—</td>
                <td className="text-slate-400">—</td>
                <td className="text-slate-400">—</td>
                <td className="text-slate-400">—</td>
                <td className="text-slate-400">Not Set</td>
                <td className="text-slate-400">—</td>
                <td><span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">Not Scheduled</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
