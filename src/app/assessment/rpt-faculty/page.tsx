'use client'
import { ScrollTable } from '@/components/ScrollTable'

export default function FacultyAssessmentSummary() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Faculty Assessment Summary</div>
          <div className="pg-sub">Pending actions and compliance status per faculty member</div>
        </div>
        <div className="pg-actions">
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[13px] px-4 py-2.5 rounded-md transition-colors shadow-sm whitespace-nowrap flex items-center gap-2">
            <i className="lni lni-download"></i> Export
          </button>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th>FACULTY</th>
                <th>SUBJECTS</th>
                <th>QP UPLOADED</th>
                <th>CW EVALUATED</th>
                <th>CBT SET</th>
                <th>REEVALS PENDING</th>
                <th>COMPLIANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-slate-900 font-bold">Tom Kizito</td>
                <td className="text-slate-700">2</td>
                <td><span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[11px] font-bold">0 / 2</span></td>
                <td className="text-slate-400">—</td>
                <td><span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[11px] font-bold">0 / 2</span></td>
                <td className="text-slate-700">0</td>
                <td><span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-red-200 whitespace-nowrap">Action Needed</span></td>
              </tr>
              <tr>
                <td className="text-slate-900 font-bold">Sarah Mugisha</td>
                <td className="text-slate-700">2</td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">2 / 2</span></td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">58 / 58</span></td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">2 / 2</span></td>
                <td className="text-slate-700">2</td>
                <td><span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200 whitespace-nowrap">Reevals Pending</span></td>
              </tr>
              <tr>
                <td className="text-slate-900 font-bold">James Ochieng</td>
                <td className="text-slate-700">1</td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">1 / 1</span></td>
                <td><span className="bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full text-[11px] font-bold">30 / 51</span></td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">1 / 1</span></td>
                <td className="text-slate-700">2</td>
                <td><span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200 whitespace-nowrap">Evaluating</span></td>
              </tr>
              <tr>
                <td className="text-slate-900 font-bold">Fatuma Wanjiku</td>
                <td className="text-slate-700">1</td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">1 / 1</span></td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">35 / 35</span></td>
                <td><span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[11px] font-bold">1 / 1</span></td>
                <td className="text-slate-700">1</td>
                <td><span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-green-200 whitespace-nowrap">On Track</span></td>
              </tr>
              <tr>
                <td className="text-slate-900 font-bold">Joseph Ayuma</td>
                <td className="text-slate-700">1</td>
                <td><span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[11px] font-bold">0 / 1</span></td>
                <td className="text-slate-400">—</td>
                <td><span className="bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full text-[11px] font-bold">Partial</span></td>
                <td className="text-slate-700">0</td>
                <td><span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-red-200 whitespace-nowrap">Action Needed</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
